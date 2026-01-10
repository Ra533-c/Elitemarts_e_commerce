import TelegramBot from 'node-telegram-bot-api';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

let bot;

if (botToken && adminChatId) {
    bot = new TelegramBot(botToken, { polling: true });

    // Listen for ANY message and check for commands
    bot.on('message', async (msg) => {
        const text = msg.text;
        if (!text) return;

        // Check for verify command (both /verify_SESSIONID and /verify SESSIONID)
        const verifyMatch = text.match(/\/verify[_\s](.+)/);
        if (verifyMatch) {
            const sessionId = verifyMatch[1].trim();
            await handleTelegramCommand(sessionId, 'verify', msg.chat.id);
            return;
        }

        // Check for reject command (both /reject_SESSIONID and /reject SESSIONID)
        const rejectMatch = text.match(/\/reject[_\s](.+)/);
        if (rejectMatch) {
            const sessionId = rejectMatch[1].trim();
            await handleTelegramCommand(sessionId, 'reject', msg.chat.id);
            return;
        }
    });

    console.log('🤖 Telegram bot started successfully');
} else {
    console.log('⚠️ Telegram bot not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID)');
}

export async function sendTelegramNotification({ sessionId, customer, amount, qrCode }) {
    if (!bot || !adminChatId) {
        console.log('⚠️ Telegram bot not configured');
        return false;
    }

    // Safely access address fields
    const street = customer?.address?.street || 'N/A';
    const city = customer?.address?.city || 'N/A';
    const state = customer?.address?.state || 'N/A';
    const pincode = customer?.address?.pincode || 'N/A';

    const message = `
🚨 *NEW PAYMENT PENDING*

👤 *Customer:* ${customer.name}
📱 *Phone:* ${customer.phone}
💰 *Amount:* ₹${amount}
🏠 *Address:* ${street}, ${city}, ${state} - ${pincode}
🔖 *Session ID:* \`${sessionId}\`

*Quick Actions:*
/verify\\_${sessionId} - ✅ Verify Payment
/reject\\_${sessionId} - ❌ Reject Payment

⏰ *Verify within 15 minutes!*
  `.trim();

    try {
        await bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
        console.log(`📱 Telegram notification sent for session: ${sessionId}`);
        return true;
    } catch (error) {
        console.error('Telegram notification error:', error);
        return false;
    }
}

async function handleTelegramCommand(sessionId, action, chatId) {
    try {
        // Only allow admin chat ID
        if (chatId.toString() !== adminChatId.toString()) {
            await bot.sendMessage(chatId, '❌ Unauthorized');
            return;
        }

        // Dynamic import of database with proper error handling
        let clientPromise;
        try {
            const dbModule = await import('@/lib/database');
            clientPromise = dbModule.default;
        } catch (importError) {
            console.error('Database import error:', importError);
            await bot.sendMessage(adminChatId, `❌ Database connection error: ${importError.message}`);
            return;
        }

        const client = await clientPromise;
        const db = client.db('elitemarts');

        const session = await db.collection('payment_sessions').findOne({ sessionId });

        if (!session) {
            await bot.sendMessage(adminChatId, `❌ Session \`${sessionId}\` not found\n\nPossible reasons:\n• Session expired (15 min timeout)\n• Invalid session ID\n• Database connection issue`, { parse_mode: 'Markdown' });
            return;
        }

        if (session.paymentStatus === 'verified') {
            await bot.sendMessage(adminChatId, `⚠️ Session \`${sessionId}\` already verified!`, { parse_mode: 'Markdown' });
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

            // Send confirmation
            await bot.sendMessage(
                adminChatId,
                `✅ *Payment Verified!*\n\n` +
                `Session: \`${sessionId}\`\n` +
                `Customer: *${session.customerData.name}*\n` +
                `Amount: *₹600*\n\n` +
                `Order will be created automatically when user's page refreshes.`,
                { parse_mode: 'Markdown' }
            );

            console.log(`✅ Payment verified via Telegram: ${sessionId}`);

        } else if (action === 'reject') {
            // Update session to failed
            await db.collection('payment_sessions').updateOne(
                { sessionId },
                {
                    $set: {
                        paymentStatus: 'failed',
                        failedAt: new Date(),
                        failedBy: 'telegram_admin'
                    }
                }
            );

            await bot.sendMessage(
                adminChatId,
                `❌ *Payment Rejected*\n\n` +
                `Session: \`${sessionId}\`\n` +
                `Customer: *${session.customerData.name}*\n\n` +
                `User will be notified to retry payment.`,
                { parse_mode: 'Markdown' }
            );

            console.log(`❌ Payment rejected via Telegram: ${sessionId}`);
        }

    } catch (error) {
        console.error('Telegram command error:', error);
        await bot.sendMessage(adminChatId, `❌ Error: ${error.message}`);
    }
}

export default bot;
