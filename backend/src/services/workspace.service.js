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
      console.log(`[Workspace Debug] Existing workspace found for user: ${user.id}`);
      return existing;
    }

    const slug = await uniqueSlug(prisma, `${user.name || user.email.split('@')[0]} team`);
    const workspace = await prisma.workspace.create({
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
    console.log(`[Workspace Debug] Created default workspace for user: ${user.id}, slug: ${slug}`);
    return workspace;
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

module.exports = {
  ensureDefaultWorkspace,
  userHasWorkspace,
};
