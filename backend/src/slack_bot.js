const { App } = require('@slack/bolt');
const { handleSlackMessage } = require('./services/slack.service');

let slackApp;

function initSlackBot() {
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN) {
    console.warn('⚠️ SLACK_BOT_TOKEN or SLACK_APP_TOKEN not configured. Slack bot will not start.');
    return null;
  }

  slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
  });

  // Slack theke message asle eta triggar hobe
  slackApp.message(async ({ message, client }) => {
    try {
      const result = await handleSlackMessage({ message, client });
      if (result && result.ingested) {
        console.log(`[Slack Bot] Ingested message from channel ${message.channel} for workspace ${result.workspace_id}`);
      }
    } catch (error) {
      console.error('[Slack Bot] Error handling message:', error.message);
    }
  });

  slackApp.error((error) => {
    console.error('[Slack Bot] Global error:', error);
  });

  return slackApp;
}

async function startSlackBot() {
  if (!slackApp) initSlackBot();
  if (!slackApp) return;

  try {
    await slackApp.start();
    console.log('✅ Slack bot started (Socket Mode)');
  } catch (error) {
    console.error('❌ Failed to start Slack bot:', error.message);
  }
}

module.exports = {
  initSlackBot,
  startSlackBot,
  getSlackApp: () => slackApp,
};