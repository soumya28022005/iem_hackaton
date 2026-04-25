const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { AppError } = require('../lib/http');
const autofixService = require('../services/autofix.service');
const { enqueueAutofix } = require('../workers/queue');

exports.getRepositories = async (req, res) => {
  const repos = await autofixService.getRepositories(req.workspace_id);
  res.json(repos);
};

exports.connectRepository = async (req, res) => {
  const input = z.object({
    workspace_id: z.string().uuid(),
    name: z.string().min(1).optional(),
    full_name: z.string().min(1),
    default_branch: z.string().default('main'),
    github_token: z.string().optional(),
    language: z.string().optional(),
    is_private: z.boolean().optional().default(false),
  }).parse(req.body);

  const repo = await autofixService.connectRepository(input);
  res.status(201).json(repo);
};

exports.deleteRepository = async (req, res) => {
  const repo = await prisma.repository.findUnique({ where: { id: req.params.id } });
  if (!repo) throw new AppError(404, 'Repository not found');
  
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: repo.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  await autofixService.deleteRepository(req.params.id);
  res.status(204).end();
};

exports.getIncidents = async (req, res) => {
  const incidents = await autofixService.getIncidents(req.workspace_id);
  res.json(incidents);
};

exports.createManualIncident = async (req, res) => {
  const input = z.object({
    workspace_id: z.string().uuid(),
    repository_id: z.string().uuid().optional().nullable(),
    error_type: z.string().optional().default('Manual Incident'),
    error_message: z.string().min(1),
    stack_trace: z.string().optional().default(''),
    severity: z.string().default('medium'),
    environment: z.string().default('production'),
  }).parse(req.body);

  const incident = await autofixService.createManualIncident(input);
  await enqueueAutofix(incident.id);
  res.status(201).json(incident);
};

exports.getIncidentById = async (req, res) => {
  const incident = await autofixService.getIncidentById(req.params.id);
  if (!incident) throw new AppError(404, 'Incident not found');
  
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }
  
  res.json(incident);
};

exports.updateIncidentStatus = async (req, res) => {
  const status = req.query.status || req.body.status;
  if (!status) throw new AppError(400, 'status is required');

  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) throw new AppError(404, 'Incident not found');
  
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const updated = await autofixService.updateIncidentStatus(req.params.id, status);
  res.json(updated);
};

exports.retryIncident = async (req, res) => {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) throw new AppError(404, 'Incident not found');
  
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const updated = await autofixService.retryIncident(req.params.id);
  await enqueueAutofix(updated.id);
  res.json(updated);
};

exports.getFixesByIncidentId = async (req, res) => {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.incidentId } });
  if (!incident) throw new AppError(404, 'Incident not found');
  
  if (!(await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: incident.workspace_id, user_id: req.user.id } },
  }))) {
    throw new AppError(403, 'Forbidden');
  }

  const fixes = await autofixService.getFixesByIncidentId(req.params.incidentId);
  res.json(fixes);
};

async function requireFixAccess(fixId, userId) {
  const fix = await prisma.fix.findUnique({
    where: { id: fixId },
    include: { incident: true },
  });
  if (!fix) throw new AppError(404, 'Fix not found');

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: fix.incident.workspace_id,
        user_id: userId,
      },
    },
  });
  if (!membership) throw new AppError(403, 'Forbidden');
  return fix;
}

exports.createPR = async (req, res) => {
  const input = z.object({
    github_token: z.string().optional(),
  }).parse(req.body || {});

  await requireFixAccess(req.params.fixId, req.user.id);
  const pr = await autofixService.createPR(req.params.fixId, input.github_token);
  res.status(201).json(pr);
};

exports.reviewFix = async (req, res) => {
  const input = z.object({
    status: z.enum(['approved', 'rejected', 'needs_changes']),
    review_note: z.string().optional(),
    create_pr: z.boolean().optional().default(false),
    github_token: z.string().optional(),
  }).parse(req.body || {});

  await requireFixAccess(req.params.fixId, req.user.id);
  const fix = await autofixService.reviewFix(req.params.fixId, {
    reviewerId: req.user.id,
    status: input.status,
    reviewNote: input.review_note,
  });

  let pr = null;
  if (input.create_pr && input.status === 'approved') {
    pr = await autofixService.createPR(req.params.fixId, input.github_token);
  }

  res.json({ fix, pr });
};
