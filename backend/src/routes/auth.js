const express = require('express');
const { z } = require('zod');
const authService = require('../services/auth.service');
const { asyncHandler, AppError } = require('../lib/http');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional().default(''),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  res.status(201).json(await authService.register(input));
}));

router.post('/login', asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);
  res.json(await authService.login(input));
}));

router.post('/firebase', asyncHandler(async (req, res) => {
  const idToken = req.body.id_token || req.body.idToken;
  if (!idToken) throw new AppError(400, 'id_token is required');
  res.json(await authService.syncFirebase(idToken));
}));

router.get('/github/callback', asyncHandler(async (req, res) => {
  const token = req.query.code || req.query.token || req.query.access_token;
  if (!token) throw new AppError(400, 'GitHub access token is required');
  res.json(await authService.syncGithub(String(token)));
}));

router.get('/google/callback', asyncHandler(async (req, res) => {
  const token = req.query.token || req.query.code || req.query.access_token;
  if (!token) throw new AppError(400, 'Google access token is required');
  res.json(await authService.syncGoogle(String(token)));
}));

module.exports = router;
