# 🎤 Voice API - Hướng Dẫn Sử Dụng

## Tổng Quan

Voice API cho phép người dùng:
1. **Ghi âm** giọng nói nói về chi tiêu (VD: "Hôm nay ăn phở 50 nghìn")
2. **Chuyển giọng nói thành text** bằng OpenAI Whisper
3. **Parse thông tin** từ text thành dữ liệu cấu trúc bằng GPT-4
4. **Lưu transaction** vào database

---

## Luồng Xử Lý

```
┌─────────────┐
│ User speaks │ "Hôm nay ăn phở 50 nghìn"
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ 1. Upload Audio │ POST /voice/process
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│ 2. Whisper API   │ Speech → Text
│ (Transcription)  │ → "Hôm nay ăn phở 50 nghìn"
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. GPT-4 Parsing │ Text → Structured Data
│ (Understanding)  │ → {amount: 50000, category: "Food & Dining", ...}
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. Return Data   │ Show to user for review
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. User Confirms │ Can edit before saving
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. Save to DB    │ POST /transactions (with isVoiceCreated=true)
└──────────────────┘
```

---

## API Endpoints

### 1. Process Voice (Xử Lý Giọng Nói)

**Endpoint:** `POST /api/v1/voice/process`

**Authentication:** Required (Bearer Token)

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/voice/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@audio.m4a" \
  -F "language=vi"
```

**Parameters:**
- `audio` (file, required): Audio file (m4a, wav, mp3)
- `language` (string, optional): "vi" hoặc "en" (default: user's preferred language)

**Response:**
```json
{
  "data": {
    "logId": "550e8400-e29b-41d4-a716-446655440000",
    "transcript": "Hôm nay ăn phở 50 nghìn",
    "parsed": {
      "amount": 50000,
      "currency": "VND",
      "category": "Food & Dining",
      "description": "Ăn phở",
      "date": "2026-02-16",
      "paymentMethod": "CASH",
      "confidence": 0.95
    },
    "audioUrl": "/uploads/voice/550e8400-e29b-41d4-a716-446655440000.m4a",
    "processingTimeMs": 1234,
    "status": "SUCCESS"
  }
}
```

**Status Values:**
- `SUCCESS`: Xử lý thành công, confidence cao
- `PARTIAL_SUCCESS`: Thành công nhưng confidence thấp (<0.5)
- `FAILED_WHISPER`: Lỗi khi transcribe
- `FAILED_PARSING`: Lỗi khi parse
- `FAILED_UNKNOWN`: Lỗi không xác định

---

### 2. Test Parse (Test Không Cần Audio)

**Endpoint:** `POST /api/v1/voice/test-parse`

**Authentication:** Required

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/voice/test-parse \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hôm nay mua cafe 35 nghìn",
    "language": "vi"
  }'
```

**Response:**
```json
{
  "data": {
    "transcript": "Hôm nay mua cafe 35 nghìn",
    "parsed": {
      "amount": 35000,
      "currency": "VND",
      "category": "Food & Dining",
      "description": "Mua cafe",
      "date": "2026-02-16",
      "confidence": 0.92
    }
  }
}
```

**Sử dụng khi:**
- Test prompt mới
- Debug parsing logic
- Không cần upload audio
- Nhanh hơn (không gọi Whisper API)

---

### 3. Get Processing Logs

**Endpoint:** `GET /api/v1/voice/logs?page=1&perPage=20`

**Authentication:** Required

