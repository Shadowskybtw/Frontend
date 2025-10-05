#!/usr/bin/env node
/**
 * Скрипт для полного экспорта всех данных из базы данных
 * Экспортирует пользователей, акции и кальяны в JSON формат
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Конфигурация
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL не настроен');
  process.exit(1);
}

const db = neon(DATABASE_URL);

class DataExporter {
  constructor() {
    this.db = db;
  }

  /**
   * Проверка подключения к базе данных
   */
  async checkConnection() {
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
   * Полный экспорт всех данных
   */
  async exportAllData() {
    try {
      console.log('🔄 Начинаем полный экспорт данных...\n');

      // 1. Экспорт пользователей
      console.log('👥 Экспорт пользователей...');
      const users = await this.db`
        SELECT 
          id, tg_id, first_name, last_name, phone, username, 
          created_at, updated_at
        FROM users 
        ORDER BY created_at ASC
      `;
      console.log(`   ✅ Экспортировано пользователей: ${users.length}`);

      // 2. Экспорт акций
      console.log('📊 Экспорт акций...');
      const stocks = await this.db`
        SELECT 
          s.id, s.user_id, s.stock_name, s.progress, s.created_at, s.updated_at,
          u.tg_id as user_tg_id
        FROM stocks s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at ASC
      `;
      console.log(`   ✅ Экспортировано акций: ${stocks.length}`);

      // 3. Экспорт кальянов
      console.log('🎯 Экспорт кальянов...');
      const freeHookahs = await this.db`
        SELECT 
          fh.id, fh.user_id, fh.used, fh.used_at, fh.created_at,
          u.tg_id as user_tg_id
        FROM free_hookahs fh
        JOIN users u ON fh.user_id = u.id
        ORDER BY fh.created_at ASC
      `;
      console.log(`   ✅ Экспортировано кальянов: ${freeHookahs.length}`);

      // 4. Создание полного объекта данных
      const exportData = {
        metadata: {
          exported_at: new Date().toISOString(),
          exported_by: 'DataExporter',
          version: '1.0',
          total_users: users.length,
          total_stocks: stocks.length,
          total_hookahs: freeHookahs.length
        },
        users: users,
        stocks: stocks,
        free_hookahs: freeHookahs
      };

      // 5. Сохранение в файл
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `full-export-${timestamp}.json`;
      
      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(`\n✅ Полный экспорт сохранен в файл: ${filename}`);
      
      // 6. Создание CSV файлов для удобства
      await this.createCSVFiles(users, stocks, freeHookahs, timestamp);
      
      // 7. Статистика
      this.printStatistics(users, stocks, freeHookahs);
      
      return exportData;
      
    } catch (error) {
      console.error('❌ Ошибка при экспорте данных:', error.message);
      throw error;
    }
  }

  /**
   * Создание CSV файлов
   */
  async createCSVFiles(users, stocks, freeHookahs, timestamp) {
    console.log('\n📄 Создание CSV файлов...');

    // CSV для пользователей
    const usersCSV = this.createUsersCSV(users);
    const usersFilename = `users-${timestamp}.csv`;
    fs.writeFileSync(usersFilename, usersCSV);
    console.log(`   ✅ Пользователи: ${usersFilename}`);

    // CSV для акций
    const stocksCSV = this.createStocksCSV(stocks);
    const stocksFilename = `stocks-${timestamp}.csv`;
    fs.writeFileSync(stocksFilename, stocksCSV);
    console.log(`   ✅ Акции: ${stocksFilename}`);

    // CSV для кальянов
    const hookahsCSV = this.createHookahsCSV(freeHookahs);
    const hookahsFilename = `hookahs-${timestamp}.csv`;
    fs.writeFileSync(hookahsFilename, hookahsCSV);
    console.log(`   ✅ Кальяны: ${hookahsFilename}`);
  }

  /**
   * Создание CSV для пользователей
   */
  createUsersCSV(users) {
    const header = 'ID,TG ID,Имя,Фамилия,Телефон,Username,Дата регистрации,Дата обновления\n';
    const rows = users.map(user => 
      `${user.id},${user.tg_id},"${user.first_name}","${user.last_name}","${user.phone}","${user.username || ''}","${new Date(user.created_at).toLocaleString('ru-RU')}","${new Date(user.updated_at).toLocaleString('ru-RU')}"`
    ).join('\n');
    return header + rows;
  }

  /**
   * Создание CSV для акций
   */
  createStocksCSV(stocks) {
    const header = 'ID,User ID,User TG ID,Название акции,Прогресс (%),Дата создания,Дата обновления\n';
    const rows = stocks.map(stock => 
      `${stock.id},${stock.user_id},${stock.user_tg_id},"${stock.stock_name}",${stock.progress},"${new Date(stock.created_at).toLocaleString('ru-RU')}","${new Date(stock.updated_at).toLocaleString('ru-RU')}"`
    ).join('\n');
    return header + rows;
  }

  /**
   * Создание CSV для кальянов
   */
  createHookahsCSV(hookahs) {
    const header = 'ID,User ID,User TG ID,Использован,Дата использования,Дата создания\n';
    const rows = hookahs.map(hookah => 
      `${hookah.id},${hookah.user_id},${hookah.user_tg_id},${hookah.used},"${hookah.used_at ? new Date(hookah.used_at).toLocaleString('ru-RU') : ''}","${new Date(hookah.created_at).toLocaleString('ru-RU')}"`
    ).join('\n');
    return header + rows;
  }

  /**
   * Вывод статистики
   */
  printStatistics(users, stocks, freeHookahs) {
    console.log('\n📊 Статистика экспорта:');
    console.log('👥 Пользователи:');
    console.log(`   Всего: ${users.length}`);
    
    const recentUsers = users.filter(user => 
      new Date(user.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    console.log(`   За последние 7 дней: ${recentUsers}`);

    console.log('\n📊 Акции:');
    console.log(`   Всего: ${stocks.length}`);
    const avgProgress = stocks.reduce((sum, stock) => sum + stock.progress, 0) / stocks.length;
    console.log(`   Средний прогресс: ${Math.round(avgProgress)}%`);
    const completedStocks = stocks.filter(stock => stock.progress === 100).length;
    console.log(`   Завершено: ${completedStocks}`);

    console.log('\n🎯 Кальяны:');
    console.log(`   Всего: ${freeHookahs.length}`);
    const usedHookahs = freeHookahs.filter(hookah => hookah.used).length;
    const unusedHookahs = freeHookahs.filter(hookah => !hookah.used).length;
    console.log(`   Использовано: ${usedHookahs}`);
    console.log(`   Доступно: ${unusedHookahs}`);

    // Статистика по пользователям
    console.log('\n👤 Топ пользователей по активности:');
    const userStats = users.map(user => {
      const userStocks = stocks.filter(stock => stock.user_id === user.id);
      const userHookahs = freeHookahs.filter(hookah => hookah.user_id === user.id);
      return {
        name: `${user.first_name} ${user.last_name}`,
        tg_id: user.tg_id,
        stocks: userStocks.length,
        hookahs: userHookahs.length,
        avgProgress: userStocks.length > 0 ? Math.round(userStocks.reduce((sum, stock) => sum + stock.progress, 0) / userStocks.length) : 0
      };
    }).sort((a, b) => (b.stocks + b.hookahs) - (a.stocks + a.hookahs));

    userStats.slice(0, 5).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (TG: ${user.tg_id})`);
      console.log(`      Акций: ${user.stocks}, Кальянов: ${user.hookahs}, Средний прогресс: ${user.avgProgress}%`);
    });
  }

  /**
   * Экспорт данных конкретного пользователя
   */
  async exportUserData(tgId) {
    try {
      console.log(`🔄 Экспорт данных пользователя с TG ID: ${tgId}...\n`);

      // Получаем пользователя
      const users = await this.db`
        SELECT * FROM users WHERE tg_id = ${tgId}
      `;

      if (users.length === 0) {
        console.log(`❌ Пользователь с TG ID ${tgId} не найден`);
        return null;
      }

      const user = users[0];

      // Получаем акции пользователя
      const stocks = await this.db`
        SELECT * FROM stocks WHERE user_id = ${user.id} ORDER BY created_at ASC
      `;

      // Получаем кальяны пользователя
      const freeHookahs = await this.db`
        SELECT * FROM free_hookahs WHERE user_id = ${user.id} ORDER BY created_at ASC
      `;

      const userData = {
        metadata: {
          exported_at: new Date().toISOString(),
          user_tg_id: tgId,
          user_name: `${user.first_name} ${user.last_name}`
        },
        user: user,
        stocks: stocks,
        free_hookahs: freeHookahs
      };

      const filename = `user-${tgId}-export-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(filename, JSON.stringify(userData, null, 2));
      
      console.log(`✅ Данные пользователя экспортированы в файл: ${filename}`);
      console.log(`   Акций: ${stocks.length}`);
      console.log(`   Кальянов: ${freeHookahs.length}`);

      return userData;
      
    } catch (error) {
      console.error('❌ Ошибка при экспорте данных пользователя:', error.message);
      throw error;
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const exporter = new DataExporter();

  try {
    // Проверяем подключение
    const connected = await exporter.checkConnection();
    if (!connected) {
      process.exit(1);
    }

    switch (command) {
      case 'all':
        await exporter.exportAllData();
        break;
        
      case 'user':
        if (!arg) {
          console.error('❌ Укажите TG ID пользователя');
          process.exit(1);
        }
        await exporter.exportUserData(parseInt(arg));
        break;
        
      case 'help':
      default:
        console.log(`
📤 Скрипт экспорта данных

Использование:
  node export-all-data.js <command> [argument]

Команды:
  all           - Полный экспорт всех данных (пользователи, акции, кальяны)
  user <tg_id>  - Экспорт данных конкретного пользователя
  help          - Показать эту справку

Примеры:
  # Полный экспорт
  node export-all-data.js all
  
  # Экспорт пользователя
  node export-all-data.js user 123456789

Файлы экспорта:
  - full-export-YYYY-MM-DD.json - полный JSON экспорт
  - users-YYYY-MM-DD.csv - пользователи в CSV
  - stocks-YYYY-MM-DD.csv - акции в CSV  
  - hookahs-YYYY-MM-DD.csv - кальяны в CSV
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataExporter;

