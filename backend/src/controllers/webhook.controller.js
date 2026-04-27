const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { config } = require('../lib/config');
const { AppError } = require('../lib/http');
const { enqueueAutofix } = require('../workers/queue');

function getRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  return Buffer.from(JSON.stringify(req.body || {}));
}

function verifyHmac(req) {
  if (!config.SENTRY_WEBHOOK_SECRET) return true;

  const signature = req.headers['sentry-hook-signature'] || req.headers['x-nexusops-signature'];
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', config.SENTRY_WEBHOOK_SECRET)
    .update(getRawBody(req))
    .digest('hex');

  const actual = String(signature).replace(/^sha256=/, '');
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function parseSentryPayload(payload) {
  const event = payload.event || payload.data?.event || payload;
  const exception = event.exception?.values?.[0] || event.exception || {};
  const errorMessage = exception.value || event.title || event.message || event.culprit || 'Unknown error';

  return {
    error_type: exception.type || event.type || event.level || 'Sentry Error',
    error_message: errorMessage,
    stack_trace: JSON.stringify(event.exception || event.stacktrace || event, null, 2),
    severity: event.level || payload.level || 'error',
    environment: event.environment || 'production',
    external_id: event.event_id || event.id || payload.id,
  };
}

async function createIncidentFromWebhook(workspaceId, payload, source) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new AppError(404, 'Workspace not found');

  const parsed = source === 'sentry' ? parseSentryPayload(payload) : {
    error_type: payload.error_type || payload.errorType || 'Webhook Error',
    error_message: payload.error_message || payload.message || payload.error || 'No details provided',
    stack_trace: payload.stack_trace || payload.stackTrace || '',
    severity: payload.severity || 'medium',
    environment: payload.environment || 'production',
    external_id: payload.external_id || payload.id,
  };

  const incident = await prisma.incident.create({
    data: {
      workspace_id: workspaceId,
      raw_error: parsed.error_message,
      raw_stack_trace: parsed.stack_trace,
      error_type: parsed.error_type,
      error_message: parsed.error_message,
      stack_trace: parsed.stack_trace,
      severity: parsed.severity,
      environment: parsed.environment,
      external_id: parsed.external_id,
      source,
      status: 'received',
    },
  });

  await enqueueAutofix(incident.id);
  return incident;
}

exports.sentryWebhook = async (req, res) => {
  if (!verifyHmac(req)) throw new AppError(401, 'Invalid webhook signature');
  const incident = await createIncidentFromWebhook(req.params.workspaceId, req.body, 'sentry');
  res.json({ status: 'accepted', incident_id: incident.id, incidentId: incident.id });
};

exports.errorWebhook = async (req, res) => {
  if (!verifyHmac(req)) throw new AppError(401, 'Invalid webhook signature');
  const incident = await createIncidentFromWebhook(req.params.workspaceId, req.body, 'webhook');
  res.json({ status: 'accepted', incident_id: incident.id, incidentId: incident.id });
};

exports.githubWebhook = async (req, res) => {
  res.json({ status: 'received', event: req.headers['x-github-event'] || 'unknown' });
};
