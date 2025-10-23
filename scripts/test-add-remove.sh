#!/bin/bash

API_URL="https://frontend-delta-sandy-58.vercel.app/api"
ADMIN_TG_ID="937011437"
USER_TG_ID="937011437"

echo "🧪 ТЕСТИРОВАНИЕ ДОБАВЛЕНИЯ/УДАЛЕНИЯ КАЛЬЯНОВ"
echo "============================================="
echo ""

# 1. Текущее состояние
echo "📊 Шаг 1: Текущее состояние пользователя 6642"
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '.diagnosis | {progress: .stock.progress, regular: .history.regular, free: .history.free}'
echo ""
echo ""

# 2. Попытка добавить кальян (должна вернуть ошибку, т.к. progress = 100%)
echo "➕ Шаг 2: Попытка добавить кальян (должна вернуть ошибку - акция завершена)"
ADD_RESULT=$(curl -s -X POST "${API_URL}/add-hookah" \
  -H "Content-Type: application/json" \
  -d "{\"user_tg_id\": ${USER_TG_ID}, \"admin_tg_id\": ${ADMIN_TG_ID}}")
echo "$ADD_RESULT" | jq '{success, message, debug}'
echo ""
echo ""

# 3. Удаляем 1 кальян
echo "➖ Шаг 3: Удаляем 1 платный кальян"
REMOVE_RESULT=$(curl -s -X POST "${API_URL}/remove-hookah" \
  -H "Content-Type: application/json" \
  -d "{\"user_tg_id\": ${USER_TG_ID}, \"admin_tg_id\": ${ADMIN_TG_ID}, \"hookah_type\": \"regular\", \"count\": 1}")
echo "$REMOVE_RESULT" | jq '{success, message, newProgress}'
echo ""
echo ""

# 4. Проверяем состояние после удаления
echo "📊 Шаг 4: Состояние после удаления"
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '.diagnosis | {progress: .stock.progress, regular: .history.regular, free: .history.free}'
echo ""
echo ""

# 5. Теперь добавляем кальян (должно работать, т.к. progress = 80%)
echo "➕ Шаг 5: Добавляем кальян обратно (должно работать)"
ADD_RESULT=$(curl -s -X POST "${API_URL}/add-hookah" \
  -H "Content-Type: application/json" \
  -d "{\"user_tg_id\": ${USER_TG_ID}, \"admin_tg_id\": ${ADMIN_TG_ID}}")
echo "$ADD_RESULT" | jq '{success, message, newProgress}'
echo ""
echo ""

# 6. Финальное состояние
echo "📊 Шаг 6: Финальное состояние"
curl -s "${API_URL}/diagnose-user?phone=6642" | jq '.diagnosis | {progress: .stock.progress, regular: .history.regular, free: .history.free}'
echo ""
echo ""

echo "============================================="
echo "✅ Тестирование завершено!"

