# 🎯 Step-by-Step Webhook Setup Guide

## Current Status
- ✅ UUID session IDs are working
- ✅ Callback queries are being received
- ✅ Local dev server uses polling mode (for development)
- ⚠️ Need to set webhook for Vercel production

---

## 📝 Step-by-Step Instructions

### Step 1: Make Sure Dev Server is STOPPED

Ensure `npm run dev` is NOT running. If it is, press `Ctrl+C` to stop it.

**Why?** Local dev uses polling mode which conflicts with webhooks.

---

### Step 2: Open PowerShell in Your Project

1. Open a new PowerShell terminal
2. Navigate to your project folder:
   ```powershell
   cd c:\Users\rajni\elite-marts
   ```

---

### Step 3: Set the Webhook

Copy and paste this command into PowerShell:

```powershell
$body = @{ url = 'https://elitemarts-e-commerce2-gsffgjoj5-elitemarts-projects-8b4bda94.vercel.app/api/telegram/webhook' } | ConvertTo-Json; Invoke-RestMethod -Uri 'https://api.telegram.org/bot8303838694:AAEx0CzTkrVn38tsXxXT7Iw-183zHvWyjrA/setWebhook' -Method POST -Body $body -ContentType 'application/json'
```

Press `Enter`.

**Expected output:**
```
ok     : True
result : True
description : Webhook was set
```

---

### Step 4: Verify Webhook is Set

Copy and paste this command:

```powershell
Invoke-RestMethod -Uri 'https://api.telegram.org/bot8303838694:AAEx0CzTkrVn38tsXxXT7Iw-183zHvWyjrA/getWebhookInfo'
```

Press `Enter`.

**Expected output:**
```
ok     : True
result : @{url=https://elitemarts-e-commerce2-...vercel.app/api/telegram/webhook; ...}
```

**IMPORTANT:** The `url` field should have your Vercel URL, NOT empty!

---

### Step 5: Test the Buttons on Production

1. Go to your production site: `https://elitemarts-e-commerce2-gsffgjoj5-elitemarts-projects-8b4bda94.vercel.app`
2. Create a test order
3. Proceed to payment
4. Check Telegram for the notification
5. Click **✅ Verify Payment** button

**Expected:**
- Button shows "Processing..." briefly
- Message updates to show payment verified
- User sees confetti on the website 🎉

---

### Step 6: Check Vercel Logs (If Issues)

If buttons don't work:
1. Go to [Vercel Dashboard](https://vercel.com)
2. Open your project
3. Click "Functions" → "Logs"
4. Look for:
   ```
   📨 Webhook received
   🎯 CALLBACK QUERY DETECTED
   🔄 Processing verify for session
   ```

---

## ⚠️ Important Notes

### For Local Development (localhost)
- Keep using `npm run dev`
- Buttons will work via polling mode
- Webhook is NOT needed for local dev

### For Production (Vercel)
- Webhook MUST be set (one time)
- Do NOT run `npm run dev` while testing production
- Webhook persists across deployments

---

## 🔧 Alternative: One-Line Setup

If the above doesn't work, try setting webhook via URL:

1. Open your browser
2. Visit this URL:
   ```
   https://elitemarts-e-commerce2-gsffgjoj5-elitemarts-projects-8b4bda94.vercel.app/api/telegram/webhook?action=set
   ```

You should see:
```json
{
  "success": true,
  "message": "Webhook set successfully"
}
```

---

## ✅ Success Checklist

- [ ] Dev server stopped (`npm run dev` not running)
- [ ] Webhook set command executed
- [ ] Webhook info shows URL (not empty)
- [ ] Test order created on production site
- [ ] Telegram notification received
- [ ] VERIFY button clicked
- [ ] Button worked and payment updated
- [ ] User sees confetti 🎉

---

## 🆘 Troubleshooting

**Q: Webhook URL is still empty**
- A: Make sure `npm run dev` is completely stopped
- A: Wait 10 seconds after stopping dev server
- A: Try setting webhook again

**Q: Buttons don't respond**
- A: Check Vercel logs for errors
- A: Verify webhook URL is correct (check Step 4)
- A: Make sure you're testing on production URL, not localhost

**Q: "Unknown action" error in logs**
- A: Old code is still cached
- A: Clear Vercel deployment cache
- A: Redeploy from Vercel dashboard
