# 🤖 Quick Start: Telegram Bot

## ⚡ Fast Setup (5 minutes)

### 1️⃣ Create Bot Token

1. Open Telegram → Search **@BotFather**
2. Send `/newbot`
3. Name: `Fin-Note Voice Bot`
4. Username: `finnote_voice_bot` (or any available name ending with `bot`)
5. **Copy the token** 📋

### 2️⃣ Add Token to Database

**Option A: Via Environment Variable (for seed)**

Add to your `.env` temporarily:

```env
TELEGRAM_BOT_TOKEN=your-token-here
```

**Option B: Direct Database Insert**

```sql
INSERT INTO settings (id, key, value, description, is_secret, is_public, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'telegram_bot_token',
  'your-token-here',
  'Telegram Bot API Token',
  true,
  false,
  NOW(),
  NOW()
);
```

### 3️⃣ Run Migration & Seed

```bash
# Run migration
npx prisma generate
npx prisma migrate dev

# Seed database (includes settings)
npm run prisma:seed
```

If you used Option A (env variable), the token will be auto-inserted.
If using Option B, skip seed and insert manually.

### 4️⃣ Start Server

```bash
npm run start:dev
```

✅ Look for: `Telegram bot started successfully`

### 5️⃣ Test Bot

1. Search your bot in Telegram
2. Send `/start`
3. Send voice: "Hôm nay ăn cơm 50 nghìn"
4. Confirm ✅

---

## 📁 New Files Created

```
src/modules/telegram-bot/
├── telegram-bot.module.ts           # Module definition
├── telegram-bot.update.ts           # Bot handlers (commands, messages)
├── dto/
│   └── telegram-user.dto.ts         # DTOs
└── services/
    ├── telegram-auth.service.ts     # User authentication
    └── telegram-voice.service.ts    # Voice processing

prisma/schema.prisma                 # Added Setting model + Telegram fields
docs/TELEGRAM_BOT.md                 # Full documentation
```

---

## 🎯 Commands

| Command | Description |
|---------|-------------|
| `/start` | Register & welcome |
| `/help` | Usage guide |
| `/stats` | Today's stats |
| `/today` | Transaction list |
| `/categories` | Categories |

---

## 🎤 Usage Examples

**Voice:**
- "Hôm nay ăn cơm 50 nghìn"
- "Mua cafe 30k"
- "Taxi 100 nghìn"

**Text:**
- "Ăn trưa 50k"
- "Mua sách 200k"

---

## 📚 Full Documentation

See [docs/TELEGRAM_BOT.md](docs/TELEGRAM_BOT.md) for:
- Deployment guide
- Webhook setup
- Architecture details
- Troubleshooting
- API reference

---

## ⚠️ Troubleshooting

**Bot doesn't start:**
```bash
# Check token is in .env
cat .env | grep TELEGRAM

# Check dependencies
npm list telegraf
```

**Voice not working:**
```bash
# Check ffmpeg
npm list ffmpeg-static

# Check temp directory
ls -la temp/telegram-audio/
```

---

🎉 **Ready to use!** Send voice messages in Telegram to track expenses.
