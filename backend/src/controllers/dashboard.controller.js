const dashboardService = require('../services/dashboard.service');

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
