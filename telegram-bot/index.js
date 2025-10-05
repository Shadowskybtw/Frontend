#!/usr/bin/env node
/**
 * Telegram Bot для уведомлений о прогрессе кальянов
 * Отправляет ежедневные уведомления пользователям о том, сколько кальянов осталось до бесплатного
 */

const { Telegraf } = require('telegraf');
const { neon } = require('@neondatabase/serverless');
const cron = require('node-cron');
require('dotenv').config();

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const NOTIFICATION_TIME = process.env.NOTIFICATION_TIME || '18:00';
const TIMEZONE = process.env.TIMEZONE || 'Europe/Moscow';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не настроен');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL не настроен');
  process.exit(1);
}

// Инициализация бота и базы данных
const bot = new Telegraf(BOT_TOKEN);
const db = neon(DATABASE_URL);

class HookahNotificationBot {
  constructor() {
    this.bot = bot;
    this.db = db;
    this.notificationTime = NOTIFICATION_TIME;
    this.timezone = TIMEZONE;
  }

  /**
   * Проверка подключения к базе данных
   */
  async checkDatabaseConnection() {
    try {
      await this.db`SELECT 1`;
      console.log('✅ Подключение к базе данных успешно');
      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения к базе данных:', error.message);
      return false;
    }
  }

  /**
   * Получение пользователей для уведомлений
   */
  async getUsersForNotifications() {
    try {
      const users = await this.db`
        SELECT 
          u.id,
          u.tg_id,
          u.first_name,
          u.last_name,
          u.phone,
          s.progress,
          COUNT(fh.id) as total_hookahs,
          COUNT(CASE WHEN fh.used = true THEN 1 END) as used_hookahs,
          COALESCE(u.total_purchases, 0) as total_purchases,
          COALESCE(u.total_regular_purchases, 0) as total_regular_purchases,
          COALESCE(u.total_free_purchases, 0) as total_free_purchases
        FROM users u
        LEFT JOIN stocks s ON u.id = s.user_id
        LEFT JOIN free_hookahs fh ON u.id = fh.user_id
        WHERE u.tg_id IS NOT NULL 
          AND u.tg_id > 0
          AND s.progress IS NOT NULL
        GROUP BY u.id, u.tg_id, u.first_name, u.last_name, u.phone, s.progress, u.total_purchases, u.total_regular_purchases, u.total_free_purchases
        HAVING COUNT(fh.id) > 0
        ORDER BY s.progress DESC
      `;

      return users;
    } catch (error) {
      console.error('❌ Ошибка при получении пользователей:', error.message);
      return [];
    }
  }

  /**
   * Расчет количества кальянов до бесплатного
   */
  calculateHookahsToFree(progress) {
    if (progress >= 100) {
      return 0; // Готов к бесплатному
    }
    
    // Каждый кальян = 20%, так как 5 кальянов = 100%
    const hookahsInCurrentCycle = Math.floor(progress / 20);
    const hookahsToFree = 5 - hookahsInCurrentCycle;
    
    return Math.max(0, hookahsToFree);
  }

  /**
   * Создание сообщения для пользователя
   */
  createNotificationMessage(user) {
    const hookahsToFree = this.calculateHookahsToFree(user.progress);

    let message = `🎯 <b>DUNGEONHOOKAH_BOT</b>\n\n`;
    message += `Привет, ${user.first_name}! 👋\n\n`;
    
    if (hookahsToFree === 0) {
      message += `🎉 <b>У вас доступен бесплатный кальян!</b>\n\n`;
      message += `Приходите и забирайте его скорее! 🚀`;
    } else {
      message += `🎯 <b>До бесплатного кальяна осталось: ${hookahsToFree} кальянов</b>`;
    }

    // Создаем клавиатуру с кнопкой для открытия webapp
    const keyboard = {
      inline_keyboard: [[
        {
          text: '📱 Открыть приложение',
          web_app: { url: 'https://frontend-delta-sandy-58.vercel.app' }
        }
      ]]
    };

    return { message, keyboard };
  }

  /**
   * Создание прогресс-бара
   */
  createProgressBar(progress) {
    const filled = Math.floor(progress / 10);
    const empty = 10 - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      bar += '🟩';
    }
    for (let i = 0; i < empty; i++) {
      bar += '⬜';
    }
    
