# 🆓 Hướng Dẫn Sử Dụng Google Gemini MIỄN PHÍ

## ✨ Tại Sao Chọn Gemini?

✅ **Hoàn toàn MIỄN PHÍ** - Không cần thẻ tín dụng
✅ **Rất hào phóng** - 15 requests/phút, 1500/ngày
✅ **Chất lượng cao** - Tương đương GPT-4
✅ **Dễ setup** - 2 phút là xong
✅ **Đủ cho cá nhân** - Perfect cho 1 người dùng

---

## 🚀 Setup Trong 3 Bước

### **Bước 1: Lấy API Key Miễn Phí**

1. Truy cập: **https://aistudio.google.com/app/apikey**
2. Đăng nhập Google (nếu chưa)
3. Click **"Get API Key"** hoặc **"Create API Key"**
4. Copy key (dạng: `AIzaSy...`)

**Lưu ý:**
- Không cần thẻ tín dụng
- Không hết hạn
- Miễn phí mãi mãi

---

### **Bước 2: Cập Nhật File `.env`**

```bash
# Mở file .env và thêm API key:
GEMINI_API_KEY=AIzaSy...your-key-here

# Chọn AI provider (chọn gemini)
AI_PROVIDER=gemini
```

**Full .env configuration:**
```env
# Google Gemini API (FREE Alternative)
GEMINI_API_KEY=AIzaSyYourKeyHere
AI_PROVIDER=gemini  # 'openai' or 'gemini'

# Optional: OpenAI (nếu muốn dùng sau)
OPENAI_API_KEY=sk-proj-...
```

---

### **Bước 3: Restart Server**

```bash
# Stop server (Ctrl+C nếu đang chạy)

# Start lại
npm run start:dev
```

**Check logs:**
```
[NestApplication] Nest application successfully started
[VoiceService] Using AI provider: gemini  ← Phải thấy dòng này!
```

---

## ✅ Test Ngay

### **Test với Postman:**

```
POST /api/v1/voice/test-parse
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

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
      "confidence": 0.92
    },
    "aiProvider": "gemini"  ← Xác nhận đang dùng Gemini
  }
}
```

---

### **Test với cURL:**

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 2. Test parse
curl -X POST http://localhost:3000/api/v1/voice/test-parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Hôm nay ăn phở 50 nghìn","language":"vi"}' \
  | jq .
```

---

## 📊 So Sánh: OpenAI vs Gemini

| Feature | OpenAI | Gemini ⭐ |
|---------|--------|----------|
| **Giá** | $0.15-0.60 per 1M tokens | **MIỄN PHÍ** |
| **Setup** | Cần thẻ tín dụng | Không cần |
| **Limits** | Tính tiền theo usage | 1,500 requests/ngày |
| **Chất lượng** | GPT-4o-mini | Gemini 1.5 Flash (tương đương) |
| **Tốc độ** | Nhanh | **Rất nhanh** |
| **Phù hợp** | Production scale | **Cá nhân, prototype** |

**Kết luận:** Gemini hoàn hảo cho sử dụng cá nhân! 🎉

---

## 🔄 Chuyển Đổi Giữa OpenAI và Gemini

### **Dùng Gemini (Miễn Phí):**

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...
```

### **Dùng OpenAI (Trả Phí):**

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
```

**Không cần sửa code!** Chỉ cần:
1. Đổi `AI_PROVIDER` trong `.env`
2. Restart server
3. Done!

---

## 📈 Limits & Usage

### **Free Tier Limits:**

- ✅ **15 requests/phút**
- ✅ **1,500 requests/ngày**
- ✅ **Không giới hạn tokens** per request

### **Đủ Cho Bao Nhiêu?**

**Tính toán thực tế:**
- 1,500 requests/ngày
- Trung bình 30 transactions/ngày
- = **50 ngày sử dụng miễn phí**

**Kết luận:** Quá đủ cho 1 người dùng! 🎯

---

## ⚡ Tính Năng Của Code

Hệ thống đã được config để:

1. **Auto-detect AI Provider:**
   ```typescript
   // Voice Service tự động chọn AI dựa vào .env
   if (this.aiProvider === 'openai') {
     parsedData = await this.gptParserService.parseExpense(...);
   } else {
     parsedData = await this.geminiParserService.parseExpense(...);
   }
   ```

2. **Shared Prompts:**
   - Cả OpenAI và Gemini dùng chung prompts trong `.prompt/`
   - Không cần sửa prompt khi đổi AI

3. **Transparent to Frontend:**
   - Frontend không cần biết đang dùng AI nào
   - API response format giống hệt nhau

---

## 🐛 Troubleshooting

### ❌ Lỗi: "Gemini API not configured"

**Giải pháp:**
```bash
# Kiểm tra .env
cat .env | grep GEMINI

