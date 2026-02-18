# Render Deployment Guide

Hướng dẫn chi tiết để deploy FIN-NOTE Backend lên Render với CI/CD tự động và **hoàn toàn miễn phí**.

## 📋 Tổng Quan

**Stack:**
- **Hosting:** Render (Web Service - Free Tier)
- **Database:** Supabase (PostgreSQL - Free Tier vĩnh viễn)
- **CI/CD:** GitHub + Render Auto-Deploy
- **Cost:** $0/tháng 🎉

**Render Free Tier:**
- 750 giờ/tháng (đủ cho 1 service chạy 24/7)
- 512 MB RAM
- Shared CPU
- HTTPS tự động
- Auto sleep sau 15 phút không hoạt động (wake up khi có request ~30s)

---

## 🚀 Bước 1: Setup Database (Supabase)

### 1.1. Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com)
2. Sign up/Login (dùng GitHub account)
3. Click **"New Project"**
4. Điền thông tin:
   - **Name:** fin-note-production
   - **Database Password:** Tạo password mạnh (lưu lại!)
   - **Region:** Southeast Asia (Singapore)
   - **Pricing Plan:** Free
5. Click **"Create new project"** (chờ ~2 phút)

### 1.2. Lấy Database URL

1. Vào **Project Settings** (icon bánh răng)
2. Chọn **Database** tab
3. Scroll xuống **Connection string** section
4. Copy **URI** (chọn mode: **Session**)
   ```
   postgresql://postgres.[project-id]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. **Quan trọng:** Thay `[YOUR-PASSWORD]` bằng password bạn đã tạo ở bước 1.1

### 1.3. Chạy Migrations trên Supabase

**Option A: Sử dụng Prisma Studio (Recommended)**

```bash
# Cập nhật DATABASE_URL trong .env
DATABASE_URL="postgresql://postgres.[project-id]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Chạy migrations
npx prisma migrate deploy

# Seed data (optional)
npm run prisma:seed
```

**Option B: Sử dụng Supabase SQL Editor**

1. Vào Supabase Dashboard → **SQL Editor**
2. Copy nội dung từ file `prisma/migrations/*/migration.sql`
3. Paste và chạy từng migration theo thứ tự

---

## 🌐 Bước 2: Setup Render

### 2.1. Tạo Render Account

1. Truy cập [render.com](https://render.com)
2. Sign up bằng **GitHub account** (để sync repos)

### 2.2. Deploy từ GitHub Repository

1. Vào Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository:
   - Nếu lần đầu: Click **"Connect GitHub"** → Authorize Render
   - Chọn repository: `fin-note-be`
4. Configure service:

   **Basic:**
   - **Name:** `fin-note-api` (hoặc tên bạn muốn)
   - **Region:** Singapore (gần Supabase)
   - **Branch:** `master` (hoặc `main`)
   - **Runtime:** Docker

   **Build & Deploy:**
   - **Dockerfile Path:** `Dockerfile` (mặc định)
   - **Docker Context:** `.` (root directory)

   **Instance Type:**
   - **Plan:** Free

5. Click **"Advanced"** để set environment variables

### 2.3. Cấu Hình Environment Variables

Click **"Add Environment Variable"** và thêm từng biến sau:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |
| `API_VERSION` | `v1` | |
| `DATABASE_URL` | `postgresql://postgres.[id]:...` | Paste từ Supabase (bước 1.2) |
| `JWT_ACCESS_SECRET` | `[generate random]` | Click "Generate Value" |
| `JWT_REFRESH_SECRET` | `[generate random]` | Click "Generate Value" |
| `JWT_ACCESS_EXPIRATION` | `15m` | |
| `JWT_REFRESH_EXPIRATION` | `7d` | |
| `OPENAI_API_KEY` | `sk-...` | Lấy từ OpenAI Platform |
| `OPENAI_MODEL_WHISPER` | `whisper-1` | |
| `OPENAI_MODEL_GPT` | `gpt-4o-mini-2024-07-18` | |
| `GEMINI_API_KEY` | `AIza...` | (Optional) Google AI Studio |
| `STT_PROVIDER` | `whisper` | Hoặc `gemini` |
| `STORAGE_TYPE` | `local` | |
| `STORAGE_PATH` | `/tmp/uploads` | Quan trọng: dùng /tmp trên Render |
| `CORS_ORIGIN` | `http://localhost:19006` | Cập nhật sau khi deploy frontend |
| `LOG_LEVEL` | `info` | |
| `MAX_AUDIO_FILE_SIZE_MB` | `10` | |
| `MAX_AUDIO_DURATION_SEC` | `60` | |
| `TELEGRAM_BOT_TOKEN` | `[your-bot-token]` | (Optional) |

**Tip:** Dùng `openssl rand -hex 32` để generate JWT secrets mạnh.

### 2.4. Deploy

1. Click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy (chờ ~3-5 phút)
3. Xem logs để theo dõi quá trình deploy

---

## ✅ Bước 3: Kiểm Tra Deployment

### 3.1. Test Health Check

Khi deploy xong, Render sẽ cung cấp URL: `https://fin-note-api.onrender.com`

```bash
# Test health endpoint
curl https://fin-note-api.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 3.2. Test API Endpoints

```bash
# Test registration
curl -X POST https://fin-note-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!",
    "name": "Test User"
  }'

# Test login
curl -X POST https://fin-note-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

### 3.3. Kiểm Tra Database

Vào Supabase Dashboard → **Table Editor** để xem data đã được tạo.

---

## 🔄 Bước 4: Setup CI/CD Tự Động

**Render đã tự động setup CI/CD!** Mỗi khi bạn push code lên branch `master`:

1. Render nhận webhook từ GitHub
2. Tự động pull code mới
3. Build Docker image
4. Deploy version mới
5. Chạy health check
6. Switch traffic sang version mới (zero-downtime)

**Xem deployment history:**
- Vào Render Dashboard → Service → **Events** tab

**Rollback nếu có lỗi:**
- Vào **Events** → Click version cũ → **Rollback to this version**

---

## 🔧 Bước 5: Tối Ưu Hóa

### 5.1. Giảm Cold Start Time

Render Free tier có "auto-sleep" sau 15 phút không dùng. Request đầu tiên sẽ mất ~30s để wake up.

**Giải pháp: Cron Job để ping định kỳ**

1. Tạo GitHub Actions workflow: `.github/workflows/keep-alive.yml`

```yaml
name: Keep Render Service Alive

on:
  schedule:
    # Ping mỗi 10 phút (Render sleep sau 15 phút)
    - cron: '*/10 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Service
        run: |
          curl -f https://fin-note-api.onrender.com/health || exit 0
