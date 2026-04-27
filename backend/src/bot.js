const { Telegraf } = require('telegraf');
const { config } = require('./lib/config');
const telegramService = require('./services/telegram.service');

let bot;

function initBot() {
  if (!config.TELEGRAM_BOT_TOKEN || config.TELEGRAM_BOT_TOKEN === 'your-telegram-bot-token-here') {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured. Telegram bot will not start.');
    return null;
  }

  bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

  bot.start((ctx) => {
    ctx.reply('🚀 NexusOps Bot is active!\n\nAdd me to your team group to start ingesting knowledge and receiving incident alerts.');
  });

  bot.help((ctx) => {
    ctx.reply('I am NexusOps, your team\'s AI brain.\n\n- I remember everything discussed here.\n- I notify you about production crashes.\n- I suggest fixes for your code.');
  });

  // Handle incoming messages
  bot.on(['message', 'channel_post'], async (ctx) => {
    try {
      const result = await telegramService.handleTelegramUpdate(ctx.update);
      if (result.ingested) {
        console.log(`[Bot] Ingested message from chat ${ctx.chat.id} for workspace ${result.workspace_id}`);
      }
    } catch (error) {
      console.error('[Bot] Error handling update:', error.message);
    }
  });

  bot.catch((err, ctx) => {
    console.error(`[Bot] Error for ${ctx.updateType}:`, err);
  });

  return bot;
}

async function startBot() {
  if (!bot) initBot();
  if (!bot) return;

  try {
    bot.launch();
    console.log('✅ Telegram bot started (polling mode)');
  } catch (error) {
    console.error('❌ Failed to start Telegram bot:', error.message);
  }
}

module.exports = {
  initBot,
  startBot,
  getBot: () => bot,
};
