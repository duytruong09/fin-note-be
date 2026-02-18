# 🎙️ FIN-NOTE Backend API

> **Voice-enabled expense tracking made effortless**
> Speak naturally. AI does the rest. Track your finances through Telegram or mobile app.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)

---

## 🌟 What is FIN-NOTE?

FIN-NOTE is an intelligent expense tracking system that understands natural language. Simply speak or type:

- **Vietnamese**: *"Hôm nay ăn cơm 50 nghìn"*
- **English**: *"Coffee 30k"*

AI automatically extracts:
- ✅ Amount & Currency
- ✅ Category (Food, Transport, etc.)
- ✅ Date & Description
- ✅ Transaction Type (Expense/Income)

**No forms. No typing. Just speak.**

---

## ✨ Key Features

### 🎤 Voice-First Experience
- **Whisper AI** - Industry-leading speech recognition (Vietnamese + English)
- **GPT-4o-mini** - Natural language parsing with 95%+ accuracy
- **Gemini Integration** - Free tier alternative for voice processing
- **Audio Formats** - Supports M4A, WAV, OGG (auto-converted)

### 🤖 Telegram Bot Integration

<div align="center">
  <img src="docs/images/telegram-bot-help.png" alt="Telegram Bot Interface" width="400"/>
  <p><i>Track expenses directly in Telegram - no app install needed</i></p>
</div>

**Features:**
- 🗣️ Send voice messages → Auto-create transactions
- 💬 Send text messages → Instant parsing
- 📊 View daily stats with `/stats`
- 📝 See today's transactions with `/today`
- 🏷️ Browse categories with `/categories`
- ✅ Confirm/cancel with inline keyboards

**Setup**: See [Telegram Bot Guide](docs/TELEGRAM_BOT.md)

### 💾 Robust Data Management
- **PostgreSQL** - Production-grade relational database
- **Prisma ORM** - Type-safe database access
- **Soft Deletes** - Never lose transaction history
- **Audit Logs** - Track all voice processing attempts

### 🔐 Enterprise Security
- **JWT Authentication** - Access + refresh token rotation
- **Bcrypt Hashing** - Secure password storage (10+ rounds)
- **Input Validation** - Class-validator DTOs on all endpoints
- **CORS Protection** - Configurable origin whitelist

### 📈 Smart Budgeting
- Set monthly budgets per category
- Real-time spending alerts
- Budget vs. actual tracking
- Rollover support for unused budgets

### 🌍 Multi-Platform Ready
- **REST API** - Standard HTTP JSON API (`/api/v1`)
- **Telegram Bot** - Chat interface (no app needed)
- **Mobile App** - React Native (separate repo)
- **Web Dashboard** - Coming soon

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 15+ (or use Supabase)
- **OpenAI API Key** (or Gemini API for free tier)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/fin-note-be.git
cd fin-note-be
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/finnote"

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here

# OpenAI API
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL_WHISPER=whisper-1
OPENAI_MODEL_GPT=gpt-4o-mini-2024-07-18

# Gemini API (optional, free alternative)
GEMINI_API_KEY=AIza...
STT_PROVIDER=whisper  # or 'gemini'

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 3. Setup Database

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d

# Run migrations
npm run prisma:migrate

# Seed initial data (categories, settings)
npm run prisma:seed
```

This creates:
- ✅ 15 default categories (Food, Transport, Shopping, etc.)
- ✅ 4 system settings
- ✅ Database schema with indexes

### 4. Start Development Server

```bash
npm run start:dev
```

Server runs at: **http://localhost:3000/api/v1**

### 5. Test Voice Processing

```bash
# Test with Postman or curl
curl -X POST http://localhost:3000/api/v1/voice/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@test-audio.m4a" \
  -F "language=vi"
```

---

## 📡 API Documentation

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login (returns JWT) |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `GET` | `/api/v1/categories` | List categories |
| `GET` | `/api/v1/transactions` | List transactions (with filters) |
| `POST` | `/api/v1/transactions` | Create transaction |
| `GET` | `/api/v1/transactions/summary` | Daily/monthly summary |
| `POST` | `/api/v1/voice/process` | **Process voice input** |
| `POST` | `/api/v1/voice/transcribe` | Transcribe only (no parsing) |

### Voice Processing API

**Request:**
```bash
POST /api/v1/voice/process
Content-Type: multipart/form-data