**Response:**
```json
{
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "audioUrl": "/uploads/voice/...",
      "whisperTranscript": "Hôm nay ăn phở 50 nghìn",
      "gptParsedData": {...},
      "status": "SUCCESS",
      "processingTimeMs": 1234,
      "createdAt": "2026-02-16T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Sử dụng để:**
- Debug failed parses
- Phân tích độ chính xác
- Cải thiện prompts
- Tracking costs (OpenAI API usage)

---

### 4. Get Statistics

**Endpoint:** `GET /api/v1/voice/stats`

**Authentication:** Required

**Response:**
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

## Cấu Hình

### 1. OpenAI API Key

**Bắt buộc** để sử dụng Voice API.

```bash
# File: .env
OPENAI_API_KEY=sk-proj-your-real-api-key-here
OPENAI_MODEL_WHISPER=whisper-1
OPENAI_MODEL_GPT=gpt-4o-mini-2024-07-18
```

**Lấy API key:**
1. Đăng ký tại: https://platform.openai.com
2. Vào API Keys: https://platform.openai.com/api-keys
3. Tạo key mới và copy vào `.env`

### 2. Storage

```bash
# File: .env
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Hoặc dùng S3 (optional)
# STORAGE_TYPE=s3
# S3_BUCKET=fin-note-audio
# S3_REGION=us-east-1
```

### 3. Limits

```bash
# File: .env
MAX_AUDIO_FILE_SIZE_MB=10
MAX_AUDIO_DURATION_SEC=60
```

---

## Prompts

Prompts được lưu trong `.prompt/`:

- **expense-parser-vi.txt**: Prompt tiếng Việt
- **expense-parser-en.txt**: Prompt tiếng Anh

### Cải Thiện Prompts

1. **Thu thập failed parses:**
   ```bash
   GET /api/v1/voice/logs?page=1&perPage=100
   # Filter logs với status != SUCCESS
   ```

2. **Phân tích patterns:**
   - Những từ nào AI không hiểu?
   - Category mapping có đúng không?
   - Date parsing chính xác không?

3. **Cập nhật prompt:**
   - Thêm ví dụ mới vào phần EXAMPLES
   - Thêm rules cho edge cases
   - Update category mappings

4. **A/B Testing:**
   - Tạo prompt mới: `expense-parser-vi-v2.txt`
   - Test với `test-parse` endpoint
   - So sánh confidence scores

---

## Categories Mapping

| Vietnamese | English Category |
|------------|------------------|
| ăn, cơm, phở, cafe | Food & Dining |
| xe, grab, taxi, xăng | Transportation |
| điện, nước, mạng | Bills & Utilities |
| quần áo, giày | Shopping |
| thuê nhà | Housing |
| thuốc, bệnh viện | Healthcare |
| xem phim, game | Entertainment |
| sách, học phí | Education |

---

## Error Handling

### Client-side (Frontend)

```typescript
try {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('language', 'vi');

  const response = await fetch('/api/v1/voice/process', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const result = await response.json();

  if (result.data.status === 'PARTIAL_SUCCESS') {
    // Hiển thị warning cho user
    alert(`Confidence thấp (${result.data.parsed.confidence}). Vui lòng kiểm tra lại.`);
  }

  // Hiển thị parsed data để user review
  showReviewScreen(result.data.parsed);

} catch (error) {
  // Handle errors
  if (error.message.includes('OpenAI API')) {
    alert('Lỗi OpenAI API. Vui lòng thử lại.');
  }
}
```

### Server-side Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| 400 | Bad Request | Check audio file format, size |
| 401 | Unauthorized | Token expired, login again |
| 500 | Server Error | Check OpenAI API key, prompts exist |

---

## Testing

### Quick Test (Không cần audio)

```bash
./test-voice-api.sh
```

### Manual Test với cURL

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

# 3. Process real audio
curl -X POST http://localhost:3000/api/v1/voice/process \
  -H "Authorization: Bearer $TOKEN" \
  -F "audio=@test-audio.m4a" \
  -F "language=vi" \
  | jq .
```

---

## Cost Optimization

### OpenAI Pricing (2024)

- **Whisper:** ~$0.006 per minute
- **GPT-4o-mini:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens

### Optimization Strategies

1. **Giới hạn độ dài audio:**
   ```typescript
   MAX_AUDIO_DURATION_SEC=15  // 15 giây đủ cho 1 câu
   ```

2. **Sử dụng model nhỏ:**
   ```typescript
   OPENAI_MODEL_GPT=gpt-4o-mini  // Rẻ hơn gpt-4
   ```

3. **Cache kết quả:**
   - Lưu parsed results trong DB
   - Nếu transcript giống nhau → trả về cache

4. **Batch processing:**
   - Xử lý nhiều audio cùng lúc
   - Giảm overhead API calls

5. **Free tier limits:**
   - Giới hạn X requests/user/day
   - Upgrade to premium for unlimited

---

## Monitoring & Analytics

### Metrics to Track

1. **Success Rate:**
   ```sql
   SELECT
     COUNT(*) as total,
     SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
     ROUND(100.0 * SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
   FROM voice_processing_logs
   WHERE user_id = 'xxx';
   ```

2. **Average Confidence:**
   ```sql
   SELECT AVG(gpt_confidence) as avg_confidence
   FROM voice_processing_logs
   WHERE status = 'SUCCESS';
   ```

3. **Processing Time:**
   ```sql
   SELECT
     AVG(processing_time_ms) as avg_time,
     MAX(processing_time_ms) as max_time
   FROM voice_processing_logs;
   ```

4. **Most Common Categories:**
   ```sql
   SELECT
     gpt_parsed_data->>'category' as category,
     COUNT(*) as count
   FROM voice_processing_logs
   WHERE status = 'SUCCESS'
   GROUP BY category
   ORDER BY count DESC
   LIMIT 10;
   ```

---

## Troubleshooting

### Problem: "OpenAI API is not configured"

**Solution:**
```bash
# Kiểm tra .env
grep OPENAI_API_KEY .env

# Thêm key hợp lệ
OPENAI_API_KEY=sk-proj-...
```

### Problem: "Prompt file not found"

**Solution:**
```bash
# Kiểm tra prompts tồn tại
ls -la .prompt/

# Phải có:
# - expense-parser-vi.txt
# - expense-parser-en.txt
```

### Problem: Low confidence scores

**Solution:**
1. Cải thiện prompts với more examples
2. User nói rõ ràng hơn
3. Check audio quality
4. Add more category mappings

### Problem: Wrong category detection

**Solution:**
1. Update category mappings trong prompt
2. Add more examples cho category đó
3. Check if category exists trong system

---

## Next Steps

1. ✅ Cấu hình OpenAI API key
2. ✅ Test với `./test-voice-api.sh`
3. ✅ Tạo user account
4. ✅ Upload audio và test
5. ✅ Monitor logs và statistics
6. ✅ Cải thiện prompts dựa trên failed parses
7. ✅ Integrate với frontend (React Native)

---

## Resources

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT-4 API](https://platform.openai.com/docs/guides/gpt)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Last Updated:** 2026-02-16
