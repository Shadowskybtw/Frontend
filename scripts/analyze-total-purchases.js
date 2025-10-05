#!/usr/bin/env node
/**
 * Скрипт для анализа общего количества покупок из старой базы данных
 * Подсчитывает общее количество покупок (кальянов) для каждого пользователя за все время
 */

const sqlite3 = require('sqlite3').verbose();
const { neon } = require('@neondatabase/serverless');

// Конфигурация
const OLD_DB_PATH = process.argv[3] || 'hookah.db';
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL;

if (!TARGET_DATABASE_URL) {
  console.error('❌ TARGET_DATABASE_URL не настроен');
  process.exit(1);
}

const targetDb = neon(TARGET_DATABASE_URL);

class TotalPurchasesAnalyzer {
  constructor() {
    this.oldDb = null;
    this.targetDb = targetDb;
  }

  /**
   * Подключение к старой SQLite базе данных
   */
  async connectToOldDb() {
    return new Promise((resolve, reject) => {
      this.oldDb = new sqlite3.Database(OLD_DB_PATH, (err) => {
        if (err) {
          console.error('❌ Ошибка подключения к старой базе данных:', err.message);
          reject(err);
        } else {
          console.log('✅ Подключение к старой базе данных успешно');
          resolve();
        }
      });
    });
  }

  /**
   * Проверка подключения к целевой базе данных
   */
  async checkTargetConnection() {
    try {
      await this.targetDb`SELECT 1`;
      console.log('✅ Подключение к целевой базе данных успешно');
      return true;
    } catch (error) {
      console.error('❌ Ошибка подключения к целевой базе данных:', error.message);
      return false;
    }
  }

