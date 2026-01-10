# Telegram Bot Setup Instructions

## Step 1: Configure Bot Commands in BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/mybots`
3. Select your bot: `elitemartsssBot`
4. Click `Edit Bot` → `Edit Commands`
5. Send this exact text:

```
verify - Verify a payment session
reject - Reject a payment session
```

6. Done! ✅

## Step 2: Test the Bot

1. **Restart your development server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **You should see:**
   ```
   🤖 Telegram bot started successfully
   ```

3. **Test payment flow:**
   - Fill order form on website
   - You'll get Telegram notification with commands
   - Click `/verify_SESSIONID` to approve
   - Or type: `/verify SESSIONID` (both work!)

## Troubleshooting

**If bot doesn't respond:**
1. Make sure `.env.local` has correct values:
   ```
   TELEGRAM_BOT_TOKEN="8303838694:AAEx0CzTkrVn38tsXxXT7Iw-183zHvWyjrA"
   TELEGRAM_ADMIN_CHAT_ID="6423059380"
   ```

2. Restart `npm run dev`

3. Check terminal for "🤖 Telegram bot started successfully"

**If "Session not found" error:**
- The session might have expired (15 min timeout)
- Try creating a new order

## How Commands Work

The bot now accepts commands in TWO formats:
- `/verify_SESS-123-ABC` (with underscore)
- `/verify SESS-123-ABC` (with space)

Both will work! Just click the command in the notification message.
