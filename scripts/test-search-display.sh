#!/bin/bash

API_URL="https://frontend-delta-sandy-58.vercel.app/api"

echo "🔍 ТЕСТ ОТОБРАЖЕНИЯ СТАТИСТИКИ В ПОИСКЕ"
echo "========================================"
echo ""

# Поиск пользователя 6642
echo "📊 Поиск пользователя 6642..."
curl -s "${API_URL}/search-user?phone=6642" | jq '{
  user: .user.first_name,
  stats: {
    currentCycle: "\(.stats.slotsFilled)/5",
    remaining: .stats.slotsRemaining,
    progress: "\(.stats.progress)%",
    totalHookahs: .stats.totalHookahs,
    completedCycles: .stats.completedCycles,
    hasFreeHookah: .stats.hasFreeHookah
  }
}'

echo ""
echo "========================================"
echo "✅ Тест завершен!"
echo ""
echo "Ожидаемый результат:"
echo "- currentCycle: 0/5 (135 % 5 = 0)"
echo "- progress: 0%"
echo "- totalHookahs: 135"
echo "- completedCycles: 27 (135 / 5 = 27)"

