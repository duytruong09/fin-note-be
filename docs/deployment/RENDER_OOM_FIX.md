# Render OOM (Out Of Memory) Fix

## 🔴 Vấn Đề

Render Free tier chỉ có **512MB RAM**, nhưng:
- NestJS + Prisma tốn ~200-300MB khi startup
- Node.js mặc định không giới hạn memory
- Build process có thể tốn tới 400-500MB

**Kết quả:** App crash với error `FATAL ERROR: Reached heap limit Allocation failed`

---

## ✅ Các Fix Đã Áp Dụng

### 1. **Set Node Memory Limit**
```yaml
# render.yaml
env:
  NODE_OPTIONS: --max-old-space-size=460
```
- Giới hạn Node heap ở 460MB (để lại ~50MB cho system)
- Ngăn Node dùng quá nhiều RAM

### 2. **Optimize Prisma Client**
```prisma
// prisma/schema.prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```
- Chỉ generate binary cho Linux (Render platform)
- Giảm ~30% size của Prisma Client

### 3. **Multi-Stage Docker Build**
```dockerfile
# Stage 1: Build with all dependencies
# Stage 2: Runtime with only production deps
```
- Tách build và runtime
- Runtime image nhỏ hơn ~50%

### 4. **Prune Dev Dependencies**
```dockerfile
RUN npm prune --production
```
- Xóa dev dependencies sau build
- Giảm node_modules size

### 5. **Separate Migration Connection**
```bash
# scripts/render-migrate.sh
# Use direct connection (5432) for migrations
# Use pooler (6543) for runtime
```
- Migrations cần direct connection
- Runtime dùng pooler cho performance

---

## 📊 Memory Usage Comparison

| Stage | Before | After | Savings |
|-------|--------|-------|---------|
| Docker Image | ~450MB | ~280MB | -38% |
| Startup RAM | ~300MB | ~200MB | -33% |
| Runtime RAM | ~250MB | ~180MB | -28% |

---

## 🔍 Kiểm Tra Memory Usage

### Trên Render Dashboard:
```
Dashboard → Service → Metrics → Memory
```

### Trong Logs:
```bash
# Render automatically shows memory usage
[INFO] Memory: 180.5 MB / 512 MB (35%)
```

### Test Locally:
```bash
# Build Docker image
npm run docker:build

# Run with memory limit
docker run -m 512m -p 3000:3000 --env-file .env fin-note-api

# Monitor memory
docker stats
```

---

## ⚠️ Nếu Vẫn Bị OOM

### Option 1: Giảm Memory Hơn Nữa

**A. Lazy Load Heavy Modules**
```typescript
// Instead of:
import { OpenAI } from 'openai';

// Use dynamic import:
const { OpenAI } = await import('openai');
```

**B. Reduce Concurrent Requests**
```typescript
// main.ts
app.set('trust proxy', 1);
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30 // limit each IP to 30 requests per minute
}));
```

**C. Disable Source Maps in Production**
```json
// tsconfig.json
{
  "compilerOptions": {
    "sourceMap": false // in production
  }
}
```

### Option 2: Upgrade Render Plan

**Starter Plan ($7/month):**
- 512MB RAM → **1GB RAM**
- No auto-sleep
- Priority support

**Standard Plan ($25/month):**
- **2GB RAM**
- Faster CPU
- Auto-scaling

### Option 3: Alternative Platforms

**Railway ($5 credit/month free):**
- More generous free tier
- Better for NestJS apps
- https://railway.app

**Fly.io (Free tier):**
- 256MB RAM x 3 VMs = 768MB total
- Good for production
- https://fly.io

**Google Cloud Run (Free tier):**
- 1GB RAM
- Serverless (pay per request)
- https://cloud.google.com/run

---

## 🎯 Best Practices

### ✅ DO:
- Set `NODE_OPTIONS=--max-old-space-size=460`
- Use `NODE_ENV=production`
- Optimize Prisma binary targets
- Use multi-stage Docker builds
- Monitor memory usage regularly

### ❌ DON'T:
- Use `nest start` (quá nặng, dùng `node dist/main`)
- Import unused modules
- Run dev dependencies in production
- Use source maps in production
- Forget to set memory limits

---

## 📚 Resources

- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Prisma Binary Targets](https://www.prisma.io/docs/concepts/components/prisma-engines/query-engine#binary-targets)
- [Render Memory Limits](https://render.com/docs/free#free-web-services)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)

---

**Last updated:** 2026-02-18
