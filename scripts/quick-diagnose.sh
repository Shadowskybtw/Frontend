#!/bin/bash

API_URL="https://frontend-delta-sandy-58.vercel.app/api"
ADMIN_TG_ID="937011437"

echo "🏥 ПОЛНАЯ ДИАГНОСТИКА БАЗЫ ДАННЫХ"
echo "=================================="
echo ""

# 1. Health Check
echo "📊 Шаг 1: Проверка здоровья БД..."
echo "URL: ${API_URL}/db-health-check?admin_tg_id=${ADMIN_TG_ID}"
curl -s "${API_URL}/db-health-check?admin_tg_id=${ADMIN_TG_ID}" | jq '.'
echo ""
echo ""

# 2. Diagnose specific user
echo "🔍 Шаг 2: Детальная диагностика пользователя 6642..."
echo "URL: ${API_URL}/diagnose-user?phone=6642"
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '.'
echo ""
echo ""

# 3. Rebuild database
echo "🔨 Шаг 3: REBUILD БАЗЫ ДАННЫХ..."
echo "URL: ${API_URL}/rebuild-db"
curl -s -X POST "${API_URL}/rebuild-db" \
  -H "Content-Type: application/json" \
  -d "{\"admin_tg_id\": ${ADMIN_TG_ID}, \"confirm\": \"REBUILD_DATABASE\"}" | jq '.'
echo ""
echo ""

# 4. Check again after rebuild
echo "✅ Шаг 4: Проверка после rebuild..."
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '.'
echo ""
echo ""

echo "=================================="
echo "✅ Диагностика завершена!"

