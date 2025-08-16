# 🐛 Инструкции по отладке WebApp

## 🎯 **Проблема**

WebApp работает только у вас, у других пользователей не инициализируется.

## 🔍 **Что добавлено для отладки**

### **1. Детальное логирование в консоль**
- ✅ Логи инициализации Telegram WebApp
- ✅ Логи API вызовов
- ✅ Логи fallback механизмов
- ✅ Логи ошибок

### **2. Компонент InitStatus**
- ✅ Статус доступности Telegram объектов
- ✅ Статус WebApp инициализации
- ✅ Данные пользователя Telegram
- ✅ Данные localStorage
- ✅ Время последней проверки

### **3. Компонент ApiTester**
- ✅ Тестирование всех API endpoints
- ✅ Статус ответов
- ✅ Детали ошибок
- ✅ Заголовки ответов

## 🧪 **Как отладить**

### **Шаг 1: Откройте WebApp у другого пользователя**
1. Отправьте `/start` боту от имени другого пользователя
2. Откройте WebApp
3. Перейдите в профиль

### **Шаг 2: Проверьте консоль браузера**
Откройте Developer Tools (F12) и посмотрите в Console:

```
🔍 UserContext: Initializing Telegram WebApp...
🔍 UserContext: window.Telegram: [object Object]
🔍 UserContext: window.Telegram?.WebApp: [object WebApp]
✅ UserContext: Telegram WebApp found
✅ UserContext: WebApp.ready() called
✅ UserContext: WebApp.expand() called
🔍 UserContext: initDataUnsafe.user: {id: 123456, first_name: "John", ...}
✅ UserContext: Telegram user found: {id: 123456, ...}
🔍 UserContext: isTg set to: true
```

### **Шаг 3: Проверьте компонент InitStatus**
В профиле будет блок "Статус инициализации WebApp":

- **Telegram объект:** ✅ Доступно / ❌ Недоступно
- **WebApp объект:** ✅ Доступно / ❌ Недоступно  
- **Данные пользователя:** ✅ Получены / ❌ Отсутствуют
- **localStorage:** ✅ Есть данные / ❌ Пусто

### **Шаг 4: Проверьте компонент ApiTester**
Нажмите "Тестировать все API" и посмотрите результаты:

- **New API** (`/api/webapp/init/{id}`) - статус нового endpoint
- **Legacy API** (`/api/main/{id}`) - статус старого endpoint
- **Stocks API** - статус API кальянов
- **Hookahs API** - статус API бесплатных кальянов

## 🔍 **Возможные проблемы**

### **Проблема 1: Telegram объект недоступен**
```
❌ Telegram объект: Недоступно
```

**Решение:** WebApp открыт не в Telegram или бот не настроен правильно.

### **Проблема 2: WebApp объект недоступен**
```
✅ Telegram объект: Доступно
❌ WebApp объект: Недоступно
```

**Решение:** Проблема с инициализацией WebApp API.

### **Проблема 3: Данные пользователя отсутствуют**
```
✅ WebApp объект: Доступно
❌ Данные пользователя: Отсутствуют
```

**Решение:** Проблема с передачей данных от бота.

### **Проблема 4: API endpoints недоступны**
```
New API: ❌ HTTP 404
Legacy API: ❌ HTTP 500
```

**Решение:** Проблема с бэкендом или роутингом.

## 📱 **Тестирование в Telegram**

### **Правильный способ:**
1. Отправьте `/start` боту
2. Нажмите на кнопку WebApp в сообщении бота
3. WebApp должен открыться в Telegram

### **Неправильный способ:**
1. Скопируйте URL WebApp
2. Откройте в обычном браузере
3. Telegram объекты будут недоступны

## 🔧 **Отладочные команды**

### **В консоли браузера:**
```javascript
// Проверить доступность Telegram
console.log('Telegram:', window.Telegram)
console.log('WebApp:', window.Telegram?.WebApp)

// Проверить данные пользователя
console.log('User:', window.Telegram?.WebApp?.initDataUnsafe?.user)

// Проверить localStorage
console.log('localStorage:', localStorage.getItem('user'))

// Проверить текущий URL
console.log('URL:', window.location.href)
```

### **В компоненте InitStatus:**
- Нажмите "Логировать в консоль" для детального вывода
- Нажмите "Обновить страницу" для перезагрузки

## 📊 **Анализ логов**

### **Успешная инициализация:**
```
✅ UserContext: Telegram WebApp found
✅ UserContext: WebApp.ready() called
✅ UserContext: WebApp.expand() called
✅ UserContext: Telegram user found: {id: 123456, ...}
✅ UserContext: isTg set to: true
```

### **Проблемная инициализация:**
```
⚠️ UserContext: Telegram WebApp not found
❌ UserContext: No Telegram user data
🔍 UserContext: isTg set to: false
```

## 🚀 **Следующие шаги**

1. **Задеплойте обновленный фронтенд**
2. **Откройте WebApp у другого пользователя**
3. **Проверьте консоль браузера**
4. **Посмотрите компоненты InitStatus и ApiTester**
5. **Скопируйте логи и отправьте мне**

## 💡 **Быстрая диагностика**

Если WebApp не работает у других пользователей, скорее всего:

- ❌ **Бот не настроен правильно** (не отправляет WebApp кнопки)
- ❌ **WebApp URL неправильный** (не открывается в Telegram)
- ❌ **Бэкенд недоступен** (API endpoints не отвечают)
- ❌ **CORS проблемы** (блокируются запросы)

**Отправьте мне логи и я помогу найти проблему! 🎯**
