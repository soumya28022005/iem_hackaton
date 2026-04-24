const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { prisma } = require('../lib/prisma');
const { config } = require('../lib/config');
const { extractJsonObject } = require('../utils/json');
const { similaritySearch } = require('./memory/memory.service');

const SECRET_PATTERNS = [
  { name: 'jwt', pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { name: 'api_key', pattern: /\b(?:sk|pk|ghp|github_pat|xoxb|xoxp|AKIA)[A-Za-z0-9_\-]{16,}\b/g },
  { name: 'database_url', pattern: /\b(?:postgres|mysql|mongodb|redis):\/\/[^\s]+/gi },
  { name: 'email', pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  { name: 'ipv4', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { name: 'password_assignment', pattern: /(password|passwd|pwd|secret|token)\s*[:=]\s*["']?[^"'\s]+/gi },
];

const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,
  /child_process/,
  /execSync/,
  /eval\s*\(/,
  /new Function\s*\(/,
  /DROP\s+TABLE/i,
  /DELETE\s+FROM/i,
  /process\.env\s*=/,
];

function sanitizeText(value) {
  let text = String(value || '');
  const replacements = [];

  for (const item of SECRET_PATTERNS) {
    const before = text;
    text = text.replace(item.pattern, `[REDACTED_${item.name.toUpperCase()}]`);
    if (before !== text) replacements.push(item.name);
  }

  return { text, replacements };
}

function parseStackFiles(stackTrace) {
  const text = String(stackTrace || '');
  const matches = new Set();
  const patterns = [
    /\(([^():\s]+\.(?:js|ts|jsx|tsx|py|java|go|rb)):(\d+):?(\d+)?\)/g,
    /\bat\s+([^():\s]+\.(?:js|ts|jsx|tsx|py|java|go|rb)):(\d+):?(\d+)?/g,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(text);
    while (match) {
      matches.add(match[1]);
      match = pattern.exec(text);
    }
  }

  return Array.from(matches).slice(0, 8);
}

async function invokeJson(promptTemplate, input, fallback) {
  if (!config.GROQ_API_KEY) return fallback;

  const llm = new ChatGroq({
    apiKey: config.GROQ_API_KEY,
    model: config.GROQ_MODEL,
  });
  const chain = ChatPromptTemplate.fromTemplate(promptTemplate).pipe(llm);
  const response = await chain.invoke(input);
  return extractJsonObject(response.content, fallback);
}

async function analyzeIncident(incident) {
  const fallbackFiles = parseStackFiles(incident.sanitized_stack_trace || incident.stack_trace);
  const fallback = {
    root_cause: 'The incident needs human review. Automated analysis could not be completed.',
    explanation: incident.sanitized_error || incident.error_message || 'No error details provided.',
    affected_files: fallbackFiles,
    keywords: [
      incident.error_type,
      ...String(incident.error_message || '').split(/\s+/).slice(0, 4),
      ...fallbackFiles.map((file) => file.split('/').pop()),
    ].filter(Boolean).slice(0, 8),
    confidence: 0.35,
  };

  return invokeJson(`
Analyze this production incident and return ONLY valid JSON:
{{
  "root_cause": "short root cause",
  "explanation": "detailed but concise explanation",
  "affected_files": ["path/from/stack.js"],
  "keywords": ["keyword"],
  "confidence": 0.0
}}

Error type: {errorType}
Error: {error}
Stack trace: {stackTrace}
`, {
    errorType: incident.error_type || 'Unknown',
    error: incident.sanitized_error || incident.error_message || '',
    stackTrace: incident.sanitized_stack_trace || incident.stack_trace || '',
  }, fallback);
}

async function buildMemoryContext(incident, analysis) {
  const affectedFiles = Array.isArray(analysis.affected_files) ? analysis.affected_files : [];
  const query = [...(analysis.keywords || []), ...affectedFiles.map((file) => String(file).split('/').pop())]
    .filter(Boolean)
    .join(' ');

  if (!query.trim()) {
    return {
      related_discussions: [],
      query: '',
      matches_found: 0,
      insight: 'No memory query could be built from the incident analysis.',
    };
  }

  const matches = await similaritySearch(incident.workspace_id, query, 3).catch(() => []);
  return {
    related_discussions: matches.map((match) => match.text.slice(0, 300)),
    query,
    matches_found: matches.length,
    insight: matches.length
      ? `Found ${matches.length} related team memory item(s) for this incident.`
      : 'No related team discussions found in memory.',
  };
}

async function generateFix(incident, analysis, memoryContext) {
  const fallback = {
    title: `Review fix for ${incident.error_type || 'incident'}`,
    explanation: 'NexusOps generated a safe review stub. Add repository context to produce a concrete patch.',
    diff: '',
    confidence: 0.4,
    file_changes: [],
    caveats: ['No source file contents were fetched in the MVP safe-stub pipeline.'],
  };

  return invokeJson(`
You are generating a safe proposed fix for a production incident.
Return ONLY valid JSON:
{{
  "title": "short title",
  "explanation": "what should change and why",
  "diff": "unified diff if possible, otherwise empty string",
  "confidence": 0.0,
  "file_changes": [{{"path":"...", "original_code":"...", "fixed_code":"...", "change_summary":"..."}}],
  "caveats": ["..."]
}}

Incident error: {error}
Analysis: {analysis}
Team memory: {memory}
`, {
    error: incident.sanitized_error || incident.error_message || '',
    analysis: JSON.stringify(analysis),
    memory: JSON.stringify(memoryContext),
  }, fallback);
}

function safetyCheck(fix) {
  const body = [
    fix.diff,
    JSON.stringify(fix.file_changes || []),
    fix.explanation,
  ].join('\n');
  const issues = DANGEROUS_PATTERNS
    .filter((pattern) => pattern.test(body))
    .map((pattern) => ({ type: 'dangerous_pattern', pattern: pattern.toString() }));

  return {
    safety_score: issues.length ? 'REVIEW_REQUIRED' : 'SAFE',
    safety_issues: issues,
  };
}

async function setIncidentStatus(id, status, data = {}) {
  return prisma.incident.update({
    where: { id },
    data: { status, ...data },
  });
}

async function processIncidentPipeline(incidentId) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: { repository: true },
  });

  if (!incident) throw new Error('Incident not found');

  try {
    await setIncidentStatus(incidentId, 'sanitizing');
    const sanitizedError = sanitizeText(incident.raw_error || incident.error_message);
    const sanitizedStack = sanitizeText(incident.raw_stack_trace || incident.stack_trace);

    await setIncidentStatus(incidentId, 'analyzing', {
      sanitized_error: sanitizedError.text,
      sanitized_stack_trace: sanitizedStack.text,
      sanitization_report: {
        replacements: Array.from(new Set([...sanitizedError.replacements, ...sanitizedStack.replacements])),
      },
    });

    const analysis = await analyzeIncident({
      ...incident,
      sanitized_error: sanitizedError.text,
      sanitized_stack_trace: sanitizedStack.text,
    });

    await setIncidentStatus(incidentId, 'querying_memory', {
      root_cause: analysis.root_cause || analysis.explanation,
      affected_files: analysis.affected_files || [],
      analysis_keywords: analysis.keywords || [],
      analysis_confidence: Number(analysis.confidence || 0.35),
    });

    const memoryContext = await buildMemoryContext(incident, analysis);

    await setIncidentStatus(incidentId, 'generating_fix', {
      memory_context: memoryContext,
    });

    const fix = await generateFix(incident, analysis, memoryContext);
    const safety = safetyCheck(fix);

    const savedFix = await prisma.fix.create({
      data: {
        incident_id: incidentId,
        title: fix.title || 'Proposed fix',
        explanation: fix.explanation || '',
        diff: fix.diff || '',
        confidence: Number(fix.confidence || 0.4),
        caveats: Array.isArray(fix.caveats) ? fix.caveats : [],
        file_changes: fix.file_changes || [],
        safety_score: safety.safety_score,
        safety_issues: safety.safety_issues,
        model_used: config.GROQ_MODEL,
        status: 'pending',
      },
    });

    await setIncidentStatus(incidentId, safety.safety_score === 'BLOCKED' ? 'fix_blocked' : 'resolved');

    await prisma.activityLog.create({
      data: {
        workspace_id: incident.workspace_id,
        module: 'autofix',
        action: 'fix_generated',
        resource_type: 'fix',
        resource_id: savedFix.id,
        metadata: { incident_id: incidentId, safety_score: safety.safety_score },
      },
    }).catch(() => null);

    return savedFix;
  } catch (error) {
    await setIncidentStatus(incidentId, 'failed', { pipeline_error: error.message }).catch(() => null);
    throw error;
  }
}

module.exports = {
  processIncidentPipeline,
  sanitizeText,
  parseStackFiles,
  safetyCheck,
};
