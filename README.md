# FIN-NOTE Backend API

NestJS backend với Prisma ORM, PostgreSQL và OpenAI integration cho voice-to-expense feature.

## 📁 Project Structure

```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── config/
│   └── configuration.ts         # Environment configuration
├── common/                      # Shared utilities
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── infrastructure/
│   └── database/
│       ├── prisma.service.ts    # Prisma client service
│       └── prisma.module.ts
└── modules/
    └── auth/                    # Authentication module ✅
        ├── auth.controller.ts
        ├── auth.service.ts
        ├── auth.module.ts
        ├── dto/
        │   ├── register.dto.ts
        │   └── login.dto.ts
        └── strategies/
            └── jwt.strategy.ts
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env and update these values:
# - DATABASE_URL
# - JWT_ACCESS_SECRET (generate random string)
# - JWT_REFRESH_SECRET (generate random string)
# - OPENAI_API_KEY (from OpenAI dashboard)
```

### 3. Start PostgreSQL

```bash
# Using Docker Compose
docker-compose up -d

# Verify PostgreSQL is running
docker ps
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Or manually
npx prisma migrate dev --name init
```

### 5. Seed Database

```bash
npm run prisma:seed
```

This will create system categories (Food, Transport, Shopping, etc.)

### 6. Start Development Server

```bash
npm run start:dev
```

Server will run at: `http://localhost:3000/api/v1`

## 📡 Available Endpoints

### Authentication

```bash
# Register new user
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "preferredLanguage": "vi"
}

# Login
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh tokens
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## 🗄️ Database Schema

See `prisma/schema.prisma` for complete schema.

### Main Models

- **User** - User accounts with preferences
- **Category** - System + custom categories
- **Transaction** - Financial transactions (with voice fields)
- **Budget** - Budget tracking
- **VoiceProcessingLog** - AI processing logs
- **Tag** - Transaction tags

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Next Steps

### Immediate Tasks (MVP)

1. **Create Transactions Module**
   - `src/modules/transactions/`
   - CRUD endpoints
   - Filtering & pagination
   - Soft delete support

2. **Create Categories Module**
   - `src/modules/categories/`
   - List system categories
   - Create/update custom categories

3. **Create Voice Module** 🎤 (Core Feature)
   - `src/modules/voice/`
   - Audio upload endpoint
   - Whisper service integration
   - GPT parser service
   - Voice processing pipeline

4. **Create Budgets Module**
   - `src/modules/budgets/`
   - Budget CRUD
   - Alert threshold logic

5. **Create Users Module**
   - `src/modules/users/`
   - User profile management
   - Settings management

### Infrastructure Tasks

6. **AI Integration**
   - `src/infrastructure/ai/ai.service.ts`
   - OpenAI client wrapper
   - Prompt loading from `.prompt/` files
   - Error handling & retry logic

7. **Storage Service**
   - `src/infrastructure/storage/`
   - Local file storage
   - S3 integration (optional)

8. **Validation & Error Handling**
   - Global exception filter
   - Response interceptor
   - Request logging

## 🔐 Security Checklist

- [x] JWT authentication implemented
- [x] Password hashing with bcrypt
- [x] Input validation with class-validator
- [ ] Rate limiting (TODO)
- [ ] Helmet.js for security headers (TODO)
- [ ] CORS configured (basic)
- [ ] API key rotation strategy (TODO)

## 🎯 Performance Optimization

- [ ] Database query optimization
- [ ] Caching with Redis
- [ ] Connection pooling
- [ ] API response compression

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

## 🐛 Troubleshooting

### Cannot connect to database

```bash
# Check if PostgreSQL is running
docker ps

# Start PostgreSQL
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

### Prisma Client not generated

```bash
npx prisma generate
```

### Migration errors

```bash
# Reset database (dev only!)
npx prisma migrate reset

# Or manually fix migration
npx prisma migrate resolve --rolled-back <migration_name>
```

---

**Status**: ✅ MVP Backend Complete!

**Implemented Modules:**
- ✅ Authentication (JWT)
- ✅ Categories (System + Custom)
- ✅ Transactions (CRUD + Summary)
- ✅ Voice Processing 🎤 (Whisper + GPT)

**Next Steps:**
1. Test the backend (see commands below)
2. Implement Frontend (React Native)
3. Implement Budgets module
