const express = require('express');
const multer = require('multer');
const memoryController = require('../controllers/memory.controller');
const { verifyAuth, requireWorkspaceAccess } = require('../middleware/auth');
const { asyncHandler } = require('../lib/http');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/telegram/webhook', asyncHandler(memoryController.telegramWebhook));
router.post('/telegram/webhook/:token', asyncHandler(memoryController.telegramWebhook));

router.use(verifyAuth);

router.get('/ingest/', requireWorkspaceAccess, asyncHandler(memoryController.getSources));
router.post('/ingest/document', requireWorkspaceAccess, asyncHandler(memoryController.ingestDocument));
router.post('/ingest/audio', requireWorkspaceAccess, upload.single('file'), asyncHandler(memoryController.ingestAudio));
router.post('/ingest', requireWorkspaceAccess, upload.single('file'), asyncHandler(memoryController.ingestFile));

router.get('/query/', requireWorkspaceAccess, asyncHandler(memoryController.query));
router.post('/query', requireWorkspaceAccess, asyncHandler(memoryController.query));

router.get('/tasks/', requireWorkspaceAccess, asyncHandler(memoryController.getTasks));
router.patch('/tasks/:id', asyncHandler(memoryController.updateTask));
router.post('/tasks/:id/jira', asyncHandler(memoryController.syncTaskToJira));

router.get('/problems', requireWorkspaceAccess, asyncHandler(memoryController.getProblems));
router.post('/problems/detect', requireWorkspaceAccess, asyncHandler(memoryController.detectProblems));

module.exports = router;
