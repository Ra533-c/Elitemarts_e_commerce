import TelegramBot from 'node-telegram-bot-api';

// Environment validation
const validateEnv = () => {
    const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.warn(`⚠️ Missing Telegram env variables: ${missing.join(', ')}`);
        return null;
    }

    return {
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID,
        VERCEL_URL: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'elitemarts-webhook-secret'
    };
};

const env = validateEnv();

// Production mein webhook mode, development mein polling disabled (webhook only)
const isDevelopment = process.env.NODE_ENV === 'development';

let bot = null;
let WEBHOOK_URL = null;

// Initialize bot only if environment variables are present
if (env) {
    try {
        // Always use webhook mode (polling: false) for Vercel compatibility
        bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
            polling: false,
            webHook: false // We'll set webhook manually via API
        });

        WEBHOOK_URL = `${env.VERCEL_URL}/api/telegram/webhook`;

        console.log('🤖 Telegram bot initialized (webhook mode)');
        console.log('📱 Admin Chat ID:', env.TELEGRAM_ADMIN_CHAT_ID);
        console.log('🔗 Webhook URL:', WEBHOOK_URL);
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error.message);
    }
}

// Setup bot commands
export const setupCommands = async () => {
    if (!bot) {
        console.warn('⚠️ Bot not initialized, skipping command setup');
        return;
    }

    try {
        await bot.setMyCommands([
            { command: 'start', description: 'Start the bot' },
            { command: 'help', description: 'Get help' },
            { command: 'verify', description: 'Verify a payment session' },
            { command: 'reject', description: 'Reject a payment session' }
        ]);
        console.log('✅ Bot commands registered');
    } catch (error) {
        console.error('❌ Failed to setup commands:', error.message);
    }
};

export { bot, WEBHOOK_URL, env, validateEnv };
export default bot;
