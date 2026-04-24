const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { verifyAuth } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../lib/http');
const { ensureDefaultWorkspace, userHasWorkspace } = require('../services/workspace.service');
const { uniqueSlug } = require('../utils/slug');

const router = express.Router();

router.use(verifyAuth);

router.get('/', asyncHandler(async (req, res) => {
  await ensureDefaultWorkspace(req.user);
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { user_id: req.user.id } },
    },
    orderBy: { created_at: 'asc' },
  });

  res.json({ workspaces, total: workspaces.length });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!(await userHasWorkspace(req.user.id, req.params.id))) {
    throw new AppError(404, 'Workspace not found');
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
  res.json(workspace);
}));

router.post('/', asyncHandler(async (req, res) => {
  const input = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).optional(),
  }).parse(req.body);

  const slug = input.slug || await uniqueSlug(prisma, input.name);
  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      slug,
      owner_id: req.user.id,
      members: {
        create: {
          user_id: req.user.id,
          role: 'admin',
        },
      },
    },
  });

  res.status(201).json(workspace);
}));

module.exports = router;
