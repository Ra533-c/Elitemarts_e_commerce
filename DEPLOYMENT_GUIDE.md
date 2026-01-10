# 🚀 Quick Deployment Guide

## Step 1: Commit and Deploy

```bash
git add .
git commit -m "Add Telegram webhook support for Vercel"
git push
```

Vercel will automatically deploy your changes.

---

## Step 2: Get Your Chat ID

1. After deployment, open your bot in Telegram: `@elitemartsssBot`
2. Send `/start` command
3. Bot will reply with your Chat ID (e.g., `6423059380`)

---

## Step 3: Configure Vercel Environment Variables

Go to: **Vercel Dashboard → elitemarts → Settings → Environment Variables**

Add these variables:

```bash
TELEGRAM_BOT_TOKEN=8303838694:AAEx0CzTkrVn38tsXxXT7Iw-183zHvWyjrA
TELEGRAM_ADMIN_CHAT_ID=6423059380  # Use your Chat ID from Step 2
WEBHOOK_SECRET=your-random-secret-here  # Optional but recommended
```

**Generate a secure secret** (optional):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

After adding variables, click **"Redeploy"** in Vercel Dashboard.

---

## Step 4: Set Up Webhook

Visit this URL in your browser (replace with your actual Vercel URL):

```
https://your-project.vercel.app/api/telegram/webhook?action=set
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Webhook set successfully",
  "webhook_url": "https://your-project.vercel.app/api/telegram/webhook",
  "commands_registered": true
}
```

---

## Step 5: Verify Webhook

Visit:
```
https://your-project.vercel.app/api/telegram/webhook?action=info
```

Check that:
- ✅ `url` shows your webhook URL
- ✅ `pending_update_count` is 0
- ✅ No `last_error_message`

---

## Step 6: Test End-to-End

1. **Test bot commands**:
   - Send `/start` in Telegram → Should get welcome message
   - Send `/help` → Should get command list

2. **Test payment flow**:
   - Go to your website
   - Fill out order form and proceed to payment
   - Check Telegram → Should receive instant notification
   - Send `/verify SESSION-XXX-XXX` → Should verify payment
   - Refresh payment page → Order should be created

---

## ✅ Success Checklist

- [ ] Code deployed to Vercel
- [ ] Environment variables configured
- [ ] Webhook set up successfully
- [ ] Bot responds to `/start` command
- [ ] Payment notification received in Telegram
- [ ] `/verify` command works correctly
- [ ] Order created after verification

---

## 🆘 Troubleshooting

**Bot not responding?**
- Check Vercel function logs: Dashboard → Deployments → Functions → `/api/telegram/webhook`
- Verify environment variables are set correctly
- Ensure Chat ID matches your Telegram user ID

**Webhook errors?**
- Visit `?action=info` to check webhook status
- If errors, delete and reset: `?action=delete` then `?action=set`

---

**📚 For detailed documentation, see:**
- [`TELEGRAM_BOT_SETUP.md`](file:///c:/Users/rajni/elitemarts/TELEGRAM_BOT_SETUP.md) - Complete setup guide
- [`walkthrough.md`](file:///C:/Users/rajni/.gemini/antigravity/brain/5e16d715-90cc-4962-886b-37cfcf9d0e9d/walkthrough.md) - Implementation details

**🎉 Your Telegram bot is now production-ready!**