    return bar;
  }

  /**
   * Отправка уведомления пользователю
   */
  async sendNotificationToUser(user) {
    try {
      const { message, keyboard } = this.createNotificationMessage(user);
      
      await this.bot.telegram.sendMessage(user.tg_id, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: keyboard
      });
      
      console.log(`✅ Уведомление отправлено: ${user.first_name} ${user.last_name} (TG: ${user.tg_id})`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка отправки уведомления пользователю ${user.tg_id}:`, error.message);
      return false;
    }
  }

  /**
   * Отправка ежедневных уведомлений
   */
  async sendDailyNotifications() {
    console.log('🔄 Начинаем отправку ежедневных уведомлений...');
    
    const users = await this.getUsersForNotifications();
    console.log(`👥 Найдено ${users.length} пользователей для уведомлений`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      const success = await this.sendNotificationToUser(user);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Небольшая задержка между отправками, чтобы не превысить лимиты API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📊 Результаты отправки уведомлений:`);
    console.log(`✅ Успешно: ${successCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
  }

  /**
   * Настройка команд бота
   */
  setupBotCommands() {
    // Команда /start
    this.bot.start((ctx) => {
      const keyboard = {
        inline_keyboard: [[
          {
            text: '📱 Открыть приложение',
            web_app: { url: 'https://frontend-delta-sandy-58.vercel.app' }
          }
        ]]
      };

      ctx.reply(
        '🎯 <b>DUNGEONHOOKAH_BOT</b>\n\n' +
        'Добро пожаловать! Я буду напоминать вам о прогрессе в акции кальянов.\n\n' +
        '📊 <b>Доступные команды:</b>\n' +
        '/progress - узнать свой прогресс\n' +
        '/help - помощь\n\n' +
        '💡 <b>Для подробной информации о прогрессе используйте мини-приложение!</b>',
        { 
          parse_mode: 'HTML',
          reply_markup: keyboard
        }
      );
    });

    // Команда /progress
    this.bot.command('progress', async (ctx) => {
      try {
        const tgId = ctx.from.id;
        
        const user = await this.db`
          SELECT 
            u.id,
            u.tg_id,
            u.first_name,
            u.last_name,
            u.phone,
            s.progress,
            COUNT(fh.id) as total_hookahs,
            COUNT(CASE WHEN fh.used = true THEN 1 END) as used_hookahs
          FROM users u
          LEFT JOIN stocks s ON u.id = s.user_id
          LEFT JOIN free_hookahs fh ON u.id = fh.user_id
          WHERE u.tg_id = ${tgId}
          GROUP BY u.id, u.tg_id, u.first_name, u.last_name, u.phone, s.progress
        `;

        if (user.length === 0) {
          ctx.reply('❌ Пользователь не найден в базе данных. Обратитесь к администратору.');
          return;
        }

        const userData = user[0];
        const { message, keyboard } = this.createNotificationMessage(userData);
        
        ctx.reply(message, { 
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      } catch (error) {
        console.error('❌ Ошибка при получении прогресса:', error.message);
        ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
      }
    });

    // Команда /help
    this.bot.help((ctx) => {
      ctx.reply(
        '🆘 <b>Помощь</b>\n\n' +
        '📊 <b>Команды:</b>\n' +
        '/start - начать работу с ботом\n' +
        '/progress - узнать свой прогресс в акции\n' +
        '/help - показать эту справку\n\n' +
        '⏰ <b>Уведомления:</b>\n' +
        'Бот отправляет ежедневные уведомления в 18:00 о вашем прогрессе в акции кальянов.\n\n' +
        '🎯 <b>Как работает акция:</b>\n' +
        '• Каждые 5 покупок = 1 бесплатный кальян\n' +
        '• После получения бесплатного счетчик сбрасывается\n' +
        '• Прогресс отображается в процентах\n\n' +
        'Если у вас есть вопросы, обратитесь к администратору!',
        { parse_mode: 'HTML' }
      );
    });

    // Обработка неизвестных команд
    this.bot.on('text', (ctx) => {
      ctx.reply(
        '❓ Неизвестная команда. Используйте /help для получения справки.',
        { parse_mode: 'HTML' }
      );
    });
  }

  /**
   * Настройка расписания уведомлений
   */
  setupNotificationSchedule() {
    // Парсим время уведомлений
    const [hours, minutes] = this.notificationTime.split(':').map(Number);
    
    // Создаем cron выражение для ежедневного запуска
    const cronExpression = `${minutes} ${hours} * * *`;
    
    console.log(`⏰ Настроено расписание уведомлений: ${this.notificationTime} (${this.timezone})`);
    console.log(`📅 Cron выражение: ${cronExpression}`);
    
    cron.schedule(cronExpression, async () => {
      console.log('🕕 Время отправки уведомлений!');
      await this.sendDailyNotifications();
    }, {
      timezone: this.timezone
    });
  }

  /**
   * Запуск бота
   */
  async start() {
    try {
      // Проверяем подключение к базе данных
      const dbConnected = await this.checkDatabaseConnection();
      if (!dbConnected) {
        process.exit(1);
      }

      // Настраиваем команды бота
      this.setupBotCommands();

      // Настраиваем расписание уведомлений
      this.setupNotificationSchedule();

      // Запускаем бота
      await this.bot.launch();
      console.log('🚀 Бот запущен успешно!');
      console.log('📱 Бот готов к работе и будет отправлять уведомления по расписанию');

      // Обработка завершения работы
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

    } catch (error) {
      console.error('❌ Ошибка при запуске бота:', error.message);
      process.exit(1);
    }
  }

  /**
   * Тестовая отправка уведомлений (для тестирования)
   */
  async testNotifications() {
    console.log('🧪 Тестовая отправка уведомлений...');
    await this.sendDailyNotifications();
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const bot = new HookahNotificationBot();

  switch (command) {
    case 'test':
      await bot.testNotifications();
      break;
    case 'start':
    default:
      await bot.start();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = HookahNotificationBot;
