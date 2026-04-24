const { prisma } = require('../lib/prisma');
const { uniqueSlug } = require('../utils/slug');

async function ensureDefaultWorkspace(user) {
  const existing = await prisma.workspace.findFirst({
    where: {
      OR: [
        { owner_id: user.id },
        { members: { some: { user_id: user.id } } },
      ],
    },
    orderBy: { created_at: 'asc' },
  });

  if (existing) return existing;

  const slug = await uniqueSlug(prisma, `${user.name || user.email.split('@')[0]} team`);

  return prisma.workspace.create({
    data: {
      name: `${user.name || 'My'} Team`,
      slug,
      owner_id: user.id,
      members: {
        create: {
          user_id: user.id,
          role: 'admin',
        },
      },
    },
  });
}

async function userHasWorkspace(userId, workspaceId) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: {
        workspace_id: workspaceId,
        user_id: userId,
      },
    },
  });

  return Boolean(membership);
}

module.exports = {
  ensureDefaultWorkspace,
  userHasWorkspace,
};
