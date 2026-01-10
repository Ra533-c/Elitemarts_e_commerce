import { bot, env } from './telegram';

export async function sendTelegramNotification({ sessionId, customer, amount, qrCode }) {
    if (!bot || !env) {
        console.log('⚠️ Telegram bot not configured, skipping notification');
        return false;
    }

    // Safely access address fields with complete details
    const street = customer?.address?.street || customer?.address || 'N/A';
    const city = customer?.city || 'N/A';
    const state = customer?.state || 'N/A';
    const pincode = customer?.pincode || 'N/A';
    const fullAddress = `${street}, ${city}, ${state} - ${pincode}`;

    const message = `
🚨 *NEW PAYMENT PENDING*

👤 *Customer Details:*
• Name: ${customer.name}
• Phone: ${customer.phone}
• Email: ${customer.email || 'N/A'}

🏠 *Delivery Address:*
${fullAddress}

💰 *Payment Information:*
• Amount: ₹${amount}
• Session ID: \`${sessionId}\`

⏰ *Action Required:*
Please verify the payment within 15 minutes!

_Click the buttons below to take action:_
  `.trim();

    try {
        // Inline keyboard with clickable buttons
        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: '✅ Verify Payment',
                        callback_data: `verify_${sessionId}`
                    },
                    {
                        text: '❌ Reject Payment',
                        callback_data: `reject_${sessionId}`
                    }
                ]
            ]
        };

        await bot.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });

        console.log(`📱 Telegram notification sent for session: ${sessionId}`);
        return true;
    } catch (error) {
        console.error('Telegram notification error:', error);
        return false;
    }
}

export default bot;