```

**Lưu ý:** GitHub Actions có giới hạn 2000 phút/tháng cho free tier.

### 5.2. Monitoring và Logs

**Xem logs realtime:**
```bash
# Cài Render CLI
npm install -g render-cli

# Login
render login

# Tail logs
render logs fin-note-api --tail
```

**Hoặc:**
- Vào Render Dashboard → Service → **Logs** tab

### 5.3. Custom Domain (Optional)

1. Vào Service Settings → **Custom Domain**
2. Click **"Add Custom Domain"**
3. Nhập domain của bạn (ví dụ: `api.fin-note.com`)
4. Add CNAME record vào DNS provider:
   ```
   CNAME api.fin-note.com fin-note-api.onrender.com
   ```
5. Render tự động setup HTTPS với Let's Encrypt

---

## 🐛 Troubleshooting

### Lỗi: "Build failed"

**Nguyên nhân:** Thiếu dependencies hoặc Dockerfile sai

**Giải pháp:**
```bash
# Test build locally
docker build -t fin-note-api .
docker run -p 3000:3000 --env-file .env fin-note-api
```

### Lỗi: "Database connection failed"

**Nguyên nhân:** DATABASE_URL sai hoặc Supabase chưa sẵn sàng

**Giải pháp:**
1. Kiểm tra DATABASE_URL trong Render environment variables
2. Test connection từ local:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   ```
3. Kiểm tra Supabase project status

### Lỗi: "Prisma Client not generated"

**Nguyên nhân:** Prisma generate không chạy trong build

**Giải pháp:** Dockerfile đã có `RUN npx prisma generate` → rebuild

### Service bị "Suspended"

**Nguyên nhân:** Vượt quá 750 giờ/tháng (có nhiều services)

**Giải pháp:** Xóa các services không dùng hoặc upgrade plan

---

## 💰 Chi Phí Dự Kiến

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Free | $0/tháng |
| Supabase Database | Free | $0/tháng |
| **Total** | | **$0/tháng** |

**Giới hạn Free Tier:**

**Render:**
- 750 giờ/tháng (= 1 service 24/7)
- 512 MB RAM
- Shared CPU

**Supabase:**
- 500 MB database
- 2 GB bandwidth/tháng
- 50,000 monthly active users
- 500 MB file storage

**Nếu vượt giới hạn:**
- Render: Upgrade lên Starter ($7/tháng) để tránh auto-sleep
- Supabase: Pro plan ($25/tháng) nếu cần >500MB DB

---

## 🔐 Security Checklist

- [ ] JWT secrets được generate random (không commit vào git)
- [ ] DATABASE_URL không expose trong code
- [ ] OPENAI_API_KEY set qua environment variables
- [ ] CORS_ORIGIN chỉ cho phép domain frontend thật
- [ ] Supabase Row Level Security (RLS) enabled (optional nhưng recommended)
- [ ] HTTPS được bật tự động (Render default)
- [ ] Rate limiting (cân nhắc add middleware)

---

## 📚 Tài Liệu Tham Khảo

- [Render Documentation](https://render.com/docs)
- [Render Docker Deployment](https://render.com/docs/deploy-docker)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)

---

## 🎯 Next Steps

1. ✅ Deploy backend lên Render
2. ⬜ Setup monitoring (Sentry, LogRocket)
3. ⬜ Deploy frontend (Vercel/Netlify)
4. ⬜ Cấu hình custom domain
5. ⬜ Setup staging environment (branch `develop`)
6. ⬜ Add E2E tests vào CI/CD pipeline

---

**Last updated:** 2026-02-18
