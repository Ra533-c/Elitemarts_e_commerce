# 🚀 Quick Webhook Setup Guide

## Current Status
Your webhook URL is **EMPTY** - that's why buttons don't work!

## ✅ Solution: Set Webhook on Vercel

### Option 1: Using Your Browser (EASIEST)

After deploying to Vercel, visit this URL:

```
https://YOUR-VERCEL-DOMAIN.vercel.app/api/telegram/webhook?action=set
```

**Replace `YOUR-VERCEL-DOMAIN` with your actual Vercel domain!**

Example:
```
https://elitemarts.vercel.app/api/telegram/webhook?action=set
```

You should see:
```json
{
  "success": true,
  "message": "Webhook set successfully",
  "webhook_url": "https://YOUR-DOMAIN.vercel.app/api/telegram/webhook"
}
```

---

### Option 2: Using curl Command

Copy your Vercel domain and run:

```bash
curl -X POST "https://api.telegram.org/bot8303838694:AAEx0CzTkrVn38tsXxXT7Iw-183zHvWyjrA/setWebhook?url=https://YOUR-VERCEL-DOMAIN.vercel.app/api/telegram/webhook"
```

**Replace `YOUR-VERCEL-DOMAIN` with your actual domain!**

---

### Option 3: Using the Setup Script

After deploying to Vercel, run:

```bash
node scripts/setup-webhook.js
```

Make sure `VERCEL_URL` is set in your environment variables.

---

## 🔍 Verify It Worked

Check webhook status:
```bash
curl "https://api.telegram.org/bot8303838694:AAEx0CzTkrVn38tsXxXT7Iw-183zHvWyjrA/getWebhookInfo"
```

You should see:
```json
{
  "ok": true,
  "result": {
    "url": "https://YOUR-DOMAIN.vercel.app/api/telegram/webhook",  ← Should NOT be empty!
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## 🎯 What's Your Vercel Domain?

To find it:
1. Go to https://vercel.com
2. Open your project
3. Look for the domain, usually: `https://elitemarts.vercel.app` or similar

---

## 📝 Quick Checklist

- [ ] Code is deployed to Vercel
- [ ] I know my Vercel domain URL
- [ ] I visited `https://MY-DOMAIN.vercel.app/api/telegram/webhook?action=set`
- [ ] Webhook info shows the URL (not empty)
- [ ] Test order created
- [ ] Buttons work! 🎉

---

## ⚠️ Important Notes

> **For Local Development (localhost):**
> - Webhook mode does NOT work on localhost
> - Telegram cannot reach `http://localhost:3000`
> - Local dev uses polling mode instead (already configured)
> - Buttons work locally via polling

> **For Production (Vercel):**
> - Webhook mode is required
> - Must set webhook URL after deployment
> - Only needs to be set once (persists across deployments)
> - Unless you change domains, no need to re-set
