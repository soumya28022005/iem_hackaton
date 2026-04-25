const express = require('express');
const workspaceController = require('../controllers/workspace.controller');
const { verifyAuth } = require('../middleware/auth');
const { asyncHandler } = require('../lib/http');

const router = express.Router();

router.use(verifyAuth);

router.get('/', asyncHandler(workspaceController.getWorkspaces));
router.get('/:id', asyncHandler(workspaceController.getWorkspaceById));
router.post('/', asyncHandler(workspaceController.createWorkspace));

module.exports = router;
