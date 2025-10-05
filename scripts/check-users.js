#!/usr/bin/env node
/**
 * Скрипт для проверки и управления пользователями в базе данных
 */

const { neon } = require('@neondatabase/serverless');

// Конфигурация
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL не настроен');
  process.exit(1);
}

const db = neon(DATABASE_URL);

class UserManager {
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
   * Получить статистику пользователей
   */
  async getStats() {
    try {
      const [userStats] = await this.db`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as users_last_7_days,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as users_last_30_days
        FROM users
      `;

      const [stockStats] = await this.db`
        SELECT 
          COUNT(*) as total_stocks,
          AVG(progress) as avg_progress,
          COUNT(CASE WHEN progress = 100 THEN 1 END) as completed_stocks
        FROM stocks
      `;

      const [hookahStats] = await this.db`
        SELECT 
          COUNT(*) as total_hookahs,
          COUNT(CASE WHEN used = true THEN 1 END) as used_hookahs,
          COUNT(CASE WHEN used = false THEN 1 END) as unused_hookahs
        FROM free_hookahs
      `;

      console.log('\n📊 Статистика базы данных:');
      console.log('👥 Пользователи:');
      console.log(`   Всего: ${userStats.total_users}`);
      console.log(`   За последние 7 дней: ${userStats.users_last_7_days}`);
      console.log(`   За последние 30 дней: ${userStats.users_last_30_days}`);
      
      console.log('\n📊 Акции:');
      console.log(`   Всего: ${stockStats.total_stocks}`);
      console.log(`   Средний прогресс: ${Math.round(stockStats.avg_progress || 0)}%`);
      console.log(`   Завершено: ${stockStats.completed_stocks}`);
      
      console.log('\n🎯 Кальяны:');
      console.log(`   Всего: ${hookahStats.total_hookahs}`);
      console.log(`   Использовано: ${hookahStats.used_hookahs}`);
      console.log(`   Доступно: ${hookahStats.unused_hookahs}`);

      return {
        users: userStats,
        stocks: stockStats,
        hookahs: hookahStats
      };
    } catch (error) {
      console.error('❌ Ошибка при получении статистики:', error.message);
      throw error;
    }
  }

