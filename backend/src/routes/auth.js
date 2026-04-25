const express = require('express');
const authController = require('../controllers/auth.controller');
const { asyncHandler } = require('../lib/http');

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/firebase', asyncHandler(authController.syncFirebase));
router.get('/github/callback', asyncHandler(authController.syncGithub));
router.get('/google/callback', asyncHandler(authController.syncGoogle));

module.exports = router;
