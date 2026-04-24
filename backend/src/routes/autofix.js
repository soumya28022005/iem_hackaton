const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { verifyAuth, requireWorkspaceAccess } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../lib/http');
const { enqueueAutofix } = require('../workers/queue');

const router = express.Router();

router.use(verifyAuth);

router.get('/repos/', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const repos = await prisma.repository.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { created_at: 'desc' },
  });
  res.json(repos);
}));

router.post('/repos/connect', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const input = z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1).optional(),
    full_name: z.string().min(1),
    default_branch: z.string().default('main'),
    github_token: z.string().optional(),
    language: z.string().optional(),
    is_private: z.boolean().optional().default(false),
  }).parse(req.body);

  const repo = await prisma.repository.create({
    data: {
      workspace_id: input.workspace_id,
      name: input.name || input.full_name.split('/').pop(),
      full_name: input.full_name,
      default_branch: input.default_branch,
      branch: input.default_branch,
      github_token: input.github_token,
      language: input.language,
      is_private: input.is_private,
    },
  });

  res.status(201).json(repo);
}));

router.delete('/repos/:id', asyncHandler(async (req, res) => {
  const repo = await prisma.repository.findUnique({ where: { id: req.params.id } });
  if (!repo) throw new AppError(404, 'Repository not found');
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: repo.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }
  await prisma.repository.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

router.get('/incidents/', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const incidents = await prisma.incident.findMany({
    where: { workspace_id: req.workspace_id },
    orderBy: { created_at: 'desc' },
    include: { fixes: { orderBy: { created_at: 'desc' }, take: 1 } },
  });
  res.json(incidents);
}));

router.post('/incidents/manual', requireWorkspaceAccess, asyncHandler(async (req, res) => {
  const input = z.object({
    workspace_id: z.string().uuid(),
    repository_id: z.string().uuid().optional().nullable(),
    error_type: z.string().optional().default('Manual Incident'),
    error_message: z.string().min(1),
    stack_trace: z.string().optional().default(''),
    severity: z.string().default('medium'),
    environment: z.string().default('production'),
  }).parse(req.body);

  const incident = await prisma.incident.create({
    data: {
      workspace_id: input.workspace_id,
      repository_id: input.repository_id || null,
      raw_error: input.error_message,
      raw_stack_trace: input.stack_trace,
      error_type: input.error_type,
      error_message: input.error_message,
      stack_trace: input.stack_trace,
      severity: input.severity,
      environment: input.environment,
      source: 'manual',
      status: 'received',
    },
  });

  await enqueueAutofix(incident.id);
  res.status(201).json(incident);
}));

router.get('/incidents/:id', asyncHandler(async (req, res) => {
  const incident = await prisma.incident.findUnique({
    where: { id: req.params.id },
    include: {
      repository: true,
      fixes: { orderBy: { created_at: 'desc' } },
    },
  });
  if (!incident) throw new AppError(404, 'Incident not found');
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }
  res.json(incident);
}));

router.patch('/incidents/:id/status', asyncHandler(async (req, res) => {
  const status = req.query.status || req.body.status;
  if (!status) throw new AppError(400, 'status is required');

  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) throw new AppError(404, 'Incident not found');
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const data = { status: String(status) };
  if (status === 'resolved') data.resolved_at = new Date();
  res.json(await prisma.incident.update({ where: { id: req.params.id }, data }));
}));

router.post('/incidents/:id/retry', asyncHandler(async (req, res) => {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) throw new AppError(404, 'Incident not found');
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const updated = await prisma.incident.update({
    where: { id: req.params.id },
    data: { status: 'received', pipeline_error: null },
  });
  await enqueueAutofix(updated.id);
  res.json(updated);
}));

router.get('/fixes/incident/:incidentId', asyncHandler(async (req, res) => {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.incidentId } });
  if (!incident) throw new AppError(404, 'Incident not found');
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const fixes = await prisma.fix.findMany({
    where: { incident_id: req.params.incidentId },
    orderBy: { created_at: 'desc' },
  });
  res.json(fixes);
}));

module.exports = router;
