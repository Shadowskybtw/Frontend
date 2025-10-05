#!/usr/bin/env node
/**
 * Тестовый скрипт для проверки работы бота
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// Устанавливаем тестовый токен если не задан
if (!process.env.BOT_TOKEN) {
  process.env.BOT_TOKEN = 'test_token_for_testing';
}

const HookahNotificationBot = require('./index.js');

async function testBot() {
  console.log('🧪 Тестирование КальянБота Dungeon...\n');
  
  const bot = new HookahNotificationBot();
  
  try {
    // Проверяем подключение к базе данных
    console.log('1️⃣ Проверка подключения к базе данных...');
    const dbConnected = await bot.checkDatabaseConnection();
    if (!dbConnected) {
      console.log('❌ Не удалось подключиться к базе данных');
      return;
    }
    console.log('✅ Подключение к базе данных успешно\n');
    
    // Получаем пользователей для уведомлений
    console.log('2️⃣ Получение пользователей для уведомлений...');
    const users = await bot.getUsersForNotifications();
    console.log(`✅ Найдено ${users.length} пользователей для уведомлений\n`);
    
    // Показываем статистику
    console.log('3️⃣ Статистика пользователей:');
    const stats = {
      total: users.length,
      readyForFree: users.filter(u => u.progress >= 100).length,
      inProgress: users.filter(u => u.progress > 0 && u.progress < 100).length,
      zeroProgress: users.filter(u => u.progress === 0).length
    };
    
    console.log(`   📊 Всего пользователей: ${stats.total}`);
    console.log(`   🎉 Готовы к бесплатному: ${stats.readyForFree}`);
    console.log(`   📈 В процессе: ${stats.inProgress}`);
    console.log(`   ⚪ Нулевой прогресс: ${stats.zeroProgress}\n`);
    
    // Показываем примеры сообщений
    console.log('4️⃣ Примеры уведомлений:');
    
    // Пользователь готовый к бесплатному
    const readyUser = users.find(u => u.progress >= 100);
    if (readyUser) {
      console.log('\n📱 Пример для пользователя готового к бесплатному:');
      console.log('─'.repeat(50));
      console.log(bot.createNotificationMessage(readyUser));
      console.log('─'.repeat(50));
    }
    
    // Пользователь в процессе
    const progressUser = users.find(u => u.progress > 0 && u.progress < 100);
    if (progressUser) {
      console.log('\n📱 Пример для пользователя в процессе:');
      console.log('─'.repeat(50));
      console.log(bot.createNotificationMessage(progressUser));
      console.log('─'.repeat(50));
    }
    
    // Показываем топ пользователей
    console.log('\n5️⃣ Топ пользователей по прогрессу:');
    const topUsers = users
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10);
    
    topUsers.forEach((user, index) => {
      const hookahsToFree = bot.calculateHookahsToFree(user.progress);
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} - ${user.progress}% (до бесплатного: ${hookahsToFree})`);
    });
    
    console.log('\n✅ Тест завершен успешно!');
    console.log('\n🚀 Для запуска бота используйте: node index.js start');
    console.log('🧪 Для тестовой отправки уведомлений: node index.js test');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testBot();
}

module.exports = testBot;