  /**
   * Анализ общего количества покупок
   */
  async analyzeTotalPurchases() {
    try {
      console.log('🔍 Анализ общего количества покупок из старой базы данных...\n');

      // Получаем всех пользователей из старой базы
      const oldUsers = await this.getOldUsers();
      console.log(`👥 Найдено пользователей в старой базе: ${oldUsers.length}`);

      // Получаем все покупки
      const allPurchases = await this.getAllPurchases();
      console.log(`📊 Найдено покупок в старой базе: ${allPurchases.length}`);

      // Группируем покупки по пользователям
      const purchasesByUser = {};
      allPurchases.forEach(purchase => {
        const tgId = purchase.tg_id;
        if (!purchasesByUser[tgId]) {
          purchasesByUser[tgId] = {
            tg_id: tgId,
            first_name: purchase.first_name,
            last_name: purchase.last_name,
            total_purchases: 0,
            free_purchases: 0,
            regular_purchases: 0
          };
        }
        
        purchasesByUser[tgId].total_purchases++;
        
        if (purchase.is_free === 1) {
          purchasesByUser[tgId].free_purchases++;
        } else {
          purchasesByUser[tgId].regular_purchases++;
        }
      });

      console.log(`\n📈 Статистика покупок:`);
      console.log(`   Всего пользователей с покупками: ${Object.keys(purchasesByUser).length}`);
      
      const totalPurchases = Object.values(purchasesByUser).reduce((sum, user) => sum + user.total_purchases, 0);
      const totalFreePurchases = Object.values(purchasesByUser).reduce((sum, user) => sum + user.free_purchases, 0);
      const totalRegularPurchases = Object.values(purchasesByUser).reduce((sum, user) => sum + user.regular_purchases, 0);
      
      console.log(`   Всего покупок: ${totalPurchases}`);
      console.log(`   Обычных покупок: ${totalRegularPurchases}`);
      console.log(`   Бесплатных покупок: ${totalFreePurchases}`);

      // Показываем топ пользователей
      const topUsers = Object.values(purchasesByUser)
        .sort((a, b) => b.total_purchases - a.total_purchases)
        .slice(0, 20);

      console.log(`\n🏆 Топ 20 пользователей по общему количеству покупок:`);
      topUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (TG: ${user.tg_id})`);
        console.log(`      Всего покупок: ${user.total_purchases}`);
        console.log(`      Обычных: ${user.regular_purchases}, Бесплатных: ${user.free_purchases}`);
        console.log('');
      });

      return purchasesByUser;

    } catch (error) {
      console.error('❌ Ошибка при анализе покупок:', error.message);
      throw error;
    }
  }

  /**
   * Получение пользователей из старой базы
   */
  async getOldUsers() {
    return new Promise((resolve, reject) => {
      this.oldDb.all(`
        SELECT telegram_id as tg_id, first_name, last_name 
        FROM guests 
        ORDER BY telegram_id
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Получение всех покупок из старой базы
   */
  async getAllPurchases() {
    return new Promise((resolve, reject) => {
      this.oldDb.all(`
        SELECT 
          g.telegram_id as tg_id,
          g.first_name,
          g.last_name,
          p.is_free,
          p.created_at
        FROM purchases p
        JOIN guests g ON p.guest_id = g.id
        ORDER BY p.created_at ASC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Обновление данных в целевой базе данных
   */
  async updateTargetDatabase(purchasesByUser) {
    try {
      console.log('🔄 Обновление данных в целевой базе данных...\n');

      let updatedUsers = 0;
      let errors = 0;

      for (const [tgId, userData] of Object.entries(purchasesByUser)) {
        try {
          // Проверяем, есть ли пользователь в целевой базе
          const existingUser = await this.targetDb`
            SELECT id FROM users WHERE tg_id = ${parseInt(tgId)}
          `;

          if (existingUser.length === 0) {
            console.log(`⚠️  Пользователь ${userData.first_name} ${userData.last_name} (TG: ${tgId}) не найден в целевой базе`);
            continue;
          }

          // Обновляем информацию о пользователе (можно добавить поля для общего количества покупок)
          // Пока просто логируем
          console.log(`✅ ${userData.first_name} ${userData.last_name} (TG: ${tgId}):`);
          console.log(`   Всего покупок за все время: ${userData.total_purchases}`);
          console.log(`   Обычных покупок: ${userData.regular_purchases}`);
          console.log(`   Бесплатных покупок: ${userData.free_purchases}`);
          console.log('');

          updatedUsers++;

        } catch (error) {
          console.error(`❌ Ошибка при обновлении пользователя ${tgId}:`, error.message);
          errors++;
        }
      }

      console.log(`\n📊 Результаты обновления:`);
      console.log(`✅ Пользователей обработано: ${updatedUsers}`);
      console.log(`❌ Ошибок: ${errors}`);

    } catch (error) {
      console.error('❌ Ошибка при обновлении целевой базы данных:', error.message);
      throw error;
    }
  }

  /**
   * Создание отчета
   */
  async createReport(purchasesByUser) {
    try {
      const reportData = {
        metadata: {
          generated_at: new Date().toISOString(),
          total_users: Object.keys(purchasesByUser).length,
          total_purchases: Object.values(purchasesByUser).reduce((sum, user) => sum + user.total_purchases, 0),
          total_regular_purchases: Object.values(purchasesByUser).reduce((sum, user) => sum + user.regular_purchases, 0),
          total_free_purchases: Object.values(purchasesByUser).reduce((sum, user) => sum + user.free_purchases, 0)
        },
        users: Object.values(purchasesByUser).sort((a, b) => b.total_purchases - a.total_purchases)
      };

      const filename = `total-purchases-report-${new Date().toISOString().split('T')[0]}.json`;
      require('fs').writeFileSync(filename, JSON.stringify(reportData, null, 2));
      
      console.log(`📄 Отчет создан: ${filename}`);
      return filename;

    } catch (error) {
      console.error('❌ Ошибка при создании отчета:', error.message);
      throw error;
    }
  }

  /**
   * Закрытие соединения с базой данных
   */
  closeConnection() {
    if (this.oldDb) {
      this.oldDb.close((err) => {
        if (err) {
          console.error('❌ Ошибка при закрытии соединения:', err.message);
        } else {
          console.log('✅ Соединение с базой данных закрыто');
        }
      });
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const analyzer = new TotalPurchasesAnalyzer();

  try {
    // Проверяем подключение к целевой базе данных
    const targetConnected = await analyzer.checkTargetConnection();
    if (!targetConnected) {
      process.exit(1);
    }

    // Подключаемся к старой базе данных
    await analyzer.connectToOldDb();

    switch (command) {
      case 'analyze':
        const purchasesData = await analyzer.analyzeTotalPurchases();
        break;
        
      case 'update':
        const purchasesData2 = await analyzer.analyzeTotalPurchases();
        await analyzer.updateTargetDatabase(purchasesData2);
        break;
        
      case 'report':
        const purchasesData3 = await analyzer.analyzeTotalPurchases();
        await analyzer.createReport(purchasesData3);
        break;
        
      case 'help':
      default:
        console.log(`
📊 Скрипт анализа общего количества покупок

Использование:
  node analyze-total-purchases.js <command> [old_db_path]

Команды:
  analyze         - Анализ общего количества покупок
  update          - Обновление данных в целевой базе
  report          - Создание отчета
  help            - Показать эту справку

Переменные окружения:
  TARGET_DATABASE_URL  - URL целевой базы данных (обязательно)

Примеры:
  # Анализ покупок
  TARGET_DATABASE_URL="ваш_url" node analyze-total-purchases.js analyze
  
  # Обновление данных
  TARGET_DATABASE_URL="ваш_url" node analyze-total-purchases.js update
  
  # Создание отчета
  TARGET_DATABASE_URL="ваш_url" node analyze-total-purchases.js report

Логика:
  - Анализирует таблицу purchases из старой базы данных
  - Подсчитывает общее количество покупок для каждого пользователя
  - Разделяет обычные и бесплатные покупки
  - Создает статистику и отчеты
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    analyzer.closeConnection();
  }
}

if (require.main === module) {
  main();
}

module.exports = TotalPurchasesAnalyzer;
