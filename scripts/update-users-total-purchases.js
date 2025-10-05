#!/usr/bin/env node
/**
 * Скрипт для обновления данных пользователей с информацией об общем количестве покупок
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

class TotalPurchasesUpdater {
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
   * Получение данных о покупках из старой базы
   */
  async getPurchasesData() {
    try {
      console.log('🔍 Получение данных о покупках из старой базы данных...\n');

      // Получаем все покупки с информацией о пользователях
      const purchases = await this.getAllPurchases();
      console.log(`📊 Найдено покупок: ${purchases.length}`);

      // Группируем покупки по пользователям
      const purchasesByUser = {};
      purchases.forEach(purchase => {
        const tgId = purchase.tg_id;
        if (!purchasesByUser[tgId]) {
          purchasesByUser[tgId] = {
            tg_id: tgId,
            first_name: purchase.first_name,
            last_name: purchase.last_name,
            total_purchases: 0,
            total_regular_purchases: 0,
            total_free_purchases: 0
          };
        }
        
        purchasesByUser[tgId].total_purchases++;
        
        if (purchase.is_free === 1) {
          purchasesByUser[tgId].total_free_purchases++;
        } else {
          purchasesByUser[tgId].total_regular_purchases++;
        }
      });

      console.log(`👥 Пользователей с покупками: ${Object.keys(purchasesByUser).length}`);
      return purchasesByUser;

    } catch (error) {
      console.error('❌ Ошибка при получении данных о покупках:', error.message);
      throw error;
    }
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
   * Обновление данных пользователей в целевой базе
   */
  async updateUsersData(purchasesByUser) {
    try {
      console.log('🔄 Обновление данных пользователей...\n');

      let updatedUsers = 0;
      let notFoundUsers = 0;
      let errors = 0;

      for (const [tgId, userData] of Object.entries(purchasesByUser)) {
        try {
          // Проверяем, есть ли пользователь в целевой базе
          const existingUser = await this.targetDb`
            SELECT id, first_name, last_name FROM users WHERE tg_id = ${parseInt(tgId)}
          `;

          if (existingUser.length === 0) {
            console.log(`⚠️  Пользователь ${userData.first_name} ${userData.last_name} (TG: ${tgId}) не найден в целевой базе`);
            notFoundUsers++;
            continue;
          }

          // Обновляем данные пользователя
          await this.targetDb`
            UPDATE users 
            SET 
              total_purchases = ${userData.total_purchases},
              total_regular_purchases = ${userData.total_regular_purchases},
              total_free_purchases = ${userData.total_free_purchases},
              updated_at = NOW()
            WHERE tg_id = ${parseInt(tgId)}
          `;

          console.log(`✅ ${userData.first_name} ${userData.last_name} (TG: ${tgId}):`);
          console.log(`   Всего покупок: ${userData.total_purchases}`);
          console.log(`   Обычных: ${userData.total_regular_purchases}, Бесплатных: ${userData.total_free_purchases}`);
          console.log('');

          updatedUsers++;

        } catch (error) {
          console.error(`❌ Ошибка при обновлении пользователя ${tgId}:`, error.message);
          errors++;
        }
      }

      console.log(`\n📊 Результаты обновления:`);
      console.log(`✅ Пользователей обновлено: ${updatedUsers}`);
      console.log(`⚠️  Пользователей не найдено: ${notFoundUsers}`);
      console.log(`❌ Ошибок: ${errors}`);

      return { updatedUsers, notFoundUsers, errors };

    } catch (error) {
      console.error('❌ Ошибка при обновлении данных пользователей:', error.message);
      throw error;
    }
  }

  /**
   * Показать статистику обновленных данных
   */
  async showUpdatedStatistics() {
    try {
      console.log('\n📈 Статистика обновленных данных:');

      // Общая статистика
      const totalStats = await this.targetDb`
        SELECT 
          COUNT(*) as total_users,
          SUM(total_purchases) as total_purchases,
          SUM(total_regular_purchases) as total_regular_purchases,
          SUM(total_free_purchases) as total_free_purchases
        FROM users
      `;

      const stats = totalStats[0];
      console.log(`   Всего пользователей: ${stats.total_users}`);
      console.log(`   Всего покупок: ${stats.total_purchases || 0}`);
      console.log(`   Обычных покупок: ${stats.total_regular_purchases || 0}`);
      console.log(`   Бесплатных покупок: ${stats.total_free_purchases || 0}`);

      // Топ пользователей по общему количеству покупок
      const topUsers = await this.targetDb`
        SELECT 
          first_name, last_name, tg_id,
          total_purchases, total_regular_purchases, total_free_purchases
        FROM users 
        WHERE total_purchases > 0
        ORDER BY total_purchases DESC 
        LIMIT 10
      `;

      console.log(`\n🏆 Топ 10 пользователей по общему количеству покупок:`);
      topUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (TG: ${user.tg_id})`);
        console.log(`      Всего: ${user.total_purchases}, Обычных: ${user.total_regular_purchases}, Бесплатных: ${user.total_free_purchases}`);
      });

    } catch (error) {
      console.error('❌ Ошибка при получении статистики:', error.message);
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
  const updater = new TotalPurchasesUpdater();

  try {
    // Проверяем подключение к целевой базе данных
    const targetConnected = await updater.checkTargetConnection();
    if (!targetConnected) {
      process.exit(1);
    }

    // Подключаемся к старой базе данных
    await updater.connectToOldDb();

    switch (command) {
      case 'update':
        const purchasesData = await updater.getPurchasesData();
        const results = await updater.updateUsersData(purchasesData);
        await updater.showUpdatedStatistics();
        break;
        
      case 'stats':
        await updater.showUpdatedStatistics();
        break;
        
      case 'help':
      default:
        console.log(`
📊 Скрипт обновления данных пользователей с общим количеством покупок

Использование:
  node update-users-total-purchases.js <command> [old_db_path]

Команды:
  update          - Обновить данные пользователей
  stats           - Показать статистику обновленных данных
  help            - Показать эту справку

Переменные окружения:
  TARGET_DATABASE_URL  - URL целевой базы данных (обязательно)

Примеры:
  # Обновить данные пользователей
  TARGET_DATABASE_URL="ваш_url" node update-users-total-purchases.js update
  
  # Показать статистику
  TARGET_DATABASE_URL="ваш_url" node update-users-total-purchases.js stats

Логика:
  - Анализирует таблицу purchases из старой базы данных
  - Подсчитывает общее количество покупок для каждого пользователя
  - Обновляет поля total_purchases, total_regular_purchases, total_free_purchases
  - Показывает статистику обновленных данных
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  } finally {
    updater.closeConnection();
  }
}

if (require.main === module) {
  main();
}

module.exports = TotalPurchasesUpdater;
