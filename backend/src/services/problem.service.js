const { ChatGroq } = require('@langchain/groq');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { prisma } = require('../lib/prisma');
const { config } = require('../lib/config');
const { extractJsonObject } = require('../utils/json');

/**
 * Periodically scans recent memory chunks to detect recurring problems or blockers.
 * This is a P1 feature for high-level team insights.
 */
async function detectRecurringProblems(workspaceId) {
  if (!config.GROQ_API_KEY) return [];

  // Fetch recent chunks from the last 24 hours
  const recentChunks = await prisma.documentChunk.findMany({
    where: {
      workspace_id: workspaceId,
      created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    take: 50,
    orderBy: { created_at: 'desc' },
  });

  if (recentChunks.length < 5) return [];

  const text = recentChunks.map(c => `[${c.source_type}]: ${c.text.slice(0, 500)}`).join('\n\n');

  const llm = new ChatGroq({ apiKey: config.GROQ_API_KEY, model: config.GROQ_MODEL });
  const prompt = ChatPromptTemplate.fromTemplate(`
    Analyze these team discussions and incidents to find recurring problems, architectural blockers, or repeating bugs.
    Return ONLY a JSON array of objects:
    [{{"title": "short title", "description": "brief explanation", "severity": "low|medium|high", "relevance_ids": ["chunk_id"]}}]
    
    If no recurring problems found, return [].
    
    Data:
    {text}
  `);

  try {
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({ text });
    const problems = extractJsonObject(response.content, []);

    if (!Array.isArray(problems)) return [];

    const saved = [];
    for (const p of problems) {
      if (!p.title) continue;

      const existingProblem = await prisma.problem.findFirst({
        where: {
          workspace_id: workspaceId,
          title: { equals: p.title, mode: 'insensitive' },
        },
      });

      if (existingProblem) {
        const updated = await prisma.problem.update({
          where: { id: existingProblem.id },
          data: {
            frequency: existingProblem.frequency + 1,
            last_seen: new Date(),
            description: p.description || existingProblem.description,
            severity: p.severity || existingProblem.severity,
            related_chunk_ids: Array.from(new Set([...existingProblem.related_chunk_ids, ...(p.relevance_ids || [])])),
          },
        });
        saved.push(updated);
      } else {
        const problem = await prisma.problem.create({
          data: {
            workspace_id: workspaceId,
            title: p.title,
            description: p.description,
            severity: p.severity || 'medium',
            status: 'open',
            related_chunk_ids: p.relevance_ids || [],
          },
        });
        saved.push(problem);
      }
    }
    return saved;
  } catch (error) {
    console.error(`Problem detection failed for workspace ${workspaceId}:`, error.message);
    return [];
  }
}

async function getProblems(workspaceId) {
  return prisma.problem.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { last_seen: 'desc' },
  });
}

async function updateProblemStatus(id, status) {
  return prisma.problem.update({
    where: { id },
    data: { status },
  });
}

module.exports = {
  detectRecurringProblems,
  getProblems,
  updateProblemStatus,
};
