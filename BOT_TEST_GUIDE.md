# Telegram Bot - Quick Test Guide

## ✅ Server is Running!

Your dev server should now be running on **http://localhost:3000**

## 🧪 Test the Bot Commands

### 1. Open Telegram and find your bot: `@elitemartsssBot`

### 2. Test Basic Commands:

Send these commands one by one:

```
/start
```
**Expected**: Welcome message with your Chat ID

```
/help
```
**Expected**: List of available commands

### 3. Test Payment Verification:

Use the session ID from your previous payment notification:

```
/verify SESSION-1768053339451-9B1ZK
```

**Expected**: Bot should respond with payment verification confirmation

---

## 🔍 Troubleshooting

### If bot doesn't respond:

1. **Check terminal output** - Look for these messages:
   ```
   🤖 Telegram bot initialized (POLLING mode - Local Development)
   📱 Admin Chat ID: 6423059380
   💡 Commands will work immediately in Telegram
   ✅ Bot command handlers registered successfully
   ```

2. **If you don't see those messages**, the bot module hasn't loaded yet. Try:
   - Visit http://localhost:3000 in your browser
   - This will trigger the bot initialization
   - Then try the commands again

3. **Check for errors** in the terminal

---

## 📝 What Changed

- **Local Development**: Bot uses POLLING mode (actively checks for messages)
- **Production (Vercel)**: Bot uses WEBHOOK mode (Telegram sends updates)
- **Automatic Detection**: Code automatically switches based on environment

---

## 🚀 Ready to Deploy?

Once local testing works:
1. Commit and push to Git
2. Vercel will auto-deploy
3. Visit: `https://your-project.vercel.app/api/telegram/webhook?action=set`
4. Bot will work in production with webhooks!

---

**Try `/start` in Telegram now!** 🎯