audio: <file.m4a>
language: "vi" | "en"
sttProvider: "whisper" | "gemini"  # optional
```

**Response:**
```json
{
  "transcript": "Hôm nay ăn cơm 50 nghìn",
  "parsedData": {
    "amount": 50000,
    "currency": "VND",
    "category": "Food & Dining",
    "description": "Ăn cơm",
    "type": "EXPENSE",
    "date": "2026-02-18"
  },
  "confidence": 0.92,
  "suggestedCategory": {
    "id": "abc-123",
    "name": "Food & Dining",
    "icon": "🍜"
  }
}
```

**See detailed guide:** [Voice API Documentation](docs/VOICE_API_GUIDE.md)

---

## 🐳 Docker Deployment

### Build Production Image

```bash
# Build optimized Docker image (multi-stage)
npm run docker:build

# Test locally
npm run docker:test
```

**Image Optimizations:**
- ✅ Multi-stage build (-38% size)
- ✅ Production deps only
- ✅ Non-root user for security
- ✅ Health checks included
- ✅ Memory-optimized for 512MB RAM

### Deploy to Render (Free Tier)

**Zero-cost deployment with CI/CD:**

1. **Quick Start** (15 minutes):
   → [DEPLOYMENT_QUICKSTART.md](DEPLOYMENT_QUICKSTART.md)

2. **Full Setup Guide**:
   → [Render Deployment Guide](docs/deployment/RENDER_SETUP.md)

3. **Troubleshooting**:
   - [Fix OOM errors](docs/deployment/RENDER_OOM_FIX.md)
   - [Supabase connection issues](docs/deployment/SUPABASE_CONNECTION_STRING.md)

**One-command deploy:**
```bash
# Render will auto-deploy from GitHub
git push origin main
```

**Infrastructure as Code:**
```yaml
# render.yaml
services:
  - type: web
    name: fin-note-api
    runtime: docker
    envVars:
      - key: NODE_OPTIONS
        value: --max-old-space-size=460  # OOM fix
      - key: DATABASE_URL
        sync: false  # Set in Render dashboard
```

---

## 🤖 Telegram Bot Setup

### 1. Create Bot

1. Open Telegram → Search `@BotFather`
2. Send `/newbot` → Follow instructions
3. Copy the **bot token** (e.g., `123456789:ABCdefGHI...`)

### 2. Configure

Add to `.env`:
```env
TELEGRAM_BOT_TOKEN=your-token-here
```

Or store in database (recommended):
```bash
npm run prisma:studio
# Add to 'settings' table:
# key: telegram_bot_token
# value: your-token
# isSecret: true
```

### 3. Start Bot

```bash
npm run start:dev
```

Look for: `✅ Telegram bot started successfully`

### 4. Test

1. Open Telegram → Search for your bot username
2. Send `/start` to register
3. Send voice: *"Hôm nay ăn cơm 50k"*
4. Or text: *"Mua cafe 30 nghìn"*

**Full Guide:** [Telegram Bot Documentation](docs/TELEGRAM_BOT.md)

---

## 🗄️ Database Schema

### Key Models

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  fullName  String
  password  String   // bcrypt hashed
  preferredLanguage String @default("vi")

  transactions Transaction[]
  budgets      Budget[]
  settings     UserSettings?
}

model Transaction {
  id          String   @id @default(uuid())
  userId      String
  categoryId  String?

  amount      Decimal  @db.Decimal(15, 2)
  currency    String   @default("VND")
  type        TransactionType  // INCOME | EXPENSE
  description String?

  // Voice-specific fields
  isVoiceCreated Boolean @default(false)
  voiceTranscript String?
  voiceParsingConfidence Decimal?

  transactionDate DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?  // Soft delete

  user     User      @relation(...)
  category Category? @relation(...)
}

model Category {
  id          String  @id @default(uuid())
  name        String
  icon        String?
  color       String?
  isSystem    Boolean @default(false)
  userId      String?  // null = system category

  transactions Transaction[]
}

model VoiceProcessingLog {
  id              String   @id @default(uuid())
  userId          String
  audioUrl        String?
  transcript      String?
  parsedData      Json?
  confidence      Decimal?
  sttProvider     String   // "whisper" | "gemini"
  errorMessage    String?
  processingTime  Int?     // milliseconds
  createdAt       DateTime @default(now())
}
```

