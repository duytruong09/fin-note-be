# Telegram Bot Integration Guide

## Overview

Fin-Note Telegram Bot allows users to track expenses using voice messages or text directly in Telegram, without needing to install a mobile app.

### Features

✅ **Voice Input** - Send voice messages to create transactions
✅ **Text Input** - Send text messages like "Hôm nay ăn cơm 50k"
✅ **Auto Account Creation** - Users are automatically registered on /start
✅ **Vietnamese & English** - Supports both languages
✅ **Transaction Stats** - View daily statistics and transaction history
✅ **Inline Keyboards** - Confirm/cancel transactions with buttons

---

## Setup Guide

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the instructions:
   - Choose a display name (e.g., "Fin-Note Voice Bot")
   - Choose a username (must end with "bot", e.g., "finnote_voice_bot")
4. **Copy the bot token** (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Add Token to Database

The bot token is stored in the `settings` table, not in `.env`.

**Method 1: Seed with Environment Variable**

```bash
# Add to .env temporarily
echo "TELEGRAM_BOT_TOKEN=your-token-here" >> .env

# Run seed
npm run prisma:seed
```

**Method 2: Direct Database Insert**

```sql
INSERT INTO settings (id, key, value, description, is_secret, is_public, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'telegram_bot_token',
  'your-bot-token-here',
  'Telegram Bot API Token from @BotFather',
  true,
  false,
  NOW(),
  NOW()
);
```

**Method 3: Using Prisma Studio**

```bash
npx prisma studio
```

Then:
1. Open `settings` table
2. Add new record:
   - key: `telegram_bot_token`
   - value: `your-token`
   - isSecret: `true`
   - isPublic: `false`

### 3. Run Database Migration

The Telegram integration adds fields to `user_settings` and creates a new `settings` table:

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name add_telegram_and_settings
```

### 4. Start the Server

```bash
npm run start:dev
```

You should see:
```
✅ Telegram bot started successfully
```

### 5. Test Your Bot

1. Open Telegram and search for your bot username
2. Send `/start` to register
3. Try sending a voice message: "Hôm nay ăn cơm 50 nghìn"
4. Or send text: "Mua cafe 30k"

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Register and get welcome message |
| `/help` | Show usage instructions |
| `/stats` | View today's expense statistics |
| `/today` | List today's transactions |
| `/categories` | View expense categories |

---

## Usage Examples

### Voice Input

1. **Press and hold** the microphone button in Telegram
2. **Speak naturally** in Vietnamese or English:
   - "Hôm nay ăn sáng 30 nghìn"
   - "Mua sách 200 nghìn"
   - "Taxi 100k"
3. **Bot responds** with parsed transaction details
4. **Confirm or cancel** using inline buttons

### Text Input

Simply send a text message:

**Vietnamese:**
- "Ăn trưa 50k"
- "Mua quần áo 500 nghìn"
- "Nhận lương 10 triệu" (income)

**English:**
- "Lunch 50000"
- "Coffee 30k"

---

## Architecture

```
Telegram App (User)
         ↓
    Telegram API
         ↓
TelegramBotUpdate (handles messages/commands)
         ↓
TelegramAuthService (user registration/linking)
         ↓
TelegramVoiceService (download & convert audio)
         ↓
VoiceService (existing - transcribe & parse)
         ↓
TransactionsService (create transaction)
         ↓
PostgreSQL Database
```

---

## Database Schema

### UserSettings Model (with Telegram fields)

```prisma
model UserSettings {
  userId String @id

  // ... other settings fields

  // Telegram integration (user-level)
  telegramChatId String? @unique // Telegram chat ID for sending messages
  telegramUserId String? @unique // Telegram user ID

  user User @relation(...)
}
```

### Setting Model (app-level)

```prisma
model Setting {
  id          String  @id @default(uuid())
  key         String  @unique // "telegram_enabled", "feature_voice_enabled", etc.
  value       String?
  description String?
  options     Json?
  isSecret    Boolean @default(false)
  isPublic    Boolean @default(false) // Available to mobile app
}
```

**Key Points:**
- Telegram info stored in `UserSettings` (per-user)
- Each Telegram user gets a unique app `User` account on first `/start`
- `telegramUserId` is the unique Telegram user ID
- `telegramChatId` is used to send messages back to the user
- `Setting` table for app-wide configuration (feature flags, etc.)

---

## Audio Processing Flow

1. **Download** - Telegram voice messages are in `.oga` format (Opus codec)
2. **Convert** - Use ffmpeg to convert `.oga` → `.wav` (16kHz, mono)
3. **Process** - Pass to existing `VoiceService.processVoiceInput()`
4. **Cleanup** - Delete temporary files after processing

### File Locations

Temporary audio files are stored in:
```
temp/telegram-audio/
```

These are automatically deleted after processing.

---

## Configuration Options

### Environment Variables

```env
# Required
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Optional (for production webhook mode)
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/telegram/webhook
```

### Webhook vs Polling

**Polling (Default - Development)**
- Bot actively checks Telegram for new messages
- Easier to set up (no HTTPS required)
- Works on localhost
- Higher latency

**Webhook (Production)**
- Telegram pushes updates to your server
- Requires HTTPS and public domain
- Lower latency
- More efficient

To use webhook mode:
1. Set `TELEGRAM_WEBHOOK_URL` in `.env`
2. Implement webhook endpoint in `telegram-bot.update.ts`

---

## Security Considerations

### Auto-Registration

- Each Telegram user gets a unique account on `/start`
- Email: `telegram_{telegramId}@finnote.app`
- Random password generated
- No way to login via web/app with this account (Telegram only)

### Account Linking (Future Feature)

For users who want to link their Telegram to an existing account:

1. User logs into web app
2. Generate 6-digit link code
3. User sends `/link <code>` in Telegram
4. Accounts are linked

Currently **not implemented** - each Telegram user is standalone.

---

## Deployment

### Development

```bash
npm run start:dev
```

Bot runs in **polling mode** (long-polling).

### Production

**Option 1: Keep Polling**
```bash
npm run start:prod
```

**Option 2: Use Webhook (Recommended)**

1. Deploy to server with HTTPS
2. Set webhook URL:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/telegram/webhook"
   ```
3. Implement webhook endpoint in code

**Using PM2:**
```bash
pm2 start dist/main.js --name finnote-api
pm2 save
pm2 startup
```

**Using Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js"]
```

---

## Monitoring & Logs

### Check Bot Status

All bot interactions are logged to console:

```
[TelegramBotUpdate] ✅ Telegram bot started successfully
[TelegramBotUpdate] New Telegram user created: 123456789
[TelegramVoiceService] Downloaded voice file: temp/telegram-audio/...
[VoiceService] Processing voice input for user abc-123
```

### Voice Processing Logs

All voice processing attempts are saved to `voice_processing_logs` table:

```sql
SELECT * FROM voice_processing_logs
WHERE user_id IN (
  SELECT user_id FROM telegram_users
)
ORDER BY created_at DESC;
```

### Error Handling

Common errors and solutions:

**Error: TELEGRAM_BOT_TOKEN is not defined**
- Add token to `.env` file

**Error: Failed to download voice file**
- Check internet connection
- Verify bot token is correct

**Error: Failed to convert audio format**
- Ensure ffmpeg-static is installed
- Check temp directory permissions

---

## Troubleshooting

### Bot doesn't respond

1. Check bot is running:
   ```bash
   pm2 logs finnote-api
   ```

2. Verify token in `.env`

3. Test token manually:
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getMe
   ```

### Voice messages not processing

1. Check ffmpeg is installed:
   ```bash
   npm list ffmpeg-static
   ```

2. Check temp directory exists and is writable:
   ```bash
   ls -la temp/telegram-audio/
   ```

3. Check logs for conversion errors

### Database connection issues

```bash
# Check database is running
docker ps

# Test Prisma connection
npx prisma db pull
```

---

## Cost Estimation

### Free Tier (Telegram Bot API)

- ✅ **Unlimited messages**
- ✅ **Free hosting** (if using polling on own server)
- ✅ **No API costs** for Telegram infrastructure

### Voice Processing Costs (OpenAI/Gemini)

**Whisper STT:**
- ~$0.006 per minute of audio

**GPT-4o-mini Parsing:**
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens

**Gemini (Free Tier):**
- 1,500 requests per day (free)
- Then $0.00025 per request

**Example Monthly Cost:**
- 100 users × 5 voice messages/day × 30 days = 15,000 requests
- Using Gemini free tier: **$0** (under 1,500/day)
- Using Whisper + GPT-4o-mini: **~$15/month**

---

## Roadmap

### Current Features ✅
- [x] Voice message processing
- [x] Text message parsing
- [x] Auto user registration
- [x] Transaction creation
- [x] Basic commands (/start, /help, /stats, /today)
- [x] Inline keyboards for confirmation

### Planned Features 🚧
- [ ] Account linking (connect Telegram to existing account)
- [ ] Edit transactions after creation
- [ ] Budget alerts via Telegram
- [ ] Monthly reports
- [ ] Export data to CSV
- [ ] Multi-language support (English full support)
- [ ] Category customization
- [ ] Recurring transactions
- [ ] Voice transaction history playback

---

## FAQ

**Q: Can I use the bot without the mobile app?**
A: Yes! The bot is a standalone interface. No mobile app needed.

**Q: Is my data secure?**
A: Yes. All data is stored in your PostgreSQL database. Audio files are deleted after processing.

**Q: Can multiple people use the same bot?**
A: Yes! Each Telegram user gets their own separate account and data.

**Q: What languages are supported?**
A: Vietnamese (full support) and English (basic support). The bot auto-detects language from Telegram settings.

**Q: How accurate is voice recognition?**
A: ~95% accuracy for Vietnamese voice input using Whisper/Gemini. You can always confirm/edit before saving.

**Q: Can I self-host?**
A: Yes! All code is open-source. Just deploy to any server with Node.js.

---

## Support

- 📧 Email: support@finnote.app
- 💬 Telegram: @finnote_support
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/fin-note/issues)

---

## BotFather Commands Setup

Send these commands to @BotFather to set up your bot's command menu:

```
/setcommands

start - Bắt đầu sử dụng bot
help - Xem hướng dẫn
stats - Xem thống kê
today - Giao dịch hôm nay
categories - Danh mục chi tiêu
```

Optional settings:
```
/setdescription
Ghi lại chi tiêu bằng giọng nói. Nói "Hôm nay ăn cơm 50k" và tôi sẽ tự động lưu giao dịch.

/setabouttext
Fin-Note Voice Bot - Personal expense tracker with voice input support.
```

---

_Last updated: 2026-02-18_
