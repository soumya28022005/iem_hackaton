/**
 * taskDetection.service.js
 *
 * Place this file at:  backend/src/services/memory/taskDetection.service.js
 *
 * What it does:
 *  - Parses any incoming Slack / Telegram message
 *  - Detects @mentions  →  tagged user becomes assignee_hint
 *  - Detects deadline phrases like "7d", "3 days", "by Friday", "in 2 weeks"
 *  - Creates a Task row in the DB for each tagged person
 *
 * Call `autoCreateTasksFromMessage(prisma, workspaceId, message, sourceChunkId)`
 * right after you save a new DocumentChunk.
 */

const { PrismaClient } = require("../../generated/client");

// ─── Deadline parser ─────────────────────────────────────────────────────────

/**
 * Extracts a due date from free-form text.
 * Returns a Date object or null.
 *
 * Supported patterns (case-insensitive):
 *   7d  /  7 days  /  in 7 days
 *   2w  /  2 weeks /  in 2 weeks
 *   3h  /  3 hours
 *   by tomorrow / by Friday / by Monday ...
 */
function extractDueDate(text) {
  const now = new Date();

  // Pattern 1 — numeric shorthand:  7d  |  7 days  |  in 7 days
  const numericPattern =
    /\b(?:in\s+)?(\d+)\s*(d|days?|w|weeks?|h|hours?)\b/i;
  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    const n = parseInt(numericMatch[1], 10);
    const unit = numericMatch[2].toLowerCase();
    const due = new Date(now);
    if (unit.startsWith("h")) due.setHours(due.getHours() + n);
    else if (unit.startsWith("w")) due.setDate(due.getDate() + n * 7);
    else due.setDate(due.getDate() + n); // days
    return due;
  }

  // Pattern 2 — "by <day>" or "by tomorrow"
  const byPattern = /\bby\s+(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const byMatch = text.match(byPattern);
  if (byMatch) {
    const word = byMatch[1].toLowerCase();
    const due = new Date(now);
    if (word === "tomorrow") {
      due.setDate(due.getDate() + 1);
      return due;
    }
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = days.indexOf(word);
    if (targetDay !== -1) {
      const currentDay = due.getDay();
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7; // always next occurrence
      due.setDate(due.getDate() + diff);
      return due;
    }
  }

  return null;
}

// ─── Mention extractor ───────────────────────────────────────────────────────

/**
 * Returns all @mentions found in the text.
 *
 * Handles:
 *   @username          →  "username"
 *   <@U0B2PM7RL10>    →  Slack user-ID mention (kept as-is for now)
 */
function extractMentions(text) {
  const mentions = [];

  // Plain @username
  const plainPattern = /@([a-zA-Z0-9._-]+)/g;
  let m;
  while ((m = plainPattern.exec(text)) !== null) {
    mentions.push(m[1]);
  }

  return [...new Set(mentions)]; // deduplicate
}

// ─── Task text builder ───────────────────────────────────────────────────────

/**
 * Derives a short task title from the message text.
 * Strips mention noise, trims to 200 chars.
 */
function buildTitle(text) {
  return text
    .replace(/<@[A-Z0-9]+>/g, "") // remove Slack user-ID mentions
    .replace(/@[a-zA-Z0-9._-]+/g, "") // remove plain @mentions
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

// ─── Priority guesser ────────────────────────────────────────────────────────

function guessPriority(text) {
  const lower = text.toLowerCase();
  if (/urgent|asap|immediately|critical|blocker/.test(lower)) return "high";
  if (/soon|today|tonight/.test(lower)) return "medium";
  return "low";
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Call this after saving a DocumentChunk.
 *
 * @param {PrismaClient} prisma
 * @param {string}       workspaceId
 * @param {string}       messageText   - raw message body
 * @param {string}       sender        - display name of the sender
 * @param {string|null}  sourceChunkId - DocumentChunk.id (can be null)
 * @returns {Promise<Task[]>}           - created tasks (one per mention)
 */
async function autoCreateTasksFromMessage(
  prisma,
  workspaceId,
  messageText,
  sender,
  sourceChunkId = null
) {
  const mentions = extractMentions(messageText);

  // Only create tasks when there's at least one @mention
  if (mentions.length === 0) return [];

  const dueDate = extractDueDate(messageText);
  const title = buildTitle(messageText);
  const priority = guessPriority(messageText);
  const sourcePreview = messageText.slice(0, 500);

  const createdTasks = [];

  for (const mention of mentions) {
    // Avoid duplicate: same workspace + same chunk + same assignee
    if (sourceChunkId) {
      const existing = await prisma.task.findFirst({
        where: {
          workspace_id: workspaceId,
          source_chunk_id: sourceChunkId,
          assignee_hint: mention,
        },
      });
      if (existing) continue;
    }

    const task = await prisma.task.create({
      data: {
        workspace_id: workspaceId,
        title: title || `Task assigned to @${mention}`,
        description: `Assigned by ${sender || "someone"} via message`,
        status: "detected",
        priority,
        assignee_hint: mention,
        deadline_hint: dueDate ? formatDeadlineHint(dueDate) : null,
        due_date: dueDate ?? null,        // ← new DB column (see migration below)
        source_chunk_id: sourceChunkId,
        source_preview: sourcePreview,
      },
    });

    createdTasks.push(task);
  }

  return createdTasks;
}

/** e.g. "2025-05-16 (7 days)" */
function formatDeadlineHint(date) {
  const days = Math.round((date - new Date()) / 86_400_000);
  const dateStr = date.toISOString().slice(0, 10);
  if (days === 0) return `${dateStr} (today)`;
  if (days === 1) return `${dateStr} (tomorrow)`;
  return `${dateStr} (${days} days)`;
}

module.exports = { autoCreateTasksFromMessage, extractMentions, extractDueDate };