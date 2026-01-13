import { bot, env } from './telegram';

// Async notification with timeout - non-blocking
export async function sendTelegramNotification({ sessionId, customer, amount, qrCode, orderId }) {
    // Fire and forget - don't block the main flow
    setImmediate(async () => {
        try {
            await sendNotificationWithTimeout({ sessionId, customer, amount, qrCode, orderId });
        } catch (error) {
            console.error('Background Telegram notification failed:', error);
        }
    });

    return true; // Return immediately
}

// Internal function with timeout
async function sendNotificationWithTimeout({ sessionId, customer, amount, qrCode, orderId }) {
    if (!bot || !env) {
        console.log('⚠️ Telegram bot not configured, skipping notification');
        return false;
    }

    // Create timeout promise (2 seconds max)
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Telegram notification timeout')), 2000)
    );

    // Safely access address fields with complete details
    const street = customer?.address?.street || customer?.address || 'N/A';
    const city = customer?.city || 'N/A';
    const state = customer?.state || 'N/A';
    const pincode = customer?.pincode || 'N/A';
    const fullAddress = `${street}, ${city}, ${state} - ${pincode}`;

    const message = `
🚨 *NEW PAYMENT PENDING*

📦 *Order ID:* \`${orderId || sessionId}\`

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

        // Race between sending message and timeout
        await Promise.race([
            bot.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message, {
                parse_mode: 'Markdown',
                reply_markup: keyboard
            }),
            timeoutPromise
        ]);

        console.log(`📱 Telegram notification sent for session: ${sessionId}`);
        return true;
    } catch (error) {
        if (error.message === 'Telegram notification timeout') {
            console.warn('⚠️ Telegram notification timed out (non-blocking)');
        } else {
            console.error('Telegram notification error:', error);
        }
        return false;
    }
}

/**
 * Stub function for SMS notifications (future implementation)
 * Currently logs to console - replace with actual SMS service
 */
export async function sendSMS(phone, message) {
    // Log the attempt (non-blocking)
    console.log(`📱 SMS would be sent to ${phone}: ${message}`);
    console.log('⚠️ SMS service not implemented yet - this is a placeholder');

    // Return success to avoid breaking the flow
    return {
        success: true,
        message: 'SMS service placeholder - no actual message sent'
    };
}

export default bot;

