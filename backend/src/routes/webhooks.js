const express = require('express');
const webhookController = require('../controllers/webhook.controller');
const { asyncHandler } = require('../lib/http');

const router = express.Router();

router.post('/sentry/:workspaceId', asyncHandler(webhookController.sentryWebhook));
router.post('/error/:workspaceId', asyncHandler(webhookController.errorWebhook));
router.post('/github', asyncHandler(webhookController.githubWebhook));

module.exports = router;
