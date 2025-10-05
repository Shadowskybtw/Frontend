# 📋 План действий для импорта данных из .db файла

## 🎯 Пошаговый план

### Шаг 1: Подготовка
```bash
# 1. Убедитесь, что у вас есть .db файл от старого бота
ls -la *.db

# 2. Создайте резервную копию текущих данных
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js backup
```

### Шаг 2: Анализ .db файла
```bash
# Анализируйте структуру вашей .db базы данных
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js analyze ваш_файл.db
```

**Что покажет анализ:**
- Список всех таблиц в базе данных
- Структуру каждой таблицы (поля и типы)
- Количество записей в каждой таблице
- Примеры данных
- Автоматическое определение типов таблиц (пользователи, акции, кальяны)

### Шаг 3: Импорт данных
```bash
# Импортируйте данные из .db файла
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js import ваш_файл.db
```

**Что произойдет при импорте:**
- Автоматическое создание резервной копии
- Поиск таблиц с пользователями, акциями и кальянами
- Преобразование данных в нужный формат
- Импорт в целевую базу данных
- Пропуск существующих пользователей

### Шаг 4: Проверка результатов
```bash
# Проверьте статистику базы данных
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/check-users.js stats

# Найдите конкретного пользователя
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/check-users.js find 123456789

# Просмотрите список пользователей
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/check-users.js list 20
```

## 🔧 Настройка переменных окружения

### Вариант 1: Установка переменной окружения
```bash
export TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Вариант 2: Использование в команде (рекомендуется)
```bash
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js analyze ваш_файл.db
```

## 📊 Поддерживаемые структуры .db файлов

### Таблицы пользователей
Скрипт автоматически найдет таблицы с пользователями по следующим признакам:
- Название таблицы содержит: `user`, `users`, `member`, `members`
- Поля содержат: `tg_id`, `telegram_id`, `user_id`
- Поля содержат: `first_name`, `name`, `firstName`
- Поля содержат: `last_name`, `surname`, `lastName`
- Поля содержат: `phone`, `phone_number`, `telephone`

### Таблицы акций
- Название таблицы содержит: `stock`, `stocks`, `progress`
- Поля содержат: `stock_name`, `name`
- Поля содержат: `progress`, `percentage`

### Таблицы кальянов
- Название таблицы содержит: `hookah`, `hookahs`, `free`
- Поля содержат: `used`, `is_used`, `consumed`
- Поля содержат: `used_at`, `consumed_at`

## ⚠️ Важные замечания

1. **Всегда создавайте резервную копию** перед импортом
2. **Существующие пользователи** с тем же TG ID будут пропущены
3. **Импорт можно выполнять** несколько раз безопасно
4. **Проверяйте результаты** после импорта

## 🛠️ Устранение проблем

### Ошибка "Файл базы данных не найден"
```bash
# Проверьте путь к файлу
ls -la *.db
ls -la /путь/к/вашему/файлу.db
```

### Ошибка "Неподдерживаемый формат данных"
- Используйте команду `analyze` для анализа структуры
- Проверьте, что в базе есть таблицы с пользователями

### Ошибка подключения к целевой базе данных
- Проверьте переменную `TARGET_DATABASE_URL`
- Убедитесь, что база данных доступна

### Пользователи не импортируются
- Проверьте, что у пользователей есть обязательные поля
- Используйте команду `analyze` для анализа структуры данных

## 📝 Примеры команд

### Полный процесс импорта
```bash
# 1. Анализ
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js analyze old-bot.db

# 2. Импорт
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js import old-bot.db

# 3. Проверка
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/check-users.js stats
```

### Создание резервной копии
```bash
TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" node scripts/import-from-sqlite.js backup
```

## 🎉 После успешного импорта

1. **Проверьте статистику** базы данных
2. **Найдите несколько пользователей** для проверки
3. **Убедитесь, что данные корректны**
4. **Сохраните резервную копию** после импорта
5. **Обновите документацию**

## 📋 Чек-лист

- [ ] .db файл от старого бота готов
- [ ] Создана резервная копия текущих данных
- [ ] Проанализирована структура .db файла
- [ ] Настроена переменная TARGET_DATABASE_URL
- [ ] Проверено подключение к целевой базе данных
- [ ] Выполнен импорт данных
- [ ] Проверены результаты импорта
- [ ] Сохранена резервная копия после импорта