### Prisma Commands

```bash
# Generate TypeScript client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_feature

# Apply migrations (production)
npx prisma migrate deploy

# Database GUI
npx prisma studio  # → http://localhost:5555

# Reset database (⚠️ dev only)
npx prisma migrate reset
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 📂 Project Structure

```
fin-note-be/
├── src/
│   ├── main.ts                      # App entry point
│   ├── app.module.ts                # Root module
│   │
│   ├── config/
│   │   └── configuration.ts         # Environment config
│   │
│   ├── common/                      # Shared utilities
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   │
│   ├── infrastructure/              # Infrastructure layer
│   │   ├── database/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   └── ai/
│   │       └── ai.service.ts        # OpenAI wrapper
│   │
│   └── modules/                     # Feature modules
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   ├── dto/
│       │   └── strategies/
│       │
│       ├── users/
│       ├── categories/
│       ├── transactions/
│       ├── budgets/
│       │
│       ├── voice/                   # 🎤 Voice processing
│       │   ├── voice.controller.ts
│       │   ├── voice.service.ts
│       │   ├── voice.module.ts
│       │   └── services/
│       │       ├── whisper.service.ts
│       │       ├── gemini-speech.service.ts
│       │       └── gpt-parser.service.ts
│       │
│       └── telegram/                # 🤖 Telegram bot
│           ├── telegram-bot.update.ts
│           ├── telegram-auth.service.ts
│           └── telegram-voice.service.ts
│
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── seed.ts                      # Seed data
│   └── migrations/
│
├── .prompt/                         # AI prompt templates
│   ├── expense-parser-vi.txt
│   ├── expense-parser-en.txt
│   └── CHANGELOG.md
│
├── docs/
│   ├── VOICE_API_GUIDE.md
│   ├── TELEGRAM_BOT.md
│   ├── TELEGRAM_SETUP.md
│   ├── GEMINI_FREE_SETUP.md
│   ├── POSTMAN_GUIDE.md
│   └── deployment/
│       ├── RENDER_SETUP.md
│       ├── RENDER_OOM_FIX.md
│       └── SUPABASE_CONNECTION_STRING.md
│
├── scripts/
│   └── render-migrate.sh            # Migration script for Render
│
├── Dockerfile                       # Multi-stage production build
├── docker-compose.yml               # Local PostgreSQL
├── render.yaml                      # Render IaC config
└── .env.example                     # Environment template
```

---

## 🛠️ Development Tools

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Opens at `http://localhost:5555` - browse/edit database visually.

### API Testing

**Postman Collection:**
[POSTMAN_GUIDE.md](docs/POSTMAN_GUIDE.md) - Pre-configured collection with all endpoints

**Sample Request:**
```bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "preferredLanguage": "vi"
  }'

# Create transaction (after login)
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "VND",
    "type": "EXPENSE",
    "categoryId": "category-id",
    "description": "Lunch"
  }'
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Format with Prettier
npm run format
```

---

## 📊 Cost Estimation

### Free Tier Stack

**Total: $0/month** (with limits)

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Render** | 750 hours/month | Auto-sleep after 15min idle |
| **Supabase** | 500MB database | 2GB bandwidth/month |
| **Gemini API** | 1,500 requests/day | Voice transcription |
| **Telegram Bot** | Unlimited | Free forever |

### Paid Options

**OpenAI API:**
- Whisper: $0.006/minute
- GPT-4o-mini: $0.15 per 1M input tokens

**Example:** 100 users × 5 voice msgs/day = ~$15/month

