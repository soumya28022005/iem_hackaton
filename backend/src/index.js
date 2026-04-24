const express = require('express');
const cors = require('cors');
const { config } = require('./lib/config');
const { prisma } = require('./lib/prisma');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');
const memoryRoutes = require('./routes/memory');
const autofixRoutes = require('./routes/autofix');
const webhookRoutes = require('./routes/webhooks');
const { errorMiddleware } = require('./middleware/error');
const { startWorkers } = require('./workers/queue');

const app = express();

app.use(cors({
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true,
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    message: 'NexusOps API is running',
    docs: '/api/v1/health',
    frontend: 'http://localhost:3000'
  });
});

app.get('/health', async (_req, res) => {
  let database = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = `error: ${error.message}`;
  }

  res.json({
    status: database === 'ok' ? 'ok' : 'degraded',
    version: '1.0.0',
    database,
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspace', workspaceRoutes);
app.use('/api/v1/memory', memoryRoutes);
app.use('/api/v1/autofix', autofixRoutes);
app.use('/webhook', webhookRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorMiddleware);

if (require.main === module) {
  app.listen(config.PORT, '127.0.0.1', () => {
    console.log(`NexusOps API running on http://127.0.0.1:${config.PORT}`);
  });

  if (process.env.START_WORKERS !== 'false') {
    startWorkers().catch((err) => {
      console.warn('Worker startup error:', err.message);
    });
  }
}

module.exports = app;
