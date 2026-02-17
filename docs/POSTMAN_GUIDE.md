# 📮 Postman Collection - Hướng Dẫn Sử Dụng

## 📦 Files

- **`FIN NOTE.postman_collection.json`** - Collection chứa tất cả API endpoints
- **`FIN NOTE.postman_environment.json`** - Environment variables (local)

---

## 🚀 Setup

### Bước 1: Import Collection

1. Mở **Postman**
2. Click **Import** (góc trái trên)
3. Kéo thả hoặc chọn file: **`FIN NOTE.postman_collection.json`**
4. Click **Import**

### Bước 2: Import Environment

1. Click **Environments** (sidebar trái)
2. Click **Import**
3. Chọn file: **`FIN NOTE.postman_environment.json`**
4. Click **Import**

### Bước 3: Chọn Environment

1. Góc phải trên Postman, click dropdown **"No Environment"**
2. Chọn **"FIN NOTE - Local"**

---

## 🎯 Workflow Cơ Bản

### 1. **Register/Login**

**Đầu tiên, tạo tài khoản:**

```
🔐 Auth → Register
```

Hoặc nếu đã có tài khoản:

```
🔐 Auth → Login
```

**Sau khi Login thành công:**
- `access_token` sẽ tự động lưu vào Environment
- `refresh_token` sẽ tự động lưu vào Environment
- `user_id` sẽ tự động lưu

✨ **Magic!** Tất cả requests tiếp theo sẽ tự động dùng token này.

---

### 2. **Test Health Check**

```
🏥 Health Check → Health Check
```

Kiểm tra server đang chạy và database kết nối OK.

---

### 3. **Xem Categories**

```
📁 Categories → Get System Categories
```

Lấy danh sách categories mặc định của hệ thống.

---

### 4. **Tạo Transaction**

```
💰 Transactions → Create Transaction
```

**Body mẫu:**
```json
{
  "amount": 50000,
  "type": "EXPENSE",
  "categoryId": "copy-id-from-categories-response",
  "description": "Ăn phở",
  "transactionDate": "2026-02-16",
  "paymentMethod": "CASH"
}
```

---

### 5. **Test Voice API**

#### Option 1: Test Parse (Không cần audio - Nhanh)

```
🎤 Voice → Test Parse
```

**Body:**
```json
{
  "transcript": "Hôm nay ăn phở 50 nghìn",
  "language": "vi"
}
```

**Response:**
```json
{
  "data": {
    "transcript": "Hôm nay ăn phở 50 nghìn",
    "parsed": {
      "amount": 50000,
      "currency": "VND",
      "category": "Food & Dining",
      "description": "Ăn phở",
      "date": "2026-02-16",
      "confidence": 0.95
    }
  }
}
```

#### Option 2: Process Voice (Upload audio file)

```
🎤 Voice → Process Voice
```

**Body (form-data):**
- `audio`: Chọn file audio (m4a, wav, mp3)
- `language`: `vi` hoặc `en`

---

## 🔑 Authentication

### Auto-Save Token

Collection đã cài sẵn **Test Scripts** để tự động lưu token:

**Register/Login requests có script:**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set('access_token', response.data.accessToken);
    pm.environment.set('refresh_token', response.data.refreshToken);
    pm.environment.set('user_id', response.data.user.id);
}
```

### Manual Token

Nếu cần set token thủ công:

1. Click **Environments** → **FIN NOTE - Local**
2. Paste token vào field **`access_token`**
3. Save

---

## 📋 Collection Variables

Collection sử dụng các biến sau:

| Variable | Mô tả | Ví dụ |
|----------|-------|-------|
| `{{base_url}}` | API base URL | `http://localhost:3000/api/v1` |
| `{{access_token}}` | JWT access token | Auto-saved after login |
| `{{refresh_token}}` | JWT refresh token | Auto-saved after login |
| `{{user_id}}` | User ID | Auto-saved after login |

---

## 📝 API Groups

### 🏥 Health Check (3 endpoints)

✅ **GET** `/health` - Health check tổng quan
- Không cần auth
- Trả về: status, uptime, database status

✅ **GET** `/health/ready` - Readiness probe
- Kiểm tra app sẵn sàng serve traffic
- Dùng cho Kubernetes

✅ **GET** `/health/live` - Liveness probe
- Kiểm tra app còn sống
- Dùng cho Kubernetes

---

### 🔐 Auth (3 endpoints)

✅ **POST** `/auth/register` - Đăng ký
```json
{
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User"
}
```

✅ **POST** `/auth/login` - Đăng nhập
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

✅ **POST** `/auth/refresh` - Refresh token
```json
{
  "refreshToken": "{{refresh_token}}"
}
```

---

### 📁 Categories (6 endpoints)

✅ **GET** `/categories` - Tất cả categories (user + system)

✅ **GET** `/categories/system` - System categories

✅ **POST** `/categories` - Tạo mới
```json
{
  "name": "Custom Category",
  "nameVi": "Danh mục tùy chỉnh",
  "nameEn": "Custom Category",
  "icon": "🎯",
  "color": "#FF6B6B",
  "type": "EXPENSE"
}
```

✅ **GET** `/categories/:id` - Chi tiết

✅ **PATCH** `/categories/:id` - Cập nhật