**Render Paid:**
- Starter: $7/month (1GB RAM, no sleep)
- Standard: $25/month (2GB RAM, auto-scale)

---

## 🔒 Security Best Practices

### ✅ Implemented

- [x] JWT with access + refresh tokens
- [x] Password hashing (bcrypt, 10 rounds)
- [x] Input validation (class-validator)
- [x] SQL injection protection (Prisma ORM)
- [x] CORS configuration
- [x] Environment secrets (.env not committed)
- [x] Non-root Docker user
- [x] Soft deletes for audit trail

### 🚧 TODO (Production)

- [ ] Rate limiting (express-rate-limit)
- [ ] Helmet.js security headers
- [ ] API key rotation strategy
- [ ] Encrypt audio files at rest
- [ ] 2FA authentication
- [ ] Audit log retention policy

---

## 📚 Documentation

### User Guides
- [Voice API Guide](docs/VOICE_API_GUIDE.md) - Voice processing API reference
- [Telegram Bot Guide](docs/TELEGRAM_BOT.md) - Complete Telegram integration docs
- [Postman Guide](docs/POSTMAN_GUIDE.md) - API testing with examples

### Setup Guides
- [Telegram Setup](docs/TELEGRAM_SETUP.md) - Step-by-step bot setup
- [Gemini Free Setup](docs/GEMINI_FREE_SETUP.md) - Free STT alternative

### Deployment
- [Render Setup](docs/deployment/RENDER_SETUP.md) - Production deployment guide
- [OOM Troubleshooting](docs/deployment/RENDER_OOM_FIX.md) - Fix memory issues
- [Supabase Connection](docs/deployment/SUPABASE_CONNECTION_STRING.md) - Database config

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

**Commit Convention:** Follow [Conventional Commits](https://www.conventionalcommits.org/)
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `test:` - Test additions/changes

---

## 📝 Changelog

See [CHANGELOG.md](docs/CHANGELOG.md) for version history.

**Latest:** v1.0.0 (2026-02-18)
- ✅ Voice processing (Whisper + Gemini)
- ✅ Telegram bot integration
- ✅ JWT authentication
- ✅ Transaction CRUD with filters
- ✅ Category management
- ✅ Budget tracking
- ✅ Production-ready deployment

---

## 🐛 Troubleshooting

### Cannot connect to database

```bash
# Check PostgreSQL
docker ps

# Start if stopped
docker-compose up -d

# View logs
docker-compose logs postgres
```

### Prisma errors

```bash
# Regenerate client
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset
```

### Voice processing fails

1. Check API keys in `.env`
2. Verify audio format (M4A, WAV, OGG)
3. Check file size (<10MB)
4. View logs: `npm run start:dev`

### Telegram bot not responding

```bash
# Test token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check logs
npm run start:dev
# Look for: "✅ Telegram bot started successfully"
```

---

## 📞 Support

- 📧 **Email:** support@finnote.app
- 💬 **Telegram:** @finnote_support
- 🐛 **Issues:** [GitHub Issues](https://github.com/yourusername/fin-note-be/issues)
- 📖 **Docs:** [Documentation Portal](https://docs.finnote.app)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [OpenAI](https://openai.com/) - Whisper & GPT models
- [Google Gemini](https://ai.google.dev/) - Free STT alternative
- [Telegraf](https://telegraf.js.org/) - Telegram bot framework
- [Render](https://render.com/) - Easy cloud deployment
- [Supabase](https://supabase.com/) - Postgres hosting

---

## ⭐ Star History

If this project helps you, please consider giving it a ⭐!

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/fin-note-be&type=Date)](https://star-history.com/#yourusername/fin-note-be&Date)

---

<div align="center">
  <p><strong>Built with ❤️ for effortless expense tracking</strong></p>
  <p>
    <a href="https://finnote.app">Website</a> •
    <a href="docs/VOICE_API_GUIDE.md">API Docs</a> •
    <a href="docs/TELEGRAM_BOT.md">Telegram Bot</a> •
    <a href="docs/deployment/RENDER_SETUP.md">Deploy Guide</a>
  </p>
</div>
