# 🚀 Deployment Quick Start

Deploy FIN-NOTE API lên Render **MIỄN PHÍ** trong 15 phút!

## ✅ Checklist Nhanh

### 1️⃣ Setup Database (5 phút)

- [ ] Tạo account [Supabase](https://supabase.com) (dùng GitHub)
- [ ] Tạo project mới → chọn region **Singapore**
- [ ] Copy **Database URL** từ Settings → Database → Connection string (URI mode)
- [ ] Chạy migrations:
  ```bash
  # Thay DATABASE_URL trong .env bằng URL từ Supabase
  npx prisma migrate deploy
  ```

### 2️⃣ Setup Render (5 phút)

- [ ] Tạo account [Render](https://render.com) (dùng GitHub)
- [ ] Click **New +** → **Web Service**
- [ ] Connect repository **fin-note-be**
- [ ] Configure:
  - **Name:** fin-note-api
  - **Region:** Singapore
  - **Branch:** master
  - **Runtime:** Docker
  - **Plan:** Free

### 3️⃣ Environment Variables (3 phút)

Copy-paste vào Render environment variables:

**Required:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=[paste từ Supabase]
JWT_ACCESS_SECRET=[click "Generate Value"]
JWT_REFRESH_SECRET=[click "Generate Value"]
OPENAI_API_KEY=[lấy từ platform.openai.com]
```

**Optional nhưng recommended:**
```
GEMINI_API_KEY=[lấy từ ai.google.dev]
STT_PROVIDER=whisper
STORAGE_TYPE=local
STORAGE_PATH=/tmp/uploads
CORS_ORIGIN=http://localhost:19006
LOG_LEVEL=info
```

Xem full list trong [`docs/deployment/RENDER_SETUP.md`](./docs/deployment/RENDER_SETUP.md)

### 4️⃣ Deploy (2 phút)

- [ ] Click **"Create Web Service"**
- [ ] Đợi build & deploy (~3-5 phút)
- [ ] Test: `curl https://fin-note-api.onrender.com/health`

**Expected response:**
```json
{"status":"ok","timestamp":"..."}
```

---

## 🔧 Test Locally Trước Khi Deploy

```bash
# 1. Build Docker image
npm run docker:build

# 2. Test chạy container
npm run docker:run

# 3. Test health endpoint
curl http://localhost:3000/health
```

---

## 📱 Update Frontend URL

Sau khi deploy xong, update URL trong frontend:

```bash
# fin-note-app/.env
EXPO_PUBLIC_API_URL=https://fin-note-api.onrender.com/api/v1
```

---

## 🤖 Tránh Auto-Sleep (Optional)

Render Free tier sleep sau 15 phút. Đã có GitHub Action để ping tự động!

**Enable GitHub Actions:**

1. Vào repo Settings → Actions → General
2. Enable **"Allow all actions and reusable workflows"**
3. Workflow sẽ tự động chạy (xem file `.github/workflows/keep-alive.yml`)

**Hoặc dùng service khác:**
- [Cron-job.org](https://cron-job.org) - Free cron jobs
- [UptimeRobot](https://uptimerobot.com) - Free monitoring + ping

---

## 📚 Chi Tiết Đầy Đủ

Xem hướng dẫn chi tiết: [`docs/deployment/RENDER_SETUP.md`](./docs/deployment/RENDER_SETUP.md)

---

## 🆘 Cần Giúp?

- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs

**Lỗi thường gặp:**

| Lỗi | Giải pháp |
|-----|-----------|
| Build failed | Xem logs → thường do Dockerfile hoặc dependencies |
| Database connection failed | Kiểm tra DATABASE_URL đúng format |
| Prisma Client not generated | Rebuild service (Render tự chạy `prisma generate`) |
| Service suspended | Vượt 750h/tháng → xóa services khác |

---

**Total Cost: $0/tháng** 🎉

_Last updated: 2026-02-18_