✅ **DELETE** `/categories/:id` - Xóa

---

### 💰 Transactions (6 endpoints)

✅ **POST** `/transactions` - Tạo giao dịch
```json
{
  "amount": 50000,
  "type": "EXPENSE",
  "categoryId": "uuid",
  "description": "Ăn phở",
  "transactionDate": "2026-02-16",
  "paymentMethod": "CASH"
}
```

✅ **GET** `/transactions` - Danh sách với filters
Query params:
- `page` (default: 1)
- `perPage` (default: 20)
- `type` (EXPENSE | INCOME)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `categoryId` (optional)

✅ **GET** `/transactions/summary` - Tổng thu/chi
Query params:
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)

Response:
```json
{
  "data": {
    "totalIncome": 5000000,
    "totalExpense": 3000000,
    "balance": 2000000,
    "transactionCount": 150
  }
}
```

✅ **GET** `/transactions/:id` - Chi tiết

✅ **PATCH** `/transactions/:id` - Cập nhật

✅ **DELETE** `/transactions/:id` - Xóa (soft delete)

---

### 🎤 Voice (5 endpoints)

✅ **POST** `/voice/process` - Xử lý giọng nói
- Body: form-data
- `audio`: file (m4a, wav, mp3)
- `language`: "vi" | "en"

Response:
```json
{
  "data": {
    "logId": "uuid",
    "transcript": "Hôm nay ăn phở 50 nghìn",
    "parsed": {
      "amount": 50000,
      "category": "Food & Dining",
      "description": "Ăn phở",
      "confidence": 0.95
    },
    "audioUrl": "/uploads/voice/uuid.m4a",
    "processingTimeMs": 1234,
    "status": "SUCCESS"
  }
}
```

✅ **POST** `/voice/test-parse` - Test parse (không cần audio)
```json
{
  "transcript": "Hôm nay ăn phở 50 nghìn",
  "language": "vi"
}
```

✅ **GET** `/voice/logs` - Lịch sử xử lý
Query params:
- `page` (default: 1)
- `perPage` (default: 20)

✅ **GET** `/voice/stats` - Thống kê
```json
{
  "data": {
    "totalProcessed": 150,
    "successCount": 142,
    "failedCount": 8,
    "successRate": 94.67,
    "avgConfidence": 0.89,
    "avgProcessingTimeMs": 1850
  }
}
```

---

## 🎨 Tips & Tricks

### 1. **Folders (Collections)**

Collection được tổ chức theo folders:
- 🏥 Health Check
- 🔐 Auth
- 📁 Categories
- 💰 Transactions
- 🎤 Voice

### 2. **Quick Test Workflow**

1. **Register** → Auto-save token
2. **Get System Categories** → Copy một `categoryId`
3. **Create Transaction** → Paste `categoryId`
4. **Get All Transactions** → Xem transaction vừa tạo
5. **Test Voice Parse** → Test AI parsing

### 3. **Variables trong Requests**

Tất cả requests dùng variables:
- `{{base_url}}` - Dễ đổi từ localhost → production
- `{{access_token}}` - Auto authentication
- Path params như `:id` có thể điền trực tiếp

### 4. **Copy Response Values**

Trong Postman, click vào response value → **Copy**
- Ví dụ: Copy `categoryId` từ Categories response → Paste vào Create Transaction

### 5. **Environment Switching**

Tạo thêm environments cho:
- **FIN NOTE - Local** (http://localhost:3000)
- **FIN NOTE - Staging** (https://staging.finnote.com)
- **FIN NOTE - Production** (https://api.finnote.com)

Chỉ cần đổi `base_url` trong mỗi environment!

---

## 🐛 Troubleshooting

### ❌ 401 Unauthorized

**Nguyên nhân:** Token hết hạn hoặc chưa đăng nhập

**Giải pháp:**
1. Chạy lại **Auth → Login**
2. Token sẽ tự động refresh

---

### ❌ 404 Not Found

**Nguyên nhân:**
- Server chưa chạy
- URL sai

**Giải pháp:**
1. Kiểm tra server: `http://localhost:3000/api/v1/health`
2. Kiểm tra environment `base_url`

---

### ❌ 500 Internal Server Error

**Nguyên nhân:** Lỗi server

**Giải pháp:**
1. Xem console server để debug
2. Kiểm tra database connection
3. Kiểm tra OpenAI API key (cho Voice endpoints)

---

### ❌ Voice API không hoạt động

**Nguyên nhân:** Chưa cấu hình OpenAI API key

**Giải pháp:**
```bash
# File: .env
OPENAI_API_KEY=sk-proj-your-real-key-here
```

Restart server sau khi thêm key.

---

## 📚 Resources

- **API Documentation:** `VOICE_API_GUIDE.md`
- **Project Conventions:** `.claude/CLAUDE.md`
- **Prisma Schema:** `prisma/schema.prisma`

---

## 🎯 Quick Start Checklist

- [ ] Import Collection
- [ ] Import Environment
- [ ] Chọn Environment: "FIN NOTE - Local"
- [ ] Chạy Health Check
- [ ] Register/Login
- [ ] Test một vài endpoints
- [ ] Test Voice API
- [ ] Done! 🎉

---

**Last Updated:** 2026-02-16
