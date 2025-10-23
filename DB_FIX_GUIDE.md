# 🏥 Руководство по диагностике и исправлению базы данных

## 🚨 Проблема

На скриншотах видны признаки повреждения данных:
- Прогресс показывает 2720% (136/5 слотов)
- API не может удалить кальяны, хотя показывает 136 записей
- После исправления показывает 100% и 5/5 слотов

## 🔍 Новые инструменты диагностики

### 1. Проверка здоровья БД

**Endpoint:** `GET /api/db-health-check?admin_tg_id=937011437`

**Что проверяет:**
- ✅ Все пользователи с акцией "5+1 кальян"
- ✅ Соответствие progress и реальной истории
- ✅ Переполнение progress (>100%)
- ✅ Записи с неправильными типами
- ✅ Пустая история при progress > 0

**Результат:**
```json
{
  "summary": {
    "totalUsers": 50,
    "usersWithIssues": 5,
    "healthyUsers": 45,
    "issueTypes": {
      "progressMismatch": 3,
      "progressOverflow": 1,
      "noRegularHookahs": 1,
      "invalidTypes": 0
    }
  },
  "issues": [
    {
      "name": "Николай Шадовский",
      "phone": "+79270036642",
      "stock": { "progress": 2720 },
      "history": { "regular": 136, "free": 0 },
      "expected": { "progress": 100 },
      "issue": "Progress mismatch: 2720% vs expected 100%"
    }
  ]
}
```

### 2. Диагностика конкретного пользователя

**Endpoint:** `GET /api/diagnose-user?phone=6642`

**Что показывает:**
- Детальную информацию о пользователе
- Разбивку истории по типам (regular/free/other)
- Ожидаемый vs фактический progress
- Последние 10 записей в истории
- Точную причину проблемы

### 3. Массовое исправление

**Endpoint:** `POST /api/fix-all-users`

**Body:**
```json
{
  "admin_tg_id": 937011437,
  "dry_run": true  // false для реального исправления
}
```

**Что делает:**
- Проверяет всех пользователей
- Вычисляет правильный progress из истории
- Исправляет несоответствия
- Сбрасывает promotion_completed если нужно

**DRY RUN (dry_run: true):**
- Только показывает что будет исправлено
- НЕ вносит изменения в БД
- Безопасно для проверки

**REAL FIX (dry_run: false):**
- Реально исправляет все проблемы
- Обновляет progress для всех пользователей
- Логирует все изменения

## 🔧 Пошаговое исправление

### Шаг 1: Проверка здоровья БД

```bash
curl https://frontend-delta-sandy-58.vercel.app/api/db-health-check?admin_tg_id=937011437
```

Это покажет сколько пользователей имеют проблемы.

### Шаг 2: Детальная диагностика проблемных пользователей

Для каждого проблемного пользователя:
```bash
curl https://frontend-delta-sandy-58.vercel.app/api/diagnose-user?phone=6642
```

### Шаг 3: Пробное исправление (DRY RUN)

```bash
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/fix-all-users \
  -H "Content-Type: application/json" \
  -d '{"admin_tg_id": 937011437, "dry_run": true}'
```

Проверьте результат - что будет исправлено.

### Шаг 4: Реальное исправление

Если результат dry run выглядит правильно:

```bash
curl -X POST https://frontend-delta-sandy-58.vercel.app/api/fix-all-users \
  -H "Content-Type: application/json" \
  -d '{"admin_tg_id": 937011437, "dry_run": false}'
```

### Шаг 5: Проверка результата

Снова запустите health check:
```bash
curl https://frontend-delta-sandy-58.vercel.app/api/db-health-check?admin_tg_id=937011437
```

Должно показать 0 проблемных пользователей.

## 🎯 Автоматическое исправление

Система теперь автоматически исправляет данные при каждой операции:

### При удалении кальяна (`/api/remove-hookah`):
1. Проверяет реальную историю
2. Вычисляет правильный progress
3. Если есть несоответствие → исправляет автоматически
4. Продолжает удаление

### При добавлении кальяна (`/api/add-hookah`):
1. Проверяет текущее состояние
2. Исправляет progress перед добавлением
3. Блокирует добавление если акция завершена (>= 100%)
4. Добавляет новый кальян

### При поиске пользователя (`/api/search-user`):
1. Показывает статистику из реальной истории
2. Добавляет флаг mismatch если есть несоответствие
3. Логирует проблемы

## 📊 Что было исправлено

### Проблема с пользователем 6642:

**До исправления:**
- Progress: 2720%
- Показывало: 136/5 слотов
- Нельзя было удалить

**Причина:**
- Кто-то продолжал добавлять кальяны после завершения акции
- Progress рос бесконечно

**После автоматического исправления:**
- Progress: 100% (макс значение)
- Показывает: 5/5 слотов
- Акция завершена
- Доступен бесплатный кальян

## 🛡️ Защита от проблем в будущем

### 1. Progress никогда не превысит 100%
```typescript
const correctProgress = Math.min(100, regularCount * 20)
```

### 2. Нельзя добавить кальян если акция завершена
```typescript
if (currentSlot >= 5 && stock.progress >= 100) {
  return error // Блокировка
}
```

### 3. Progress всегда синхронизирован
- Проверяется при КАЖДОЙ операции
- Автоматически исправляется
- История - источник истины

### 4. Детальное логирование
- Все операции логируются
- Можно отследить когда произошла проблема
- Легко диагностировать

## 🔄 Рекомендации

### Регулярная проверка здоровья БД:
Запускайте раз в неделю:
```bash
curl https://your-domain.vercel.app/api/db-health-check?admin_tg_id=XXX
```

### При обнаружении проблем:
1. Сначала DRY RUN
2. Проверить что будет исправлено
3. Только потом real fix

### Мониторинг:
- Проверяйте логи Vercel на предупреждения
- Ищите "MISMATCH" в логах
- Обращайте внимание на overflow

## 📝 API Reference

### GET /api/db-health-check
- **Params:** `admin_tg_id` (required)
- **Returns:** Summary of all issues
- **Safe:** Yes, read-only

### GET /api/diagnose-user
- **Params:** `phone` (4 digits) OR `tg_id`
- **Returns:** Detailed user diagnosis
- **Safe:** Yes, read-only

### POST /api/fix-all-users
- **Body:** `{ admin_tg_id, dry_run }`
- **Returns:** List of fixes applied
- **Safe:** Only if dry_run=true

### POST /api/fix-user-progress
- **Body:** `{ user_tg_id, admin_tg_id }`
- **Returns:** Single user fix result
- **Safe:** No, modifies data

### POST /api/remove-hookah
- **Auto-fixes:** Yes, before removal
- **Safe:** Yes, with validation

### POST /api/add-hookah
- **Auto-fixes:** Yes, before adding
- **Safe:** Yes, blocks if >= 100%

