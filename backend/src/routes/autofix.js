const express = require('express');
const autofixController = require('../controllers/autofix.controller');
const { verifyAuth, requireWorkspaceAccess } = require('../middleware/auth');
const { asyncHandler } = require('../lib/http');

const router = express.Router();

router.use(verifyAuth);

router.get('/repos/', requireWorkspaceAccess, asyncHandler(autofixController.getRepositories));
router.post('/repos/connect', requireWorkspaceAccess, asyncHandler(autofixController.connectRepository));
router.delete('/repos/:id', asyncHandler(autofixController.deleteRepository));

router.get('/incidents/', requireWorkspaceAccess, asyncHandler(autofixController.getIncidents));
router.post('/incidents/manual', requireWorkspaceAccess, asyncHandler(autofixController.createManualIncident));
router.get('/incidents/:id', asyncHandler(autofixController.getIncidentById));
router.patch('/incidents/:id/status', asyncHandler(autofixController.updateIncidentStatus));
router.post('/incidents/:id/retry', asyncHandler(autofixController.retryIncident));

router.get('/fixes/incident/:incidentId', asyncHandler(autofixController.getFixesByIncidentId));
router.post('/fixes/:fixId/create-pr', asyncHandler(autofixController.createPR));
router.post('/fixes/:fixId/review', asyncHandler(autofixController.reviewFix));

router.get('/reverts/', requireWorkspaceAccess, asyncHandler(autofixController.getRevertHistory));
router.post('/reverts/trigger', requireWorkspaceAccess, asyncHandler(autofixController.triggerRevert));

module.exports = router;
