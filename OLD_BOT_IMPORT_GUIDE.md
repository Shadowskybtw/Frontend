# 🔄 Руководство по импорту данных из старого бота

Это руководство поможет вам перенести данные пользователей из старого бота в текущую базу данных webapp.

## 🎯 Подготовка

### 1. Создание резервной копии
```bash
# Создать резервную копию текущих данных
DATABASE_URL="ваш_url" node scripts/export-all-data.js all
```

### 2. Анализ файла с данными старого бота
```bash
# Анализ JSON файла
node scripts/analyze-data-file.js old-bot-data.json

# Анализ CSV файла
node scripts/analyze-data-file.js users.csv

# Анализ текстового файла
node scripts/analyze-data-file.js data.txt
```

## 📁 Поддерживаемые форматы данных

### JSON файлы
- **Полный экспорт**: `{users: [], stocks: [], free_hookahs: []}`
- **Массив пользователей**: `[{tg_id, first_name, ...}, ...]`
- **Вложенные данные**: `[{user: {...}, stocks: [...], ...}, ...]`
- **Один пользователь**: `{tg_id, first_name, ...}`

### CSV файлы
- Любые CSV файлы с пользователями
- Автоматическое определение полей
- Поддержка различных названий полей

### База данных
- Прямое подключение к старой базе данных
- Автоматический экспорт всех таблиц

## 🚀 Импорт данных

### 1. Импорт из JSON файла
```bash
# Импорт из JSON файла
DATABASE_URL="ваш_url" node scripts/import-from-old-bot.js json old-bot-data.json
```

### 2. Импорт из CSV файла
```bash
# Импорт из CSV файла
DATABASE_URL="ваш_url" node scripts/import-from-old-bot.js csv users.csv
```

### 3. Импорт из старой базы данных
```bash
# Импорт из старой базы данных
TARGET_DATABASE_URL="новая_база" OLD_DATABASE_URL="старая_база" node scripts/import-from-old-bot.js database
```

## 🔧 Настройка переменных окружения

### Для импорта из файлов
```bash
export TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### Для импорта из базы данных
```bash
export TARGET_DATABASE_URL="postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export OLD_DATABASE_URL="postgresql://старая_база_данных"
```

## 📊 Поддерживаемые поля пользователей

Скрипт автоматически распознает различные варианты названий полей:

| Поле | Варианты названий |
|------|-------------------|
| Telegram ID | `tg_id`, `telegram_id`, `user_id`, `id` |
| Имя | `first_name`, `firstName`, `name`, `firstname` |
| Фамилия | `last_name`, `lastName`, `surname`, `lastname` |
| Телефон | `phone`, `phone_number`, `telephone` |
| Username | `username`, `telegram_username`, `tg_username` |

## ⚠️ Важные замечания

1. **Всегда создавайте резервную копию** перед импортом
2. **Существующие пользователи** с тем же TG ID будут пропущены
3. **Импорт можно выполнять** несколько раз безопасно
4. **Проверяйте результаты** после импорта

## 🔍 Проверка результатов

### После импорта проверьте статистику
```bash
DATABASE_URL="ваш_url" node scripts/check-users.js stats
```

### Найдите конкретного пользователя
```bash
DATABASE_URL="ваш_url" node scripts/check-users.js find 123456789
```

### Просмотрите список пользователей
```bash
DATABASE_URL="ваш_url" node scripts/check-users.js list 50
```

## 🛠️ Устранение проблем

### Ошибка "Файл не найден"
- Проверьте путь к файлу
- Убедитесь, что файл существует

### Ошибка "Неподдерживаемый формат данных"
- Используйте `analyze-data-file.js` для анализа структуры
- Преобразуйте данные в поддерживаемый формат

### Ошибка подключения к базе данных
- Проверьте переменную `TARGET_DATABASE_URL`
- Убедитесь, что база данных доступна

### Пользователи не импортируются
- Проверьте, что у пользователей есть обязательные поля: `tg_id`, `first_name`, `last_name`, `phone`
- Используйте `analyze-data-file.js` для анализа структуры данных

## 📈 Примеры использования

### Пример 1: Импорт из JSON файла
```bash
# 1. Анализ файла
node scripts/analyze-data-file.js old-bot-users.json

# 2. Импорт
DATABASE_URL="ваш_url" node scripts/import-from-old-bot.js json old-bot-users.json

# 3. Проверка
DATABASE_URL="ваш_url" node scripts/check-users.js stats
```

### Пример 2: Импорт из CSV файла
```bash
# 1. Анализ файла
node scripts/analyze-data-file.js users.csv

# 2. Импорт
DATABASE_URL="ваш_url" node scripts/import-from-old-bot.js csv users.csv

# 3. Проверка
DATABASE_URL="ваш_url" node scripts/check-users.js list 20
```

### Пример 3: Импорт из базы данных
```bash
# 1. Создание резервной копии
DATABASE_URL="ваш_url" node scripts/import-from-old-bot.js backup

# 2. Импорт
TARGET_DATABASE_URL="новая_база" OLD_DATABASE_URL="старая_база" node scripts/import-from-old-bot.js database

# 3. Проверка
DATABASE_URL="ваш_url" node scripts/check-users.js stats
```

## 📝 Логи

Все операции логируются с подробной информацией:
- Количество обработанных записей
- Ошибки и предупреждения
- Время выполнения операций
- Результаты импорта

## 🆘 Поддержка

Если у вас возникли проблемы:
1. Проверьте подключение к базе данных
2. Убедитесь, что переменные окружения настроены правильно
3. Создайте резервную копию перед выполнением операций
4. Используйте `analyze-data-file.js` для анализа структуры данных
5. Проверьте логи ошибок в консоли

## 📋 Чек-лист перед импортом

- [ ] Создана резервная копия текущих данных
- [ ] Проанализирован файл с данными старого бота
- [ ] Настроены переменные окружения
- [ ] Проверено подключение к базе данных
- [ ] Подготовлен план отката в случае проблем

## 🎉 После успешного импорта

1. Проверьте статистику базы данных
2. Найдите несколько пользователей для проверки
3. Убедитесь, что данные корректны
4. Сохраните резервную копию после импорта
5. Обновите документацию
