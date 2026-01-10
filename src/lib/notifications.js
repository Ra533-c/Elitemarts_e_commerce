import { bot, env } from './telegram';

export async function sendTelegramNotification({ sessionId, customer, amount, qrCode }) {
    if (!bot || !env) {
        console.log('⚠️ Telegram bot not configured, skipping notification');
        return false;
    }

    // Safely access address fields
    const street = customer?.address?.street || customer?.address || 'N/A';
    const city = customer?.city || 'N/A';
    const state = customer?.state || 'N/A';
    const pincode = customer?.pincode || 'N/A';

    const message = `
🚨 *NEW PAYMENT PENDING*

👤 *Customer:* ${customer.name}
📱 *Phone:* ${customer.phone}
💰 *Amount:* ₹${amount}
🏠 *Address:* ${street}, ${city}, ${state} - ${pincode}
🔖 *Session ID:* \`${sessionId}\`

⏰ *Verify within 15 minutes!*

*To verify or reject this payment, use:*
\`/verify ${sessionId}\`
\`/reject ${sessionId}\`
  `.trim();

    try {
        await bot.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' });
        console.log(`📱 Telegram notification sent for session: ${sessionId}`);
        return true;
    } catch (error) {
        console.error('Telegram notification error:', error);
        return false;
    }
}

export default bot;

