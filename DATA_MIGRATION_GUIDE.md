# 📊 Руководство по миграции данных пользователей

Это руководство поможет вам управлять данными пользователей в вашем Telegram WebApp.

## 🎯 Текущее состояние

В вашей базе данных уже есть:
- **9 пользователей** (зарегистрированы через webapp)
- **70 акций** с различным прогрессом
- **19 кальянов** (все использованы)

## 📁 Доступные скрипты

### 1. `check-users.js` - Управление пользователями
```bash
# Показать статистику
node scripts/check-users.js stats

# Показать список пользователей
node scripts/check-users.js list 20

# Найти пользователя по TG ID
node scripts/check-users.js find 123456789

# Экспорт в CSV
node scripts/check-users.js export
```

### 2. `export-all-data.js` - Полный экспорт данных
```bash
# Экспорт всех данных
node scripts/export-all-data.js all

# Экспорт конкретного пользователя
node scripts/export-all-data.js user 123456789
```

### 3. `import-data.js` - Импорт данных
```bash
# Импорт всех данных
node scripts/import-data.js import full-export-2025-10-05.json

# Импорт пользователя
node scripts/import-data.js import-user user-123456789-export-2025-10-05.json

# Создать резервную копию
node scripts/import-data.js backup
```

### 4. `migrate-users.js` - Миграция между базами
```bash
# Экспорт из текущей базы
node scripts/migrate-users.js export

# Импорт в новую базу
node scripts/migrate-users.js import

# Создать резервную копию
node scripts/migrate-users.js backup
```

## 🔧 Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:
```env
DATABASE_URL=postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Или установите переменную окружения:
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## 📊 Структура данных

### Таблица `users`
- `id` - Уникальный ID пользователя
- `tg_id` - Telegram ID пользователя
- `first_name` - Имя
- `last_name` - Фамилия
- `phone` - Номер телефона
- `username` - Telegram username
- `created_at` - Дата регистрации
- `updated_at` - Дата последнего обновления

### Таблица `stocks`
- `id` - Уникальный ID акции
- `user_id` - ID пользователя (связь с users.id)
- `stock_name` - Название акции
- `progress` - Прогресс (0-100%)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

### Таблица `free_hookahs`
- `id` - Уникальный ID кальяна
- `user_id` - ID пользователя (связь с users.id)
- `used` - Использован ли кальян
- `used_at` - Дата использования
- `created_at` - Дата создания

## 🚀 Сценарии использования

### 1. Создание резервной копии
```bash
# Создать полную резервную копию
node scripts/export-all-data.js all

# Создать резервную копию через migrate-users
node scripts/migrate-users.js backup
```

### 2. Перенос данных в новую базу
```bash
# 1. Экспорт из текущей базы
SOURCE_DATABASE_URL="текущая_база" node scripts/migrate-users.js export

# 2. Импорт в новую базу
TARGET_DATABASE_URL="новая_база" node scripts/migrate-users.js import
```

### 3. Восстановление данных
```bash
# Восстановить из JSON файла
node scripts/import-data.js import full-export-2025-10-05.json
```

### 4. Анализ данных
```bash
# Показать статистику
node scripts/check-users.js stats

# Найти конкретного пользователя
node scripts/check-users.js find 123456789

# Экспорт в CSV для анализа
node scripts/check-users.js export
```

## ⚠️ Важные замечания

1. **Всегда создавайте резервные копии** перед важными операциями
2. **Проверяйте подключение** к базе данных перед выполнением операций
3. **Существующие пользователи** с тем же TG ID будут пропущены при импорте
4. **Импорт можно выполнять** несколько раз безопасно
5. **Очистка базы данных** удалит ВСЕ данные безвозвратно

## 🔍 Мониторинг

### Проверка состояния базы
```bash
node scripts/check-users.js stats
```

### Поиск проблем
```bash
# Найти пользователя
node scripts/check-users.js find 123456789

# Показать последних пользователей
node scripts/check-users.js list 50
```

## 📈 Статистика (на 05.10.2025)

- **Пользователей**: 9
- **Акций**: 70 (средний прогресс: 27%, завершено: 17)
- **Кальянов**: 19 (все использованы)

### Топ пользователей по активности:
1. Николай Гитлер (TG: 6922083035) - 29 акций, 12 кальянов
2. Николай Шадовский (TG: 937011437) - 29 акций, 3 кальяна
3. Дамир Джумашев (TG: 736766814) - 5 акций, 1 кальян

## 🆘 Поддержка

Если у вас возникли проблемы:
1. Проверьте подключение к базе данных
2. Убедитесь, что переменная `DATABASE_URL` настроена правильно
3. Создайте резервную копию перед выполнением операций
4. Проверьте логи ошибок в консоли

## 📝 Логи

Все операции логируются в консоль с подробной информацией о:
- Количестве обработанных записей
- Ошибках и предупреждениях
- Времени выполнения операций
- Результатах операций

