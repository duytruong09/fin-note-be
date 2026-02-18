# Supabase Connection String Guide

## 🎯 Lấy Đúng Connection String

### Bước 1: Vào Supabase Dashboard

1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn: `lkjcffmkaaeqheodvjqw`
3. Click **Settings** (icon ⚙️ ở sidebar trái)
4. Click **Database** tab

### Bước 2: Chọn Connection String Đúng

Scroll xuống phần **Connection string**, bạn sẽ thấy nhiều options:

#### 🔵 **Option 1: Session Mode (RECOMMENDED cho Render)**

```
Mode: Session
Connection pooling: Enabled
```

**Copy URI:**
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**⚠️ Chú ý:**
- Port: `6543` ← Đúng!
- Hostname: `pooler.supabase.com` ← Đúng!
- Thay `[YOUR-PASSWORD]` bằng password thật của bạn

**Session mode hoạt động tốt cho:**
- ✅ Migrations (Prisma migrate deploy)
- ✅ Runtime (NestJS app)
- ✅ Long-running connections

#### 🟢 **Option 2: Transaction Mode**

```
Mode: Transaction
Connection pooling: Enabled
```

**⚠️ KHÔNG dùng cho migrations!**
- Chỉ dùng cho runtime
- Không support một số SQL commands

#### 🟡 **Option 3: Direct Connection**

```
Mode: Direct
Connection pooling: Disabled
```

**Copy URI:**
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-1-ap-southeast-1.aws.supabase.com:5432/postgres
```

**⚠️ Chú ý:**
- Port: `5432` ← Direct port
- Hostname: `aws.supabase.com` (KHÔNG có "pooler") ← Khác!

**Chỉ dùng khi:**
- Local development
- Running migrations locally
- Render không support (quá nhiều connections)

---

## ✅ Cho Render: Dùng Session Mode

**Recommended DATABASE_URL cho Render:**

```
postgresql://postgres.lkjcffmkaaeqheodvjqw:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?schema=public
```

**Format breakdown:**
```
postgresql://          ← Protocol
postgres.lkjcffmkaaeqheodvjqw    ← Username with project ref
:[YOUR-PASSWORD]       ← Replace with actual password
@aws-1-ap-southeast-1.pooler.supabase.com    ← Pooler hostname
:6543                  ← Pooler port (session mode)
/postgres              ← Database name (default)
?schema=public         ← Schema (optional but recommended)
```

---

## 🔐 Lấy Password

Nếu quên password:

1. Vào Supabase Dashboard
2. Settings → Database
3. Scroll xuống **Reset database password**
4. Click **Generate new password**
5. **Copy và lưu lại!** (Không thể xem lại sau này)

---

## 🚀 Update DATABASE_URL trên Render

### Cách 1: Qua Render Dashboard

1. Vào Render Dashboard
2. Chọn service **fin-note-api**
3. Click **Environment** tab (bên trái)
4. Tìm `DATABASE_URL`
5. Click **Edit**
6. Paste connection string mới:
   ```
   postgresql://postgres.lkjcffmkaaeqheodvjqw:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?schema=public
   ```
7. Click **Save Changes**
8. Render sẽ tự động **restart service**

### Cách 2: Qua render.yaml (cho lần deploy sau)

```yaml
# render.yaml
services:
  - type: web
    name: fin-note-api
    envVars:
      - key: DATABASE_URL
        value: postgresql://postgres.lkjcffmkaaeqheodvjqw:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?schema=public
```

**⚠️ KHÔNG commit password vào Git!**

---

## ✅ Test Connection

### Test từ local:

```bash
# Update .env với connection string mới
DATABASE_URL="postgresql://postgres.lkjcffmkaaeqheodvjqw:[password]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?schema=public"

# Test connection
npx prisma db execute --stdin <<< "SELECT version();"
```

**Kết quả mong đợi:**
```
✔ Executed script successfully
```

### Test migrations:

```bash
npx prisma migrate deploy
```

**Kết quả mong đợi:**
```
All migrations have been successfully applied.
```

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Nguyên nhân:**
- Hostname hoặc port sai
- Password sai
- Supabase project bị paused (free tier inactive >7 days)

**Giải pháp:**
1. Kiểm tra lại hostname và port
2. Reset password trên Supabase
3. Wake up project (login vào Supabase Dashboard)

### Error: "Prepared statement already exists"

**Nguyên nhân:** Dùng transaction mode cho migrations

**Giải pháp:** Đổi sang session mode (port 6543 không thêm `pgbouncer=true`)

### Error: "Too many connections"

**Nguyên nhân:** Dùng direct connection (port 5432) với nhiều instances

**Giải pháp:** Đổi sang pooler (port 6543)

---

## 📚 Tham Khảo

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [PgBouncer Transaction Mode Limitations](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer)

---

**Last updated:** 2026-02-18
