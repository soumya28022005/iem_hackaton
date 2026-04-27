const { prisma } = require('../src/lib/prisma');

async function check() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Database connected. Found users:', users.length);
    if (users.length > 0) {
      const workspaces = await prisma.workspace.findMany({ where: { owner_id: users[0].id } });
      console.log(`Workspaces for user ${users[0].email}:`, workspaces.length);
    }
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
