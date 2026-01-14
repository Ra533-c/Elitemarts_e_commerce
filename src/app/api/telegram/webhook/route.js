import { NextResponse } from 'next/server';
import { bot, WEBHOOK_URL, env, setupCommands, handleTelegramCommand } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST request - handle webhook updates from Telegram
export async function POST(request) {
    if (!bot || !env) {
        console.error('❌ Bot or environment not initialized');
        return NextResponse.json({ error: 'Bot not configured' }, { status: 503 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        console.error('❌ Invalid JSON in webhook body:', error);
        return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    // Log incoming update
    console.log('📨 Webhook received:', {
        updateId: body.update_id,
        type: body.callback_query ? 'callback_query' : (body.message ? 'message' : 'unknown'),
        timestamp: new Date().toISOString()
    });

    try {
        // =========================================
        // CRITICAL FIX: Handle callback queries DIRECTLY
        // =========================================
        if (body.callback_query) {
            const callbackQuery = body.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;
            const data = callbackQuery.data;

            console.log('🎯 CALLBACK QUERY DETECTED:', {
                chatId,
                messageId,
                data,
                from: callbackQuery.from.username,
                timestamp: new Date().toISOString()
            });

            // 1. Answer callback IMMEDIATELY (stops Telegram from retrying)
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '⚡ Processing...'
            });

            // 2. Parse action and sessionId
            const [action, sessionId] = data.split('_', 2);

            if (!action || !sessionId) {
                console.error('❌ Invalid callback data:', data);
                await bot.sendMessage(chatId, '❌ Invalid action format.');
                return NextResponse.json({ ok: true });
            }

            // 3. Verify admin authorization
            if (chatId.toString() !== env.TELEGRAM_ADMIN_CHAT_ID.toString()) {
                console.warn('⛔ Unauthorized callback from:', chatId);
                await bot.sendMessage(chatId, '❌ Unauthorized. Only admin can perform this action.');
                return NextResponse.json({ ok: true });
            }

            // 4. Process the action SYNCHRONOUSLY
            console.log(`🔄 Processing ${action} for session: ${sessionId}`);

            try {
                // Use the same handler function but call it directly
                await handleTelegramCommand(sessionId, action, chatId, messageId);
                console.log(`✅ ${action} completed successfully for session: ${sessionId}`);
            } catch (error) {
                console.error(`❌ Error in handleTelegramCommand:`, error);
                await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
            }

            // 5. Return immediately after processing
            return NextResponse.json({ ok: true });
        }

        // =========================================
        // Handle regular messages (for /start, /help, /verify, /reject)
        // =========================================
        if (body.message) {
            const msg = body.message;
            const chatId = msg.chat.id;
            const text = msg.text || '';

            console.log('💬 MESSAGE RECEIVED:', {
                chatId,
                text,
                from: msg.from?.username
            });

            // Handle commands
            if (text.startsWith('/start')) {
                await bot.sendMessage(
                    chatId,
                    `🎉 *Welcome to EliteMarts Bot!*\\n\\n` +
                    `Bot is running successfully on Vercel with webhooks!\\n\\n` +
                    `*Your Chat ID:* \`${chatId}\`\\n\\n` +
                    `Use this Chat ID in your .env.local as TELEGRAM_ADMIN_CHAT_ID`,
                    { parse_mode: 'Markdown' }
                );
            } else if (text.startsWith('/help')) {
                await bot.sendMessage(
                    chatId,
                    `📚 *Available Commands:*\\n\\n` +
                    `/start - Welcome message\\n` +
                    `/help - Show this help\\n` +
                    `/verify SESSIONID - Verify a payment\\n` +
                    `/reject SESSIONID - Reject a payment`,
                    { parse_mode: 'Markdown' }
                );
            } else if (text.match(/\/verify[_ ](.+)/)) {
                const match = text.match(/\/verify[_ ](.+)/);
                const sessionId = match[1].trim();
                await handleTelegramCommand(sessionId, 'verify', chatId);
            } else if (text.match(/\/reject[_ ](.+)/)) {
                const match = text.match(/\/reject[_ ](.+)/);
                const sessionId = match[1].trim();
                await handleTelegramCommand(sessionId, 'reject', chatId);
            }

            return NextResponse.json({ ok: true });
        }

        // If we get here, it's an unknown update type
        console.warn('⚠️ Unknown update type:', Object.keys(body));
        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('❌ Fatal webhook error:', error);
        // Still return 200 to Telegram to prevent retries
        return NextResponse.json({ ok: true });
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
