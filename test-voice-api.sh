#!/bin/bash

# ==================================================
# FIN-NOTE VOICE API TEST SCRIPT
# ==================================================

API_URL="http://localhost:3000/api/v1"
TOKEN=""

echo "🎯 FIN-NOTE Voice API Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ==================================================
# 1. LOGIN
# ==================================================
echo -e "${YELLOW}[1] Đăng nhập...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}❌ Login failed. Response:${NC}"
  echo $LOGIN_RESPONSE | jq .
  echo ""
  echo -e "${YELLOW}💡 Bạn cần tạo user trước. Chạy:${NC}"
  echo "curl -X POST $API_URL/auth/register \\"
  echo "  -H 'Content-Type: application/json' \\"
  echo "  -d '{\"email\": \"test@example.com\", \"password\": \"password123\", \"fullName\": \"Test User\"}'"
  exit 1
fi

echo -e "${GREEN}✅ Đăng nhập thành công!${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# ==================================================
# 2. TEST PARSE (No audio needed)
# ==================================================
echo -e "${YELLOW}[2] Test Parse - Không cần audio${NC}"
echo "Input: 'Hôm nay ăn phở 50 nghìn'"
echo ""

PARSE_RESPONSE=$(curl -s -X POST "$API_URL/voice/test-parse" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hôm nay ăn phở 50 nghìn",
    "language": "vi"
  }')

echo -e "${GREEN}✅ Response:${NC}"
echo $PARSE_RESPONSE | jq .
echo ""

# Test more examples
echo -e "${YELLOW}[3] Test Parse - Ví dụ khác${NC}"

EXAMPLES=(
  "Hôm qua đi grab 45k"
  "Mua cafe 35 nghìn tiền mặt"
  "Trả tiền điện 200k"
  "Mua sách 150 nghìn"
)

for example in "${EXAMPLES[@]}"; do
  echo "Input: '$example'"
  RESPONSE=$(curl -s -X POST "$API_URL/voice/test-parse" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"transcript\": \"$example\", \"language\": \"vi\"}")

  AMOUNT=$(echo $RESPONSE | jq -r '.data.parsed.amount')
  CATEGORY=$(echo $RESPONSE | jq -r '.data.parsed.category')
  CONFIDENCE=$(echo $RESPONSE | jq -r '.data.parsed.confidence')

  echo -e "  → Amount: ${GREEN}$AMOUNT VND${NC}, Category: ${GREEN}$CATEGORY${NC}, Confidence: ${GREEN}$CONFIDENCE${NC}"
  echo ""
done

# ==================================================
# 4. PROCESS VOICE (With audio file)
# ==================================================
echo -e "${YELLOW}[4] Process Voice - Với audio file${NC}"
echo ""

# Check if audio file exists
if [ -f "test-audio.m4a" ]; then
  echo "Uploading audio file: test-audio.m4a"

  VOICE_RESPONSE=$(curl -s -X POST "$API_URL/voice/process" \
    -H "Authorization: Bearer $TOKEN" \
    -F "audio=@test-audio.m4a" \
    -F "language=vi")

  echo -e "${GREEN}✅ Response:${NC}"
  echo $VOICE_RESPONSE | jq .
  echo ""
else
  echo -e "${YELLOW}⚠️  Không tìm thấy file test-audio.m4a${NC}"
  echo "Để test với audio thật:"
  echo "  1. Ghi âm một câu như: 'Hôm nay ăn phở 50 nghìn'"
  echo "  2. Lưu thành test-audio.m4a"
  echo "  3. Chạy lại script này"
  echo ""
fi

# ==================================================
# 5. GET LOGS
# ==================================================
echo -e "${YELLOW}[5] Xem Processing Logs${NC}"
LOGS_RESPONSE=$(curl -s -X GET "$API_URL/voice/logs?page=1&perPage=5" \
  -H "Authorization: Bearer $TOKEN")

echo $LOGS_RESPONSE | jq .
echo ""

# ==================================================
# 6. GET STATISTICS
# ==================================================
echo -e "${YELLOW}[6] Xem Statistics${NC}"
STATS_RESPONSE=$(curl -s -X GET "$API_URL/voice/stats" \
  -H "Authorization: Bearer $TOKEN")

echo $STATS_RESPONSE | jq .
echo ""

# ==================================================
# SUMMARY
# ==================================================
echo "======================================"
echo -e "${GREEN}✅ Test hoàn tất!${NC}"
echo ""
echo "📝 Ghi chú:"
echo "  - Test parse hoạt động ngay (không cần OpenAI API)"
echo "  - Process voice CẦN OpenAI API key hợp lệ trong .env"
echo "  - Xem logs và stats để theo dõi độ chính xác"
echo ""
echo "🔑 OpenAI API Key:"
echo "  Nếu chưa có, lấy tại: https://platform.openai.com/api-keys"
echo "  Sau đó cập nhật trong file .env"
echo ""