  /**
   * Получить список всех пользователей
   */
  async listUsers(limit = 10) {
    try {
      const users = await this.db`
        SELECT 
          id, tg_id, first_name, last_name, phone, username, 
          created_at, updated_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;

      console.log(`\n👥 Последние ${users.length} пользователей:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   TG ID: ${user.tg_id}`);
        console.log(`   Телефон: ${user.phone}`);
        console.log(`   Username: ${user.username || 'не указан'}`);
        console.log(`   Зарегистрирован: ${new Date(user.created_at).toLocaleString('ru-RU')}`);
        console.log('');
      });

      return users;
    } catch (error) {
      console.error('❌ Ошибка при получении списка пользователей:', error.message);
      throw error;
    }
  }

  /**
   * Найти пользователя по Telegram ID
   */
  async findUserByTgId(tgId) {
    try {
      const users = await this.db`
        SELECT * FROM users WHERE tg_id = ${tgId}
      `;

      if (users.length === 0) {
        console.log(`❌ Пользователь с TG ID ${tgId} не найден`);
        return null;
      }

      const user = users[0];
      console.log(`\n👤 Пользователь найден:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   TG ID: ${user.tg_id}`);
      console.log(`   Имя: ${user.first_name} ${user.last_name}`);
      console.log(`   Телефон: ${user.phone}`);
      console.log(`   Username: ${user.username || 'не указан'}`);
      console.log(`   Зарегистрирован: ${new Date(user.created_at).toLocaleString('ru-RU')}`);
      console.log(`   Обновлен: ${new Date(user.updated_at).toLocaleString('ru-RU')}`);

      // Получаем акции пользователя
      const stocks = await this.db`
        SELECT * FROM stocks WHERE user_id = ${user.id} ORDER BY created_at DESC
      `;
      console.log(`\n📊 Акции (${stocks.length}):`);
      stocks.forEach(stock => {
        console.log(`   - ${stock.stock_name}: ${stock.progress}%`);
      });

      // Получаем кальяны пользователя
      const hookahs = await this.db`
        SELECT * FROM free_hookahs WHERE user_id = ${user.id} ORDER BY created_at DESC
      `;
      console.log(`\n🎯 Кальяны (${hookahs.length}):`);
      hookahs.forEach(hookah => {
        const status = hookah.used ? 'использован' : 'доступен';
        console.log(`   - ${status} (создан: ${new Date(hookah.created_at).toLocaleString('ru-RU')})`);
      });

      return user;
    } catch (error) {
      console.error('❌ Ошибка при поиске пользователя:', error.message);
      throw error;
    }
  }

  /**
   * Экспорт пользователей в CSV
   */
  async exportToCSV() {
    try {
      const users = await this.db`
        SELECT 
          tg_id, first_name, last_name, phone, username, 
          created_at, updated_at
        FROM users 
        ORDER BY created_at ASC
      `;

      const csvHeader = 'TG ID,Имя,Фамилия,Телефон,Username,Дата регистрации,Дата обновления\n';
      const csvRows = users.map(user => 
        `${user.tg_id},"${user.first_name}","${user.last_name}","${user.phone}","${user.username || ''}","${new Date(user.created_at).toLocaleString('ru-RU')}","${new Date(user.updated_at).toLocaleString('ru-RU')}"`
      ).join('\n');

      const csvContent = csvHeader + csvRows;
      const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      require('fs').writeFileSync(filename, csvContent, 'utf8');
      console.log(`✅ Данные экспортированы в файл: ${filename}`);
      console.log(`📊 Экспортировано пользователей: ${users.length}`);

      return filename;
    } catch (error) {
      console.error('❌ Ошибка при экспорте в CSV:', error.message);
      throw error;
    }
  }

  /**
   * Создать тестового пользователя
   */
  async createTestUser() {
    try {
      const testUser = {
        tg_id: 999999999,
        first_name: 'Test',
        last_name: 'User',
        phone: '+79999999999',
        username: 'testuser'
      };

      const [user] = await this.db`
        INSERT INTO users (tg_id, first_name, last_name, phone, username)
        VALUES (${testUser.tg_id}, ${testUser.first_name}, ${testUser.last_name}, ${testUser.phone}, ${testUser.username})
        RETURNING *
      `;

      console.log('✅ Тестовый пользователь создан:');
      console.log(`   ID: ${user.id}`);
      console.log(`   TG ID: ${user.tg_id}`);
      console.log(`   Имя: ${user.first_name} ${user.last_name}`);

      return user;
    } catch (error) {
      console.error('❌ Ошибка при создании тестового пользователя:', error.message);
      throw error;
    }
  }

  /**
   * Удалить тестового пользователя
   */
  async deleteTestUser() {
    try {
      const result = await this.db`
        DELETE FROM users WHERE tg_id = 999999999
      `;

      console.log('✅ Тестовый пользователь удален');
      return result;
    } catch (error) {
      console.error('❌ Ошибка при удалении тестового пользователя:', error.message);
      throw error;
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const manager = new UserManager();

  try {
    // Проверяем подключение
    const connected = await manager.checkConnection();
    if (!connected) {
      process.exit(1);
    }

    switch (command) {
      case 'stats':
        await manager.getStats();
        break;
        
      case 'list':
        const limit = arg ? parseInt(arg) : 10;
        await manager.listUsers(limit);
        break;
        
      case 'find':
        if (!arg) {
          console.error('❌ Укажите TG ID пользователя');
          process.exit(1);
        }
        await manager.findUserByTgId(parseInt(arg));
        break;
        
      case 'export':
        await manager.exportToCSV();
        break;
        
      case 'test-create':
        await manager.createTestUser();
        break;
        
      case 'test-delete':
        await manager.deleteTestUser();
        break;
        
      case 'help':
      default:
        console.log(`
🔍 Скрипт управления пользователями

Использование:
  node check-users.js <command> [argument]

Команды:
  stats           - Показать статистику базы данных
  list [limit]    - Показать список пользователей (по умолчанию 10)
  find <tg_id>    - Найти пользователя по Telegram ID
  export          - Экспорт пользователей в CSV файл
  test-create     - Создать тестового пользователя
  test-delete     - Удалить тестового пользователя
  help            - Показать эту справку

Примеры:
  # Показать статистику
  node check-users.js stats
  
  # Показать последних 20 пользователей
  node check-users.js list 20
  
  # Найти пользователя
  node check-users.js find 123456789
  
  # Экспорт в CSV
  node check-users.js export
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

module.exports = UserManager;

