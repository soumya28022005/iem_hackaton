const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { verifyAuth, requireWorkspaceAccess } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../lib/http');
const { createSource, ingestFile, ingestText, queryMemory } = require('../services/memory/memory.service');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(verifyAuth);

router.get('/ingest/', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const sources = await prisma.source.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { created_at: 'desc' },
  });
  res.json(sources);
}));

router.post('/ingest/document', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const input = z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1),
    source_type: z.string().default('document'),
    content: z.string().optional(),
    metadata: z.record(z.any()).optional().default({}),
  }).parse(req.body);

  const source = input.content
    ? await ingestText({
      workspaceId: input.workspace_id,
      name: input.name,
      sourceType: input.source_type,
      text: input.content,
      metadata: input.metadata,
    })
    : await createSource({
      workspaceId: input.workspace_id,
      name: input.name,
      sourceType: input.source_type,
      metadata: input.metadata,
    });

  res.status(201).json(source);
}));

router.post('/ingest', upload.single('file'), asyncHandler(async (req, res) => {
  const workspaceId = req.body.workspace_id || req.body.workspaceId || req.query.workspace_id;
  if (!workspaceId) throw new AppError(400, 'workspace_id is required');
  req.params.workspaceId = workspaceId;
  await new Promise((resolve, reject) => requireWorkspaceAccess(req, res, (err) => (err ? reject(err) : resolve())));

  if (!req.file) throw new AppError(400, 'No file uploaded');
  const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
  const source = await ingestFile({ workspaceId, file: req.file, metadata });
  res.status(201).json({ message: 'Document ingested successfully', source, chunksAdded: undefined });
}));

router.get('/query/', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const question = req.query.query || req.query.question;
  if (!question) throw new AppError(400, 'query is required');
  res.json(await queryMemory({
    workspaceId: req.workspace_id,
    question: String(question),
    userId: req.user.id,
  }));
}));

router.post('/query', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const question = req.body.query || req.body.question;
  if (!question) throw new AppError(400, 'question is required');
  res.json(await queryMemory({
    workspaceId: req.workspace_id,
    question: String(question),
    userId: req.user.id,
  }));
}));

router.get('/tasks/', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { detected_at: 'desc' },
  });
  res.json(tasks);
}));

router.patch('/tasks/:id', asyncHandler(async (req, res) => {
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

  res.json(await prisma.task.update({ where: { id: req.params.id }, data: input }));
}));

router.get('/problems/', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const problems = await prisma.problem.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { last_seen: 'desc' },
  });
  res.json(problems);
}));

module.exports = router;
