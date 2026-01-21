// Telegram Webhook Setup Script
// Run this after deploying to Vercel

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL;

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in environment');
    process.exit(1);
}

const webhookUrl = `${VERCEL_URL}/api/telegram/webhook`;

console.log('🚀 Setting up Telegram webhook...');
console.log('📍 Webhook URL:', webhookUrl);

// Set webhook
fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl })
})
    .then(res => res.json())
    .then(data => {
        console.log('\n✅ Webhook Set Response:', data);

        if (data.ok) {
            console.log('\n🎉 SUCCESS! Webhook is now set.');
            console.log('\n📋 Verifying webhook info...\n');

            // Verify webhook
            return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
        } else {
            throw new Error(data.description);
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ Current Webhook Info:');
        console.log(JSON.stringify(data.result, null, 2));

        if (data.result.url === webhookUrl) {
            console.log('\n🎯 PERFECT! Webhook URL is correctly set!');
            console.log('\n✅ Your Telegram buttons will now work on production!');
        } else {
            console.log('\n⚠️ Warning: Webhook URL mismatch!');
            console.log('Expected:', webhookUrl);
            console.log('Got:', data.result.url);
        }
    })
    .catch(error => {
        console.error('\n❌ Error:', error.message);
        console.log('\n💡 Manual Setup Instructions:');
        console.log(`1. Visit: ${webhookUrl}?action=set`);
        console.log(`2. Or run: curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}"`);
    });