# Phải thấy:
GEMINI_API_KEY=AIzaSy...  (không phải "your-gemini-api-key-here")
AI_PROVIDER=gemini
```

---

### ❌ Lỗi: "Invalid API key"

**Nguyên nhân:** API key sai hoặc hết hạn (hiếm)

**Giải pháp:**
1. Tạo key mới tại: https://aistudio.google.com/app/apikey
2. Copy key mới vào `.env`
3. Restart server

---

### ❌ Lỗi: "Rate limit exceeded"

**Nguyên nhân:** Vượt quá 15 requests/phút

**Giải pháp:**
- Đợi 1 phút
- Hoặc dùng ít hơn (bình thường không xảy ra)

---

### ⚠️ Gemini trả về JSON không hợp lệ

**Giải pháp:**
- Gemini có thể trả về text thừa ngoài JSON
- Code đã handle: extract JSON từ response
- Nếu vẫn lỗi: log ra check response

---

## 📝 Ví Dụ Thực Tế

### **Test Nhiều Câu:**

```bash
# Test case 1
curl -X POST http://localhost:3000/api/v1/voice/test-parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Hôm nay ăn phở 50 nghìn","language":"vi"}'

# Test case 2
curl -X POST http://localhost:3000/api/v1/voice/test-parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Hôm qua đi grab 45k bằng thẻ","language":"vi"}'

# Test case 3
curl -X POST http://localhost:3000/api/v1/voice/test-parse \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Trả tiền điện 200k","language":"vi"}'
```

---

## 🎯 Checklist

- [ ] Lấy Gemini API key từ https://aistudio.google.com/app/apikey
- [ ] Copy key vào `.env` → `GEMINI_API_KEY=...`
- [ ] Set `AI_PROVIDER=gemini`
- [ ] Restart server: `npm run start:dev`
- [ ] Check logs: "Using AI provider: gemini"
- [ ] Test với Postman/cURL
- [ ] Thấy `"aiProvider": "gemini"` trong response
- [ ] Done! 🎉

---

## 💡 Tips

### **Monitoring Usage:**

Google AI Studio có dashboard để xem:
- Số requests đã dùng
- Rate limit còn lại
- Error logs

**Truy cập:** https://aistudio.google.com/app/apikey

### **Multiple API Keys:**

Nếu muốn dùng nhiều:
```env
# Primary key
GEMINI_API_KEY=AIzaSy...key1

# Fallback key (optional)
# GEMINI_API_KEY_BACKUP=AIzaSy...key2
```

---

## 🚀 Production Tips

Khi scale lên nhiều users:

1. **Nâng cấp lên Paid Tier** (nếu cần):
   - Gemini Pro có limits cao hơn
   - Vẫn rẻ hơn OpenAI rất nhiều

2. **Hoặc dùng kết hợp:**
   - Free users: Gemini
   - Premium users: OpenAI
   - Code đã support cả 2!

---

## 📚 Resources

- **Gemini API Docs:** https://ai.google.dev/tutorials/get_started
- **Pricing:** https://ai.google.dev/pricing (Free tier info)
- **Limits:** https://ai.google.dev/gemini-api/docs/quota
- **Examples:** https://ai.google.dev/examples

---

## 🎊 Kết Luận

**Gemini = Perfect cho cá nhân:**
- ✅ Miễn phí
- ✅ Không cần thẻ tín dụng
- ✅ Chất lượng cao
- ✅ Dễ setup
- ✅ Đủ dùng cho 1 người

**Bắt đầu ngay!** Chỉ cần 2 phút setup. 🚀

---

**Last Updated:** 2026-02-16
