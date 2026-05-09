const dashboardService = require('../services/dashboard.service');
const { prisma } = require('../lib/prisma');

exports.getStats = async (req, res) => {
  const stats = await dashboardService.getStats(req.workspace_id);
  res.json(stats);
};

exports.getTimeline = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const timeline = await dashboardService.getTimeline(req.workspace_id, limit);
  res.json(timeline);
};

exports.getIncidentTimeSeries = async (req, res) => {
  const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
  const series = await dashboardService.getIncidentTimeSeries(req.workspace_id, days);
  res.json(series);
};

// Slack থেকে ingested messages — Personal Hub Mentions panel-এ দেখানোর জন্য
exports.getMentions = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const chunks = await prisma.documentChunk.findMany({
    where: {
      workspace_id: req.workspace_id,
      source_type: 'slack',
      text: { not: '' },
    },
    orderBy: [{ timestamp: 'desc' }, { created_at: 'desc' }],
    take: limit,
    select: {
      id: true,
      text: true,
      sender: true,
      timestamp: true,
      channel_name: true,
      created_at: true,
      metadata: true,
    },
  });

  // Frontend-এর Mention type-এ match করার জন্য shape করা
  const mentions = chunks.map(chunk => ({
    id: chunk.id,
    from: chunk.sender || (chunk.metadata?.sender) || 'unknown',
    message: chunk.text.slice(0, 300), // long message truncate
    timestamp: chunk.timestamp || chunk.created_at,
    channel: chunk.channel_name || chunk.metadata?.channel_id || null,
    unread: true, // DB-তে read tracking নেই — default unread
  }));

  res.json(mentions);
};

// Real tasks from Task table — Personal Hub Tasks panel-এ দেখানোর জন্য
exports.getMyTasks = async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const tasks = await prisma.task.findMany({
    where: {
      workspace_id: req.workspace_id,
      status: { not: 'done' },
    },
    orderBy: [{ priority: 'asc' }, { detected_at: 'desc' }],
    take: limit,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      assignee_hint: true,
      detected_at: true,
      source_preview: true,
    },
  });

  res.json(tasks);
};