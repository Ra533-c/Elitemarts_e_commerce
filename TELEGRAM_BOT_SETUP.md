# Telegram Bot Setup - Webhook Mode for Vercel

## 🎯 Overview

Your Telegram bot now uses **webhooks** instead of polling, making it fully compatible with Vercel's serverless architecture. This eliminates the 409 conflict errors and enables instant payment verification via Telegram commands.

---

## 📋 Prerequisites

1. **Telegram Bot Token**: Get from [@BotFather](https://t.me/BotFather)
2. **Admin Chat ID**: Your Telegram user ID
3. **Vercel Deployment**: Your app must be deployed to Vercel

---

## 🚀 Quick Setup Guide

### Step 1: Configure Environment Variables

Add these to your Vercel project's environment variables:

```bash
TELEGRAM_BOT_TOKEN="your_bot_token_here"
TELEGRAM_ADMIN_CHAT_ID="your_chat_id_here"
WEBHOOK_SECRET="your_random_secret_here"  # Optional but recommended
```

**To get your Chat ID:**
1. Deploy your app to Vercel
2. Open your bot in Telegram
3. Send `/start` command
4. Bot will reply with your Chat ID
5. Add it to Vercel environment variables

**To generate a secure WEBHOOK_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Deploy to Vercel

```bash
git add .
git commit -m "Add Telegram webhook support"
git push
```

Vercel will automatically deploy your changes.

### Step 3: Set Up the Webhook (One-Time)

After deployment, visit this URL in your browser:

```
https://your-project.vercel.app/api/telegram/webhook?action=set
```

You should see a success response:
```json
{
  "success": true,
  "message": "Webhook set successfully",
  "webhook_url": "https://your-project.vercel.app/api/telegram/webhook",
  "commands_registered": true
}
```

### Step 4: Verify Webhook Status

Check if the webhook is working:

```
https://your-project.vercel.app/api/telegram/webhook?action=info
```

Or use Telegram's API directly:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Expected response should show:
- `url`: Your webhook URL
- `pending_update_count`: 0 (if everything is working)
- `last_error_date`: Should be empty

---

## 🎮 Using the Bot

### Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and get your Chat ID |
| `/help` | Show available commands |
| `/verify SESSIONID` | Verify a payment session |
| `/reject SESSIONID` | Reject a payment session |

### Payment Verification Flow

1. **Customer places order** on your website
2. **You receive instant notification** in Telegram with session details
3. **Verify payment** by sending: `/verify SESSION-123-ABC`
4. **Bot confirms** and updates database
5. **Order is created** automatically when customer's page refreshes

### Example Notification

```
🚨 NEW PAYMENT PENDING

👤 Customer: John Doe
📱 Phone: +91 9876543210
💰 Amount: ₹600
🏠 Address: 123 Main St, Mumbai, Maharashtra - 400001
🔖 Session ID: SESSION-1234567890-ABC12

⏰ Verify within 15 minutes!

To verify or reject this payment, use:
/verify SESSION-1234567890-ABC12
/reject SESSION-1234567890-ABC12
```

---

## 🔧 Webhook Management

### Check Webhook Status
```bash
npm run webhook:info
```
Then visit: `https://your-project.vercel.app/api/telegram/webhook?action=info`

### Reset Webhook
If you need to reconfigure:
```bash
npm run webhook:setup
```
Then visit: `https://your-project.vercel.app/api/telegram/webhook?action=set`

### Delete Webhook
To remove the webhook:
```bash
npm run webhook:delete
```
Then visit: `https://your-project.vercel.app/api/telegram/webhook?action=delete`

---

## 🛠️ Troubleshooting

### Bot not responding to commands

**Check 1: Verify webhook is set**
```
https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo
```

**Check 2: Verify environment variables in Vercel**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` are set
- Redeploy after adding variables

**Check 3: Check Vercel function logs**
- Go to Vercel Dashboard → Your Project → Deployments → Latest → Functions
- Look for `/api/telegram/webhook` logs
- Check for any errors

### "Unauthorized" error when using commands

- Verify your Chat ID matches `TELEGRAM_ADMIN_CHAT_ID`
- Send `/start` to the bot to see your current Chat ID
- Update environment variable if needed

### "Session not found" error

- Session might have expired (15-minute timeout)
- Check if the session ID is correct
- Verify MongoDB connection is working

### Webhook shows errors in getWebhookInfo

**Common issues:**
- `last_error_message: "Wrong response from the webhook"` → Check function logs in Vercel
- `pending_update_count > 0` → Old updates stuck, delete and reset webhook
- `url` is empty → Webhook not set, visit `?action=set` endpoint

---

## 🔐 Security Best Practices

1. **Use WEBHOOK_SECRET**: Always set a random secret token in production
2. **Verify Chat ID**: Bot only responds to your admin Chat ID
3. **HTTPS Only**: Telegram webhooks require HTTPS (Vercel provides this)
4. **Environment Variables**: Never commit tokens to Git

---

## 📊 Architecture

```
Customer Order → Payment Session Created
                      ↓
              Telegram Notification Sent
                      ↓
              Admin Receives Message
                      ↓
              Admin Sends /verify Command
                      ↓
              Telegram → Webhook → Vercel Function
                      ↓
              Database Updated (verified)
                      ↓
              Customer Page Refreshes → Order Created
```

---

## 🆘 Need Help?

**Check function logs:**
```bash
# In Vercel Dashboard
Deployments → Latest → Functions → /api/telegram/webhook
```

**Test webhook locally (requires ngrok):**
```bash
# Start dev server
npm run dev

# In another terminal, expose localhost
ngrok http 3000

# Set webhook to ngrok URL
curl -X GET "https://your-ngrok-url.ngrok.io/api/telegram/webhook?action=set"
```

**For local development**, it's easier to use the admin panel at `http://localhost:3000/admin` for payment verification.

---

## ✅ Verification Checklist

- [ ] Environment variables set in Vercel
- [ ] Code deployed to Vercel
- [ ] Webhook configured (`?action=set`)
- [ ] Webhook status shows no errors (`?action=info`)
- [ ] Bot responds to `/start` command
- [ ] Test payment notification received
- [ ] `/verify` command works correctly
- [ ] Database updates after verification

---

**🎉 Your Telegram bot is now production-ready on Vercel!**
