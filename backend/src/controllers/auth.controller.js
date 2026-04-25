const { z } = require('zod');
const authService = require('../services/auth.service');
const { AppError } = require('../lib/http');

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional().default(''),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

exports.register = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
};

exports.login = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json(result);
};

exports.syncFirebase = async (req, res) => {
  const idToken = req.body.id_token || req.body.idToken;
  if (!idToken) throw new AppError(400, 'id_token is required');
  const result = await authService.syncFirebase(idToken);
  res.json(result);
};

exports.syncGithub = async (req, res) => {
  const token = req.query.code || req.query.token || req.query.access_token;
  if (!token) throw new AppError(400, 'GitHub access token is required');
  const result = await authService.syncGithub(String(token));
  res.json(result);
};

exports.syncGoogle = async (req, res) => {
  const token = req.query.token || req.query.code || req.query.access_token;
  if (!token) throw new AppError(400, 'Google access token is required');
  const result = await authService.syncGoogle(String(token));
  res.json(result);
};
