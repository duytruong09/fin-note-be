#!/bin/bash

# FIN-NOTE Backend API Test Script
# Usage: ./test-api.sh

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

echo "🧪 FIN-NOTE Backend API Test"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Register
echo -e "${YELLOW}1. Testing Register...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@finnote.com",
    "password": "password123",
    "fullName": "Test User",
    "preferredLanguage": "vi"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null; then
  echo -e "${GREEN}✅ Register successful${NC}"
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
else
  echo -e "${RED}❌ Register failed${NC}"
fi

echo ""
echo "---"
echo ""

# 2. Login
echo -e "${YELLOW}2. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@finnote.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null; then
  echo -e "${GREEN}✅ Login successful${NC}"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
else
  echo -e "${RED}❌ Login failed${NC}"
  exit 1
fi

echo ""
echo "---"
echo ""

# 3. Get Categories
echo -e "${YELLOW}3. Testing Get Categories...${NC}"
CATEGORIES_RESPONSE=$(curl -s ${BASE_URL}/categories \
  -H "Authorization: Bearer ${TOKEN}")

echo "$CATEGORIES_RESPONSE" | jq '.meta'

CATEGORY_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq '.meta.total')
if [ "$CATEGORY_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Categories retrieved: ${CATEGORY_COUNT}${NC}"
else
  echo -e "${RED}❌ Failed to get categories${NC}"
fi

# Get food category ID
FOOD_CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data[] | select(.name == "Food") | .id')
echo "Food category ID: $FOOD_CATEGORY_ID"

echo ""
echo "---"
echo ""

# 4. Create Transaction
echo -e "${YELLOW}4. Testing Create Transaction...${NC}"
TRANSACTION_RESPONSE=$(curl -s -X POST ${BASE_URL}/transactions \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 50000,
    \"type\": \"EXPENSE\",
    \"description\": \"Test lunch expense\",
    \"categoryId\": \"${FOOD_CATEGORY_ID}\",
    \"paymentMethod\": \"CASH\"
  }")

echo "$TRANSACTION_RESPONSE" | jq '.'

if echo "$TRANSACTION_RESPONSE" | jq -e '.data.id' > /dev/null; then
  echo -e "${GREEN}✅ Transaction created${NC}"
  TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq -r '.data.id')
else
  echo -e "${RED}❌ Failed to create transaction${NC}"
fi

echo ""
echo "---"
echo ""

# 5. Get Transactions
echo -e "${YELLOW}5. Testing Get Transactions...${NC}"
TRANSACTIONS_RESPONSE=$(curl -s "${BASE_URL}/transactions?page=1&perPage=10" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$TRANSACTIONS_RESPONSE" | jq '.meta'

TRANSACTION_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | jq '.meta.total')
if [ "$TRANSACTION_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Transactions retrieved: ${TRANSACTION_COUNT}${NC}"
else
  echo -e "${RED}❌ No transactions found${NC}"
fi

echo ""
echo "---"
echo ""

# 6. Get Summary
echo -e "${YELLOW}6. Testing Transaction Summary...${NC}"
SUMMARY_RESPONSE=$(curl -s ${BASE_URL}/transactions/summary \
  -H "Authorization: Bearer ${TOKEN}")

echo "$SUMMARY_RESPONSE" | jq '.'

if echo "$SUMMARY_RESPONSE" | jq -e '.data' > /dev/null; then
  echo -e "${GREEN}✅ Summary retrieved${NC}"
else
  echo -e "${RED}❌ Failed to get summary${NC}"
fi

echo ""
echo "---"
echo ""

# 7. Test Voice Parsing (if OpenAI key configured)
echo -e "${YELLOW}7. Testing Voice Parsing (GPT)...${NC}"
VOICE_RESPONSE=$(curl -s -X POST ${BASE_URL}/voice/test-parse \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hôm nay ăn cơm 10 nghìn",
    "language": "vi"
  }')

echo "$VOICE_RESPONSE" | jq '.'

if echo "$VOICE_RESPONSE" | jq -e '.data.parsed' > /dev/null; then
  echo -e "${GREEN}✅ Voice parsing successful${NC}"

  PARSED_AMOUNT=$(echo "$VOICE_RESPONSE" | jq '.data.parsed.amount')
  PARSED_CATEGORY=$(echo "$VOICE_RESPONSE" | jq -r '.data.parsed.category')
  PARSED_CONFIDENCE=$(echo "$VOICE_RESPONSE" | jq '.data.parsed.confidence')

  echo "  Amount: ${PARSED_AMOUNT} VND"
  echo "  Category: ${PARSED_CATEGORY}"
  echo "  Confidence: ${PARSED_CONFIDENCE}"
else
  echo -e "${YELLOW}⚠️  Voice parsing not available (check OpenAI API key)${NC}"
fi

echo ""
echo "---"
echo ""

echo -e "${GREEN}🎉 API Testing Complete!${NC}"
echo ""
echo "Token for manual testing:"
echo "$TOKEN"
