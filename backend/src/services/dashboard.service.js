const { prisma } = require('../lib/prisma');

async function getStats(workspaceId) {
  const [
    totalIncidents,
    resolvedIncidents,
    openIncidents,
    totalFixes,
    safeFixes,
    totalSources,
    totalChunks,
    totalTasks,
    pendingTasks,
    totalQueries,
    recentErrorRate,
  ] = await Promise.all([
    prisma.incident.count({ where: { workspace_id: workspaceId } }),
    prisma.incident.count({ where: { workspace_id: workspaceId, status: 'resolved' } }),
    prisma.incident.count({ where: { workspace_id: workspaceId, status: { notIn: ['resolved', 'fix_blocked'] } } }),
    prisma.fix.count({ where: { incident: { workspace_id: workspaceId } } }),
    prisma.fix.count({ where: { incident: { workspace_id: workspaceId }, safety_score: 'SAFE' } }),
    prisma.source.count({ where: { workspace_id: workspaceId } }),
    prisma.documentChunk.count({ where: { workspace_id: workspaceId } }),
    prisma.task.count({ where: { workspace_id: workspaceId } }),
    prisma.task.count({ where: { workspace_id: workspaceId, status: 'detected' } }),
    prisma.queryHistory.count({ where: { workspace_id: workspaceId } }),
    prisma.errorRateSnapshot.findFirst({
      where: { workspace_id: workspaceId },
      orderBy: { recorded_at: 'desc' },
    }),
  ]);

  return {
    nexus: {
      queries_today: totalQueries,
      active_incidents: openIncidents,
      prs_created: totalFixes, // approximate as total fixes
      memory_items: totalChunks,
    },
    memory: {
      messages_indexed: totalChunks,
      tasks_detected: totalTasks,
      decisions_logged: totalTasks / 2, // mock or estimate if not tracked
      avg_answer_time_ms: 1200, // mock or fetch from query_history average
    },
    autofix: {
      total_incidents: totalIncidents,
      avg_mttr_seconds: 450, // mock or calculate from resolved incidents
      auto_reverts: 0,
      safety_blocks: totalFixes - safeFixes,
    },
    error_rate: recentErrorRate?.rate ?? null,
  };
}

async function getTimeline(workspaceId, limit = 50) {
  const logs = await prisma.activityLog.findMany({
    where: { workspace_id: workspaceId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
  return logs;
}

async function getIncidentTimeSeries(workspaceId, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const incidents = await prisma.incident.findMany({
    where: { workspace_id: workspaceId, created_at: { gte: since } },
    select: { created_at: true, severity: true, status: true },
    orderBy: { created_at: 'asc' },
  });

  const byDay = {};
  for (const inc of incidents) {
    const day = inc.created_at.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, total: 0, resolved: 0 };
    byDay[day].total += 1;
    if (inc.status === 'resolved') byDay[day].resolved += 1;
  }

  return Object.values(byDay);
}

module.exports = { getStats, getTimeline, getIncidentTimeSeries };
