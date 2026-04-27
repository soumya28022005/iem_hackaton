const { prisma } = require('../lib/prisma');
const { ingestText } = require('./memory.service');

function extractMessageText(message) {
  return message.text || message.caption || null;
}

function getSender(message) {
  if (!message.from) return 'unknown';
  const { first_name, last_name, username } = message.from;
  return username ? `@${username}` : [first_name, last_name].filter(Boolean).join(' ') || 'unknown';
}

function getChannelName(message) {
  const chat = message.chat;
  if (!chat) return null;
  return chat.title || chat.username || String(chat.id);
}

async function findWorkspaceByChatId(chatId) {
  return prisma.workspace.findFirst({
    where: {
      OR: [
        { telegram_chat_id: String(chatId) },
        { notify_telegram_chat_id: String(chatId) },
      ],
    },
  });
}

async function handleTelegramUpdate(update) {
  const message = update.message || update.channel_post;
  if (!message) return { skipped: true, reason: 'no message' };

  const chatId = message.chat?.id;
  if (!chatId) return { skipped: true, reason: 'no chat id' };

  const workspace = await findWorkspaceByChatId(chatId);
  if (!workspace) return { skipped: true, reason: 'no workspace linked to this chat' };

  const sender = getSender(message);
  const channelName = getChannelName(message);
  const timestamp = message.date ? new Date(message.date * 1000) : new Date();
  
  // 1. Handle Voice Notes
  if (message.voice || message.audio) {
    const fileId = (message.voice || message.audio).file_id;
    const { getBot } = require('../bot');
    const bot = getBot();
    
    if (!bot) return { skipped: true, reason: 'bot not initialized' };

    const fileLink = await bot.telegram.getFileLink(fileId);
    const response = await fetch(fileLink.href);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Create a temporary file object for ingestFile
    const file = {
      originalname: `voice-${fileId.slice(0, 8)}.ogg`,
      mimetype: message.voice ? 'audio/ogg' : (message.audio.mime_type || 'audio/mpeg'),
      buffer,
      size: buffer.length,
    };

    const source = await require('./memory.service').ingestFile({
      workspaceId: workspace.id,
      file,
      metadata: {
        source_type: 'voice',
        sender,
        channel_name: channelName,
        chat_id: String(chatId),
        timestamp: timestamp.toISOString(),
      },
    });

    return { ingested: true, workspace_id: workspace.id, source_id: source.id, type: 'voice' };
  }

  // 2. Handle Text
  const text = extractMessageText(message);
  if (!text || text.trim().length < 5) return { skipped: true, reason: 'text too short' };

  const source = await ingestText({
    workspaceId: workspace.id,
    name: `Telegram: ${channelName || chatId} — ${timestamp.toISOString()}`,
    sourceType: 'telegram',
    text,
    metadata: {
      source_type: 'telegram',
      sender,
      channel_name: channelName,
      chat_id: String(chatId),
      telegram_message_id: String(message.message_id),
      timestamp: timestamp.toISOString(),
    },
  });

  return { ingested: true, workspace_id: workspace.id, source_id: source.id, type: 'text' };
}

module.exports = { handleTelegramUpdate };
