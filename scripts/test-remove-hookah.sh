#!/bin/bash

# Test script for remove-hookah API
# Usage: ./scripts/test-remove-hookah.sh <user_tg_id> <admin_tg_id>

USER_TG_ID=${1:-937011437}
ADMIN_TG_ID=${2:-937011437}
API_URL="https://frontend-delta-sandy-58.vercel.app/api"

echo "🧪 Testing remove-hookah API"
echo "================================"
echo "User TG ID: $USER_TG_ID"
echo "Admin TG ID: $ADMIN_TG_ID"
echo ""

# 1. Get user state before removal
echo "📊 Step 1: Getting user state BEFORE removal..."
curl -s "${API_URL}/debug-user?tg_id=${USER_TG_ID}" | jq '{
  user: .user.first_name,
  totalHookahs: .stats.totalHookahs,
  regularHookahs: .stats.regularHookahs,
  freeHookahs: .stats.freeHookahs,
  stocks: .stocks
}'

echo ""
echo "🗑️ Step 2: Removing one regular hookah..."

# 2. Remove hookah
RESPONSE=$(curl -s -X POST "${API_URL}/remove-hookah" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_tg_id\": ${USER_TG_ID},
    \"admin_tg_id\": ${ADMIN_TG_ID},
    \"hookah_type\": \"regular\",
    \"count\": 1
  }")

echo "$RESPONSE" | jq '.'

echo ""
echo "📊 Step 3: Getting user state AFTER removal..."

# 3. Get user state after removal
sleep 2 # Wait for data to propagate
curl -s "${API_URL}/debug-user?tg_id=${USER_TG_ID}" | jq '{
  user: .user.first_name,
  totalHookahs: .stats.totalHookahs,
  regularHookahs: .stats.regularHookahs,
  freeHookahs: .stats.freeHookahs,
  stocks: .stocks
}'

echo ""
echo "✅ Test complete!"

