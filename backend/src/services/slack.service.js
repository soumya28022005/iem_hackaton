const { prisma } = require('../lib/prisma');
const { ingestText } = require('./memory.service');

async function findWorkspaceByChannelId(channelId) {
  return prisma.workspace.findFirst();
}

async function handleSlackMessage({ message, client }) { 
  if (message.bot_id || message.subtype === 'bot_message') return { skipped: true };

  const text = message.text;
  if (!text || text.trim().length < 5) return { skipped: true, reason: 'text too short' };

  const workspace = await findWorkspaceByChannelId(message.channel);
  if (!workspace) return { skipped: true, reason: 'no workspace found' };

  // Sender real name fetch kora
  let sender = message.user || 'unknown';
  try {
    const userInfo = await client.users.info({ user: message.user });
    const u = userInfo.user;
    sender = u.profile?.display_name_normalized
      || u.profile?.display_name
      || u.real_name
      || u.name
      || sender;
  } catch (error) {
    console.error('[Slack Service] Error fetching user info:', error.message);
  }

  // Channel name fetch kora (channels:read scope optional — gracefully skip if missing)
  let channelName = null;
  try {
    const channelInfo = await client.conversations.info({ channel: message.channel });
    channelName = channelInfo.channel?.name || null;
  } catch (error) {
    // missing_scope error suppress kora — channel name ছাড়াই ingest cholbe
    if (error.data?.error === 'missing_scope') {
      // silently skip — channel_id will be used as fallback in metadata
    } else {
      console.error('[Slack Service] Error fetching channel info:', error.message);
    }
  }

  const timestamp = new Date((message.ts || Date.now() / 1000) * 1000);

  const source = await ingestText({
    workspaceId: workspace.id,
    name: `Slack: #${channelName || message.channel} — ${timestamp.toISOString()}`,
    sourceType: 'slack',
    text,
    metadata: {
      source_type: 'slack',
      sender,
      channel_id: message.channel,
      channel_name: channelName,
      slack_message_id: message.ts,
      timestamp: timestamp.toISOString(),
    },
  });

  return { ingested: true, workspace_id: workspace.id, source_id: source.id, type: 'text' };
}

module.exports = { handleSlackMessage };