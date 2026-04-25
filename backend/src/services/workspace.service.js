const { prisma } = require('../lib/prisma');
const { uniqueSlug } = require('../utils/slug');

async function ensureDefaultWorkspace(user) {
  try {
    const existing = await prisma.workspace.findFirst({
      where: {
        OR: [
          { owner_id: user.id },
          { members: { some: { user_id: user.id } } },
        ],
      },
      orderBy: { created_at: 'asc' },
    });

    if (existing) {
      return existing;
    }

    return await createWorkspace(user.id, {
      name: `${user.name || 'My'} Team`,
    });
  } catch (error) {
    console.error(`[Workspace Debug] ensureDefaultWorkspace failed for user ${user.id}:`, error.message);
    throw error;
  }
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

async function createWorkspace(userId, data) {
  const slug = data.slug || await uniqueSlug(prisma, data.name);
  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug,
      owner_id: userId,
      members: {
        create: {
          user_id: userId,
          role: 'admin',
        },
      },
    },
  });
  return workspace;
}

async function getUserWorkspaces(userId) {
  return await prisma.workspace.findMany({
    where: {
      members: { some: { user_id: userId } },
    },
    orderBy: { created_at: 'asc' },
  });
}

async function getWorkspaceById(workspaceId) {
  return await prisma.workspace.findUnique({ where: { id: workspaceId } });
}

module.exports = {
  ensureDefaultWorkspace,
  userHasWorkspace,
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
};
