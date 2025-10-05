FROM node:18-alpine

# Создаем директорию приложения
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем директорию для логов
RUN mkdir -p logs

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bot -u 1001

# Меняем владельца файлов
RUN chown -R bot:nodejs /app
USER bot

# Открываем порт (если нужен)
EXPOSE 3000

# Запускаем бота
CMD ["node", "index.js", "start"]
