const IORedis = require('ioredis');
const { Queue, Worker } = require('bullmq');
const { config } = require('../lib/config');
const { processIncidentPipeline } = require('../services/autofix');

let redis;
let autofixQueue;
let autofixWorker;
let redisAvailable = false;
let redisChecked = false;

/**
 * Probe Redis once at startup. Returns true if reachable.
 * Prevents BullMQ from spamming ECONNREFUSED when Redis isn't running.
 */
async function isRedisReachable() {
  if (redisChecked) return redisAvailable;
  redisChecked = true;

  const probe = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 2000,
    retryStrategy: () => null, // no retries
  });

  try {
    await probe.connect();
    await probe.ping();
    redisAvailable = true;
    await probe.quit();
  } catch {
    redisAvailable = false;
    try { probe.disconnect(false); } catch {}
  }

  return redisAvailable;
}

function getRedis() {
  if (!redis) {
    redis = new IORedis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    // Suppress repeated connection errors — logged once at startup instead
    let errorLogged = false;
    redis.on('error', () => {
      if (!errorLogged) {
        errorLogged = true;
        // Logged once; subsequent errors silenced
      }
    });
  }
  return redis;
}

function getAutofixQueue() {
  if (!autofixQueue && redisAvailable) {
    autofixQueue = new Queue('autofix', { connection: getRedis() });
  }
  return autofixQueue;
}

async function enqueueAutofix(incidentId) {
  const queue = getAutofixQueue();
  if (queue) {
    try {
      await Promise.race([
        queue.add('process_incident', { incidentId }, {
          attempts: 2,
          backoff: { type: 'exponential', delay: 5000 },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis enqueue timeout')), 1500)),
      ]);
      return;
    } catch (error) {
      console.warn(`BullMQ enqueue failed; falling back to inline: ${error.message}`);
    }
  }

  // Inline fallback — processes without Redis
  setImmediate(() => {
    processIncidentPipeline(incidentId).catch((err) => {
      console.error(`Inline AutoFix failed for ${incidentId}:`, err);
    });
  });
}

async function startWorkers() {
  if (autofixWorker) return { autofixWorker };

  const reachable = await isRedisReachable();

  if (!reachable) {
    console.log('⚡ Redis not available — BullMQ workers disabled (inline fallback active)');
    return { autofixWorker: null };
  }

  try {
    autofixWorker = new Worker(
      'autofix',
      async (job) => processIncidentPipeline(job.data.incidentId),
      { connection: getRedis(), concurrency: 3 },
    );

    autofixWorker.on('failed', (job, error) => {
      console.error(`AutoFix job ${job?.id || 'unknown'} failed:`, error);
    });

    console.log('✅ BullMQ AutoFix worker started (Redis connected)');
  } catch (error) {
    console.warn(`BullMQ worker disabled: ${error.message}`);
  }

  return { autofixWorker };
}

module.exports = {
  getAutofixQueue,
  enqueueAutofix,
  startWorkers,
};
