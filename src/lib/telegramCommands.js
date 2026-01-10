import clientPromise from './database';

// Handle verify/reject commands (shared by both polling and webhook modes)
export async function handleTelegramCommand(bot, env, sessionId, action, chatId) {
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

            await bot.sendMessage(
                chatId,
                `✅ *Payment Verified!*\n\n` +
                `Session: \`${sessionId}\`\n` +
                `Customer: *${session.customerData.name}*\n` +
                `Amount: *₹600*\n\n` +
                `Order will be created automatically when user's page refreshes.`,
                { parse_mode: 'Markdown' }
            );

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

            console.log(`❌ Session ${sessionId} marked as failed`);

            await bot.sendMessage(
                chatId,
                `❌ *Payment Rejected*\n\n` +
                `Session: \`${sessionId}\`\n` +
                `Customer: *${session.customerData.name}*\n\n` +
                `User will be notified to retry payment.`,
                { parse_mode: 'Markdown' }
            );
        }

    } catch (error) {
        console.error('❌ Command error:', error);
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
}
