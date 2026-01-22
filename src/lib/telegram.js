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

// SINGLETON PATTERN: Prevent multiple bot instances on hot-reload
// Store bot in global to persist across hot-reloads
const globalForBot = globalThis;

let bot = globalForBot._telegramBot || null;
let WEBHOOK_URL = null;
let isInitialized = globalForBot._botInitialized || false;

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
                `Amount: *₹100*\n\n` +
                `Order will be created automatically when user's page refreshes.`;

            // If messageId is provided (from inline button), edit the original message
            if (messageId) {
                console.log(`📝 Attempting to edit message ${messageId} in chat ${chatId}`);
                await bot.editMessageText(confirmationMessage, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
                console.log(`✅ Message edited successfully`);
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
                `Amount: *₹100*\n\n` +
                `Reason: Payment not received or incorrect amount.\n\n` +
                `User will be redirected to retry payment.`;

            // If messageId is provided (from inline button), edit the original message
            if (messageId) {
                console.log(`📝 Attempting to edit message ${messageId} in chat ${chatId}`);
                await bot.editMessageText(rejectionMessage, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
                console.log(`✅ Message edited successfully`);
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

    // Verify command - supports both /verify:SESSIONID and /verify SESSIONID
    bot.onText(/\/verify[_ ](.+)/, async (msg, match) => {
        const sessionId = match[1].trim();
        await handleTelegramCommand(sessionId, 'verify', msg.chat.id);
    });

    // Reject command - supports both /reject:SESSIONID and /reject SESSIONID
    bot.onText(/\/reject[_ ](.+)/, async (msg, match) => {
        const sessionId = match[1].trim();
        await handleTelegramCommand(sessionId, 'reject', msg.chat.id);
    });

    // Handle inline button clicks (callback queries)
    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const data = callbackQuery.data;

        console.log(`📲 RECEIVED CALLBACK QUERY:`, {
            chatId,
            messageId,
            data,
            from: callbackQuery.from.username,
            timestamp: new Date().toISOString()
        });

        try {
            // Answer the callback query immediately to remove loading state
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: 'Processing...'
            });

            // Parse callback data: verify:SESSIONID or reject:SESSIONID
            const [action, sessionId] = data.split(':', 2);

            // DEBUG: Log parsed values
            console.log(`🔍 DEBUG - Raw data: "${data}"`);
            console.log(`🔍 DEBUG - Parsed action: "${action}"`);
            console.log(`🔍 DEBUG - Parsed sessionId: "${sessionId}"`);
            console.log(`🔍 DEBUG - Action check: action === 'verify'? ${action === 'verify'}, action === 'reject'? ${action === 'reject'}`);

            if (action === 'verify' || action === 'reject') {
                console.log(`🎯 Processing ${action} for session: ${sessionId}`);

                // Handle the command
                await handleTelegramCommand(sessionId, action, chatId, messageId);

                console.log(`✅ ${action} completed successfully for session: ${sessionId}`);
            } else {
                console.warn(`⚠️ Unknown action: ${data}`);
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Unknown action',
                    show_alert: true
                });
            }
        } catch (error) {
            console.error('❌ Callback query error:', error);
            try {
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Error processing action',
                    show_alert: true
                });
            } catch (e) {
                console.error('Failed to send error alert:', e);
            }
        }
    });

    console.log('✅ Bot command handlers registered successfully');
}

// Initialize bot only if environment variables are present
// Using async IIFE to properly handle bot cleanup
if (env) {
    (async () => {
        // Check if already initialized
        if (globalForBot._botInitialized) {
            console.log('♻️ Telegram bot already initialized (reusing existing instance)');
            bot = globalForBot._telegramBot;
            return;
        }

        try {
            // ROOT CAUSE FIX: Stop any existing polling instance before creating new one
            if (globalForBot._telegramBot) {
                try {
                    console.log('🛑 Stopping previous bot instance...');
                    await globalForBot._telegramBot.stopPolling({ cancel: true, reason: 'Hot reload cleanup' });
                    globalForBot._telegramBot.removeAllListeners();
                    console.log('✅ Previous bot stopped successfully');
                } catch (cleanupError) {
                    // Silently ignore cleanup errors - they're expected
                }
            }

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

                // Construct webhook URL with proper protocol
                const baseUrl = env.VERCEL_URL.startsWith('http')
                    ? env.VERCEL_URL
                    : `https://${env.VERCEL_URL}`;
                WEBHOOK_URL = `${baseUrl}/api/telegram/webhook`;

                console.log('🤖 Telegram bot initialized (WEBHOOK mode - Production)');
                console.log('📱 Admin Chat ID:', env.TELEGRAM_ADMIN_CHAT_ID);
                console.log('🔗 Webhook URL:', WEBHOOK_URL);
                console.log('💡 Remember to set webhook after deployment');

                // Register listeners for webhook mode
                registerCommandHandlers();
            }

            // Error handlers - COMPLETELY SILENT ON 409 ERRORS
            bot.on('polling_error', (error) => {
                // Completely ignore 409 errors - no logging whatsoever
                if (error.code === 'ETELEGRAM' && error.message && error.message.includes('409')) {
                    return; // Silent - do nothing
                }
                // Log other errors
                console.error('Polling error:', error.code, error.message);
            });

            bot.on('error', (error) => {
                console.error('Bot error:', error);
            });

            // Store in global to persist across hot-reloads
            globalForBot._telegramBot = bot;
            globalForBot._botInitialized = true;
            isInitialized = true;

            console.log('✅ Bot initialization complete and stored in global singleton');

        } catch (error) {
            console.error('❌ Failed to initialize Telegram bot:', error.message);
        }
    })();
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
