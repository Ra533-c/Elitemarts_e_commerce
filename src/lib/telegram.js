import TelegramBot from 'node-telegram-bot-api';
import clientPromise from './database';

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

// Detect environment: development (polling) vs production (webhook)
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.VERCEL_URL;

let bot = null;
let WEBHOOK_URL = null;

// Handle verify/reject commands
async function handleTelegramCommand(sessionId, action, chatId, messageId = null) {
    if (!bot || !env) {
        console.error('Bot or environment not initialized');
        return;
    }

    try {
        console.log(`🔧 Handling ${action} command for session: ${sessionId}`);

        // Only allow admin chat ID
        if (chatId.toString() !== env.TELEGRAM_ADMIN_CHAT_ID.toString()) {
            console.log(`⛔ Unauthorized access attempt from chat: ${chatId}`);
            await bot.sendMessage(chatId, '❌ Unauthorized. Only admin can use this command.');
            return;
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const session = await db.collection('payment_sessions').findOne({ sessionId });

        if (!session) {
            console.log(`❌ Session not found: ${sessionId}`);
            await bot.sendMessage(
                chatId,
                `❌ Session \`${sessionId}\` not found\n\n` +
                `Possible reasons:\n` +
                `• Session expired (15 min timeout)\n` +
                `• Invalid session ID\n` +
                `• Database connection issue`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        console.log(`✅ Session found: ${sessionId}, current status: ${session.paymentStatus}`);

        if (session.paymentStatus === 'verified') {
            await bot.sendMessage(
                chatId,
                `⚠️ Session \`${sessionId}\` already verified!`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        if (action === 'verify') {
            // Update session to verified
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                {
                    $set: {
                        paymentStatus: 'verified',
                        verifiedAt: new Date(),
                        verifiedBy: 'telegram_admin'
                    }
                }
            );

            console.log(`✅ Session ${sessionId} marked as verified`);

            const confirmationMessage =
                `✅ *Payment Verified!*\n\n` +
                `Session: \`${sessionId}\`\n` +
                `Customer: *${session.customerData.name}*\n` +
                `Amount: *₹600*\n\n` +
                `Order will be created automatically when user's page refreshes.`;

            // If messageId is provided (from inline button), edit the original message
            if (messageId) {
                await bot.editMessageText(confirmationMessage, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
            } else {
                // Otherwise send a new message (from text command)
                await bot.sendMessage(chatId, confirmationMessage, { parse_mode: 'Markdown' });
            }

        } else if (action === 'reject') {
            // Update session to REJECTED (admin rejected) instead of 'failed'
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                {
                    $set: {
                        paymentStatus: 'rejected', // NEW: distinct from 'failed'
                        rejectedAt: new Date(),
                        rejectedBy: 'telegram_admin',
                        rejectionReason: 'Payment not received or incorrect amount' // NEW: track reason
                    }
                }
            );

            console.log(`❌ Session ${sessionId} marked as rejected by admin`);

            const rejectionMessage =
                `❌ *Payment Rejected*\n\n` +
                `Session: \`${sessionId}\`\n` +
                `Customer: *${session.customerData.name}*\n` +
                `Amount: *₹600*\n\n` +
                `Reason: Payment not received or incorrect amount.\n\n` +
                `User will be redirected to retry payment.`;

            // If messageId is provided (from inline button), edit the original message
            if (messageId) {
                await bot.editMessageText(rejectionMessage, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
            } else {
                // Otherwise send a new message (from text command)
                await bot.sendMessage(chatId, rejectionMessage, { parse_mode: 'Markdown' });
            }
        }

    } catch (error) {
        console.error('❌ Command error:', error);
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}

// Command handlers registration
function registerCommandHandlers() {
    if (!bot) return;

    console.log('📝 Registering command handlers...');

    // Start command
    bot.onText(/\/start/, async (msg) => {
        try {
            await bot.sendMessage(
                msg.chat.id,
                `🎉 *Welcome to EliteMarts Bot!*\n\n` +
                `Bot is running successfully!\n\n` +
                `*Your Chat ID:* \`${msg.chat.id}\`\n\n` +
                `Mode: ${isDevelopment ? 'Development (Polling)' : 'Production (Webhook)'}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Start command error:', error);
        }
    });

    // Help command
    bot.onText(/\/help/, async (msg) => {
        try {
            await bot.sendMessage(
                msg.chat.id,
                `📚 *Available Commands:*\n\n` +
                `/start - Welcome message\n` +
                `/help - Show this help\n` +
                `/verify SESSIONID - Verify a payment\n` +
                `/reject SESSIONID - Reject a payment`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Help command error:', error);
        }
    });

    // Verify command - supports both /verify_SESSIONID and /verify SESSIONID
    bot.onText(/\/verify[_ ](.+)/, async (msg, match) => {
        const sessionId = match[1].trim();
        await handleTelegramCommand(sessionId, 'verify', msg.chat.id);
    });

    // Reject command - supports both /reject_SESSIONID and /reject SESSIONID
    bot.onText(/\/reject[_ ](.+)/, async (msg, match) => {
        const sessionId = match[1].trim();
        await handleTelegramCommand(sessionId, 'reject', msg.chat.id);
    });

    // Handle inline button clicks (callback queries)
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const data = callbackQuery.data;

        console.log(`📲 Received callback query: ${data}`);

        // Parse callback data: verify_SESSIONID or reject_SESSIONID
        const [action, sessionId] = data.split('_', 2);

        if (action === 'verify' || action === 'reject') {
            // Answer the callback query to remove loading state
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: `Processing ${action}...`
            });

            // Handle the command
            await handleTelegramCommand(sessionId, action, chatId, messageId);
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'Unknown action',
                show_alert: true
            });
        }
    });

    console.log('✅ Bot command handlers registered successfully');
}

// Initialize bot only if environment variables are present
if (env) {
    try {
        // DUAL MODE: Polling for local dev, webhook for production
        if (isDevelopment) {
            // LOCAL DEVELOPMENT: Use polling
            bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
                polling: {
                    interval: 1000,
                    autoStart: true,
                    params: {
                        timeout: 10
                    }
                }
            });

            console.log('🤖 Telegram bot initialized (POLLING mode - Local Development)');
            console.log('📱 Admin Chat ID:', env.TELEGRAM_ADMIN_CHAT_ID);
            console.log('💡 Commands will work immediately in Telegram');

            // Register command handlers for polling mode
            registerCommandHandlers();

        } else {
            // PRODUCTION: Use webhook mode
            bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
                polling: false,
                webHook: false
            });

            WEBHOOK_URL = `${env.VERCEL_URL}/api/telegram/webhook`;

            console.log('🤖 Telegram bot initialized (WEBHOOK mode - Production)');
            console.log('📱 Admin Chat ID:', env.TELEGRAM_ADMIN_CHAT_ID);
            console.log('🔗 Webhook URL:', WEBHOOK_URL);
            console.log('💡 Remember to set webhook after deployment');
        }

        // Error handlers
        bot.on('polling_error', (error) => {
            console.error('Polling error:', error.code, error.message);
        });

        bot.on('error', (error) => {
            console.error('Bot error:', error);
        });

    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error.message);
    }
}

// Setup bot commands with Telegram
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
        console.log('✅ Bot commands registered with Telegram');
    } catch (error) {
        console.error('❌ Failed to setup commands:', error.message);
    }
};

// Export command handler for webhook mode
export { handleTelegramCommand };

export { bot, WEBHOOK_URL, env, validateEnv, isDevelopment };
export default bot;
