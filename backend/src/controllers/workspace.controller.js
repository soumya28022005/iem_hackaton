const { z } = require('zod');
const workspaceService = require('../services/workspace.service');
const { AppError } = require('../lib/http');

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});

exports.getWorkspaces = async (req, res) => {
  await workspaceService.ensureDefaultWorkspace(req.user);
  const workspaces = await workspaceService.getUserWorkspaces(req.user.id);
  res.json({ workspaces, total: workspaces.length });
};

exports.getWorkspaceById = async (req, res) => {
  if (!(await workspaceService.userHasWorkspace(req.user.id, req.params.id))) {
    throw new AppError(404, 'Workspace not found');
  }

  const workspace = await workspaceService.getWorkspaceById(req.params.id);
  res.json(workspace);
};

exports.createWorkspace = async (req, res) => {
  const input = createWorkspaceSchema.parse(req.body);
  const workspace = await workspaceService.createWorkspace(req.user.id, input);
  res.status(201).json(workspace);
};
