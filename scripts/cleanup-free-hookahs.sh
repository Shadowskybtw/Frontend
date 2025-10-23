#!/bin/bash

API_URL="https://frontend-delta-sandy-58.vercel.app/api"
ADMIN_TG_ID="937011437"

echo "🧹 ОЧИСТКА НЕПОЛУЧЕННЫХ БЕСПЛАТНЫХ КАЛЬЯНОВ ИЗ ИСТОРИИ"
echo "======================================================"
echo ""

echo "📊 Шаг 1: Диагностика пользователя 6642 ДО очистки..."
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '{
  regular: .diagnosis.history.regular,
  free: .diagnosis.history.free,
  total: .diagnosis.history.total,
  freeHookahs_table: .diagnosis.freeHookahs
}'
echo ""
echo ""

echo "🧹 Шаг 2: Запуск очистки..."
CLEANUP_RESULT=$(curl -s -X POST "${API_URL}/cleanup-unclaimed-free-hookahs" \
  -H "Content-Type: application/json" \
  -d "{\"admin_tg_id\": ${ADMIN_TG_ID}, \"confirm\": \"CLEANUP_HISTORY\"}")

echo "$CLEANUP_RESULT" | jq '.'
echo ""
echo ""

echo "📊 Шаг 3: Диагностика пользователя 6642 ПОСЛЕ очистки..."
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '{
  regular: .diagnosis.history.regular,
  free: .diagnosis.history.free,
  total: .diagnosis.history.total,
  freeHookahs_table: .diagnosis.freeHookahs,
  analysis: .diagnosis.analysis
}'
echo ""
echo ""

echo "======================================================"
echo "✅ Очистка завершена!"
echo ""
echo "Проверьте, что:"
echo "1. Количество 'free' в истории уменьшилось"
echo "2. freeHookahs_table.total осталось прежним (unused должны быть доступны)"
echo "3. progress корректен"

