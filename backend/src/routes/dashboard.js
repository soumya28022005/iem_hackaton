const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { verifyAuth, requireWorkspaceAccess } = require('../middleware/auth');
const { asyncHandler } = require('../lib/http');

const router = express.Router();

router.use(verifyAuth);
router.use(requireWorkspaceAccess);

router.get('/stats', asyncHandler(dashboardController.getStats));
router.get('/timeline', asyncHandler(dashboardController.getTimeline));
router.get('/incidents/series', asyncHandler(dashboardController.getIncidentTimeSeries));

module.exports = router;
