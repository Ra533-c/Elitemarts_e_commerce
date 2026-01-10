import { NextResponse } from 'next/server';
import { bot, WEBHOOK_URL, env, setupCommands, handleTelegramCommand } from '@/lib/telegram';
import clientPromise from '@/lib/database';

// Note: Using Node.js runtime instead of Edge for MongoDB compatibility
export const dynamic = 'force-dynamic';


// Register bot event listeners (only once)
let listenersRegistered = false;

const registerBotListeners = () => {
    if (!bot || listenersRegistered) return;

    // Welcome command
    bot.onText(/\/start/, async (msg) => {
        try {
            await bot.sendMessage(
                msg.chat.id,
                `🎉 *Welcome to EliteMarts Bot!*\n\n` +
                `Bot is running successfully on Vercel with webhooks!\n\n` +
                `*Your Chat ID:* \`${msg.chat.id}\`\n\n` +
                `Use this Chat ID in your .env.local as TELEGRAM_ADMIN_CHAT_ID`,
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

    // Verify command - supports both formats: /verify_SESSIONID and /verify SESSIONID
    bot.onText(/\/verify[_ ](.+)/, async (msg, match) => {
        const sessionId = match[1].trim();
        await handleTelegramCommand(sessionId, 'verify', msg.chat.id);
    });

    // Reject command - supports both formats: /reject_SESSIONID and /reject SESSIONID
    bot.onText(/\/reject[_ ](.+)/, async (msg, match) => {
        const sessionId = match[1].trim();
        await handleTelegramCommand(sessionId, 'reject', msg.chat.id);
    });

    // Error handler
    bot.on('error', (error) => {
        console.error('Bot error:', error);
    });

    listenersRegistered = true;
    console.log('✅ Bot event listeners registered');
};


// POST request - handle webhook updates from Telegram
export async function POST(request) {
    if (!bot) {
        return NextResponse.json({ error: 'Bot not initialized' }, { status: 503 });
    }

    try {
        // Security: Verify request is from Telegram (optional but recommended)
        const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
        if (process.env.NODE_ENV === 'production' && env?.WEBHOOK_SECRET && secretToken !== env.WEBHOOK_SECRET) {
            console.warn('⚠️ Unauthorized webhook request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Register listeners before processing
        registerBotListeners();

        // Process update (non-blocking)
        bot.processUpdate(body);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook POST error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

// GET request - webhook management
export async function GET(request) {
    if (!bot || !env) {
        return NextResponse.json({
            error: 'Bot not initialized',
            message: 'Please check your environment variables: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID'
        }, { status: 503 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'set' || action === 'setup') {
            // Set webhook with optional secret token
            const webhookOptions = {};
            if (env.WEBHOOK_SECRET) {
                webhookOptions.secret_token = env.WEBHOOK_SECRET;
            }

            await bot.setWebHook(WEBHOOK_URL, webhookOptions);

            // Setup bot commands
            await setupCommands();

            return NextResponse.json({
                success: true,
                message: 'Webhook set successfully',
                webhook_url: WEBHOOK_URL,
                secret_token: env.WEBHOOK_SECRET ? '***hidden***' : 'not set',
                commands_registered: true
            });
        }

        if (action === 'info') {
            const info = await bot.getWebhookInfo();
            return NextResponse.json({
                success: true,
                webhook_info: info
            });
        }

        if (action === 'delete') {
            await bot.deleteWebHook();
            return NextResponse.json({
                success: true,
                message: 'Webhook deleted successfully'
            });
        }

        // Default response - show available actions
        return NextResponse.json({
            message: 'Telegram Webhook Management',
            webhook_url: WEBHOOK_URL,
            available_actions: {
                set: `${WEBHOOK_URL}?action=set - Set up the webhook`,
                info: `${WEBHOOK_URL}?action=info - Get webhook information`,
                delete: `${WEBHOOK_URL}?action=delete - Delete the webhook`
            },
            usage: 'Add ?action=set to configure the webhook for the first time'
        });
    } catch (error) {
        console.error('Webhook GET error:', error);
        return NextResponse.json(
            { error: error.message, stack: error.stack },
            { status: 500 }
        );
    }
}
