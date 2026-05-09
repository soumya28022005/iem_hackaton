const { prisma } = require('../lib/prisma');
const { ingestText } = require('./memory.service');

async function findWorkspaceByChannelId(channelId) {
  // Hackathon e quick run korar jonno amra first workspace ta niye nebo 
  // jodi kono specific slack_channel_id link kora na thake.
  let workspace = await prisma.workspace.findFirst();
  return workspace;
}

async function handleSlackMessage({ message, client }) {
  // Bot er nijer message gulo amra ignore korbo
  if (message.bot_id || message.subtype === 'bot_message') return { skipped: true };

  const text = message.text;
  if (!text || text.trim().length < 5) return { skipped: true, reason: 'text too short' };

  const workspace = await findWorkspaceByChannelId(message.channel);
  if (!workspace) return { skipped: true, reason: 'no workspace found' };

  // Slack theke User er nam ber kora
  let sender = 'unknown';
  try {
    const userInfo = await client.users.info({ user: message.user });
    sender = userInfo.user.real_name || userInfo.user.name;
  } catch (error) {
    console.error('[Slack Service] Error fetching user info', error.message);
  }

  const timestamp = new Date((message.ts || Date.now() / 1000) * 1000);

  // memory.service.js er ingestText diye memory te save kora
  const source = await ingestText({
    workspaceId: workspace.id,
    name: `Slack: ${message.channel} — ${timestamp.toISOString()}`,
    sourceType: 'slack',
    text,
    metadata: {
      source_type: 'slack',
      sender,
      channel_id: message.channel,
      slack_message_id: message.ts,
      timestamp: timestamp.toISOString(),
    },
  });

  return { ingested: true, workspace_id: workspace.id, source_id: source.id, type: 'text' };
}

module.exports = { handleSlackMessage };