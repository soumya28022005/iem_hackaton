const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { AppError } = require('../lib/http');
const { config } = require('../lib/config');
const memoryService = require('../services/memory.service');
const jiraService = require('../services/jira.service');
const telegramService = require('../services/telegram.service');
const { requireWorkspaceAccess } = require('../middleware/auth');

exports.getSources = async (req, res) => {
  const sources = await prisma.source.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { created_at: 'desc' },
  });
  res.json(sources);
};

exports.ingestDocument = async (req, res) => {
  const input = z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1),
    source_type: z.string().default('document'),
    content: z.string().optional(),
    metadata: z.record(z.any()).optional().default({}),
  }).parse(req.body);

  const source = input.content
    ? await memoryService.ingestText({
      workspaceId: input.workspace_id,
      name: input.name,
      sourceType: input.source_type,
      text: input.content,
      metadata: input.metadata,
    })
    : await memoryService.createSource({
      workspaceId: input.workspace_id,
      name: input.name,
      sourceType: input.source_type,
      metadata: input.metadata,
    });

  res.status(201).json(source);
};

exports.ingestFile = async (req, res) => {
  const workspaceId = req.body.workspace_id || req.body.workspaceId || req.query.workspace_id;
  if (!workspaceId) throw new AppError(400, 'workspace_id is required');
  
  // We need to manually trigger workspace access check here because of how multer works
  req.params.workspaceId = workspaceId;
  await new Promise((resolve, reject) => requireWorkspaceAccess(req, res, (err) => (err ? reject(err) : resolve())));

  if (!req.file) throw new AppError(400, 'No file uploaded');
  const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
  const source = await memoryService.ingestFile({ workspaceId, file: req.file, metadata });
  res.status(201).json({ message: 'Document ingested successfully', source });
};

exports.ingestAudio = async (req, res) => {
  const workspaceId = req.body.workspace_id || req.body.workspaceId || req.query.workspace_id;
  if (!workspaceId) throw new AppError(400, 'workspace_id is required');

  req.params.workspaceId = workspaceId;
  await new Promise((resolve, reject) => requireWorkspaceAccess(req, res, (err) => (err ? reject(err) : resolve())));

  if (!req.file) throw new AppError(400, 'No audio file uploaded');
  const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
  const source = await memoryService.ingestFile({
    workspaceId,
    file: req.file,
    metadata: { ...metadata, source_type: 'voice' },
  });
  res.status(201).json({ message: 'Audio ingested successfully', source });
};

exports.query = async (req, res) => {
  const question = req.body.query || req.body.question || req.query.query || req.query.question;
  if (!question) throw new AppError(400, 'query is required');
  
  const result = await memoryService.queryMemory({
    workspaceId: req.workspace_id,
    question: String(question),
    userId: req.user.id,
  });
  res.json(result);
};

exports.getTasks = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { detected_at: 'desc' },
  });
  res.json(tasks);
};

exports.updateTask = async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) throw new AppError(404, 'Task not found');
  
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: task.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const input = z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
    description: z.string().optional(),
  }).parse(req.body);

  const updatedTask = await prisma.task.update({ where: { id: req.params.id }, data: input });
  res.json(updatedTask);
};

exports.syncTaskToJira = async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.id } });
  if (!task) throw new AppError(404, 'Task not found');

  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: task.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const updatedTask = await jiraService.syncTaskToJira(req.params.id);
  res.json(updatedTask);
};

exports.telegramWebhook = async (req, res) => {
  const token = req.params.token || req.query.token || req.headers['x-telegram-bot-api-secret-token'];
  if (config.TELEGRAM_BOT_TOKEN && token && token !== config.TELEGRAM_BOT_TOKEN) {
    throw new AppError(401, 'Invalid Telegram webhook token');
  }

  const result = await telegramService.handleTelegramUpdate(req.body);
  res.json({ status: result.ingested ? 'ingested' : 'skipped', ...result });
};

exports.getProblems = async (req, res) => {
  const problems = await prisma.problem.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { last_seen: 'desc' },
  });
  res.json(problems);
};

exports.detectProblems = async (req, res) => {
  const problemService = require('../services/problem.service');
  const problems = await problemService.detectRecurringProblems(req.workspace_id);
  res.json(problems);
};
