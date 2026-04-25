const { PrismaClient } = require('../generated/client');

const globalForPrisma = global;

const prisma = globalForPrisma.__nexusopsPrisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__nexusopsPrisma = prisma;
}

module.exports = {
  prisma,
};
