#!/usr/bin/env node
/**
 * Скрипт для импорта кальянов из таблицы purchases старой базы данных
 * Логика: если покупка бесплатная (is_free = true), то это кальян
 * Количество кальянов = количество бесплатных покупок
 */

const { neon } = require('@neondatabase/serverless');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Конфигурация
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!TARGET_DATABASE_URL) {
  console.error('❌ TARGET_DATABASE_URL не настроен');
  process.exit(1);
}

const targetDb = neon(TARGET_DATABASE_URL);

class HookahImporter {
  constructor() {
    this.targetDb = targetDb;
  }

  /**
   * Проверка подключения к целевой базе данных
   */
  async checkTargetConnection() {
    try {
      await this.targetDb`SELECT 1`;
      console.log('✅ Target database: подключено');
      return true;
    } catch (error) {
      console.log('❌ Target database: ошибка подключения');
      throw error;
    }
  }

  /**
   * Анализ таблицы purchases в SQLite
   */
  async analyzePurchases(dbPath) {
    try {
      console.log(`🔍 Анализ таблицы purchases в ${dbPath}...`);
      
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Анализируем бесплатные покупки (кальяны)
          db.all(`
            SELECT 
              p.id,
              p.guest_id,
              p.admin_id,
              p.is_free,
              p.created_at,
              p.rating,
              p.rating_comment,
              g.telegram_id,
              g.first_name,
              g.last_name
            FROM purchases p
            LEFT JOIN guests g ON p.guest_id = g.id
            WHERE p.is_free = 1
            ORDER BY p.created_at ASC
          `, (err, freePurchases) => {
            if (err) {
              reject(err);
              return;
            }

            console.log(`📊 Найдено бесплатных покупок (кальянов): ${freePurchases.length}`);

            // Группируем по пользователям
            const userHookahs = {};
            freePurchases.forEach(purchase => {
              if (purchase.guest_id && purchase.telegram_id) {
                if (!userHookahs[purchase.telegram_id]) {
                  userHookahs[purchase.telegram_id] = {
                    telegram_id: purchase.telegram_id,
                    first_name: purchase.first_name,
                    last_name: purchase.last_name,
                    hookahs: []
                  };
                }
                userHookahs[purchase.telegram_id].hookahs.push(purchase);
              }
            });

            console.log(`👥 Пользователей с кальянами: ${Object.keys(userHookahs).length}`);

            // Показываем статистику по пользователям
            Object.values(userHookahs).forEach(user => {
              console.log(`   ${user.first_name} ${user.last_name} (TG: ${user.telegram_id}): ${user.hookahs.length} кальянов`);
            });

            db.close();
            resolve({
              totalFreePurchases: freePurchases.length,
              usersWithHookahs: Object.keys(userHookahs).length,
              userHookahs: userHookahs
            });
          });
        });
      });
    } catch (error) {
      console.error('❌ Ошибка при анализе purchases:', error.message);
      throw error;
    }
  }

  /**
   * Импорт кальянов из таблицы purchases
   */
  async importHookahsFromPurchases(dbPath) {
    try {
      console.log(`🔄 Импорт кальянов из ${dbPath}...`);
      
      // Создаем резервную копию
      await this.createBackup();

      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, async (err) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Получаем все бесплатные покупки (кальяны)
            const freePurchases = await this.getFreePurchases(db);
            console.log(`📊 Найдено бесплатных покупок: ${freePurchases.length}`);

            // Группируем по пользователям
            const userHookahs = this.groupHookahsByUser(freePurchases);
            console.log(`👥 Пользователей с кальянами: ${Object.keys(userHookahs).length}`);

            let importedHookahs = 0;
            let skippedUsers = 0;
            let errors = 0;

            // Импортируем кальяны для каждого пользователя
            for (const [telegramId, userData] of Object.entries(userHookahs)) {
              try {
                console.log(`\n👤 Обработка пользователя: ${userData.first_name} ${userData.last_name} (TG: ${telegramId})`);
                
                // Находим пользователя в целевой базе
                const users = await this.targetDb`
                  SELECT id FROM users WHERE tg_id = ${parseInt(telegramId)} LIMIT 1
                `;
                
                if (users.length === 0) {
                  console.log(`⚠️  Пользователь не найден в целевой базе, пропускаем`);
                  skippedUsers++;
                  continue;
                }

                const userId = users[0].id;
                console.log(`✅ Пользователь найден с ID: ${userId}`);

                // Удаляем существующие кальяны пользователя
                await this.targetDb`
                  DELETE FROM free_hookahs WHERE user_id = ${userId}
                `;
                console.log(`🗑️  Удалены существующие кальяны пользователя`);

                // Импортируем кальяны
                for (const hookah of userData.hookahs) {
                  const isUsed = hookah.rating !== null && hookah.rating > 0; // Если есть рейтинг, значит использован
                  
                  await this.targetDb`
                    INSERT INTO free_hookahs (user_id, used, used_at, created_at)
                    VALUES (${userId}, ${isUsed}, ${isUsed ? hookah.created_at : null}, ${hookah.created_at})
                  `;
                  importedHookahs++;
                }

                console.log(`🎯 Импортировано кальянов: ${userData.hookahs.length}`);

              } catch (error) {
                console.error(`❌ Ошибка при импорте кальянов для пользователя ${telegramId}:`, error.message);
                errors++;
              }
            }

            console.log('\n📊 Результаты импорта кальянов:');
            console.log(`✅ Кальянов импортировано: ${importedHookahs}`);
            console.log(`⚠️  Пользователей пропущено: ${skippedUsers}`);
            console.log(`❌ Ошибок: ${errors}`);

            db.close();
            resolve({
              imported: importedHookahs,
              skipped: skippedUsers,
              errors: errors
            });

          } catch (error) {
            db.close();
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Ошибка при импорте кальянов:', error.message);
      throw error;
    }
  }

  /**
   * Получение бесплатных покупок из SQLite
   */
  getFreePurchases(db) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          p.id,
          p.guest_id,
          p.admin_id,
          p.is_free,
          p.created_at,
          p.rating,
          p.rating_comment,
          g.telegram_id,
          g.first_name,
          g.last_name
        FROM purchases p
        LEFT JOIN guests g ON p.guest_id = g.id
        WHERE p.is_free = 1 AND g.telegram_id IS NOT NULL
        ORDER BY p.created_at ASC
      `, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Группировка кальянов по пользователям
   */
  groupHookahsByUser(freePurchases) {
    const userHookahs = {};
    
    freePurchases.forEach(purchase => {
      if (purchase.guest_id && purchase.telegram_id) {
        if (!userHookahs[purchase.telegram_id]) {
          userHookahs[purchase.telegram_id] = {
            telegram_id: purchase.telegram_id,
            first_name: purchase.first_name,
            last_name: purchase.last_name,
            hookahs: []
          };
        }
        userHookahs[purchase.telegram_id].hookahs.push(purchase);
      }
    });

    return userHookahs;
  }

  /**
   * Создание резервной копии перед импортом
   */
  async createBackup() {
    try {
      console.log('🔄 Создание резервной копии перед импортом кальянов...');
      
      const users = await this.targetDb`
        SELECT 
          id, tg_id, first_name, last_name, phone, username, 
          created_at, updated_at
        FROM users 
        ORDER BY created_at ASC
      `;

      const stocks = await this.targetDb`
        SELECT 
          s.id, s.user_id, s.stock_name, s.progress, s.created_at, s.updated_at,
          u.tg_id as user_tg_id
        FROM stocks s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at ASC
      `;

      const freeHookahs = await this.targetDb`
        SELECT 
          fh.id, fh.user_id, fh.used, fh.used_at, fh.created_at,
          u.tg_id as user_tg_id
        FROM free_hookahs fh
        JOIN users u ON fh.user_id = u.id
        ORDER BY fh.created_at ASC
      `;

      const backupData = {
        metadata: {
          exported_at: new Date().toISOString(),
          exported_by: 'HookahImporter',
          version: '1.0',
          total_users: users.length,
          total_stocks: stocks.length,
          total_hookahs: freeHookahs.length
        },
        users: users,
        stocks: stocks,
        free_hookahs: freeHookahs
      };
      
      const backupFilename = `backup-before-hookah-import-${new Date().toISOString().split('T')[0]}.json`;
      
      fs.writeFileSync(backupFilename, JSON.stringify(backupData, null, 2));
      console.log(`✅ Резервная копия создана: ${backupFilename}`);
      console.log(`📊 Пользователей: ${users.length}, Акций: ${stocks.length}, Кальянов: ${freeHookahs.length}`);
      
      return backupFilename;
    } catch (error) {
      console.error('❌ Ошибка при создании резервной копии:', error.message);
      throw error;
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const dbPath = process.argv[3];
  const importer = new HookahImporter();

  try {
    // Проверяем подключение к целевой базе
    await importer.checkTargetConnection();

    switch (command) {
      case 'analyze':
        if (!dbPath) {
          console.error('❌ Укажите путь к .db файлу');
          process.exit(1);
        }
        await importer.analyzePurchases(dbPath);
        break;
        
      case 'import':
        if (!dbPath) {
          console.error('❌ Укажите путь к .db файлу');
          process.exit(1);
        }
        await importer.importHookahsFromPurchases(dbPath);
        break;
        
      case 'backup':
        await importer.createBackup();
        break;
        
      case 'help':
      default:
        console.log(`
🎯 Скрипт импорта кальянов из таблицы purchases

Использование:
  node import-hookahs-from-purchases.js <command> [db_path]

Команды:
  analyze <db_path>  - Анализ таблицы purchases (бесплатные покупки)
  import <db_path>   - Импорт кальянов из purchases
  backup             - Создать резервную копию
  help               - Показать эту справку

Переменные окружения:
  TARGET_DATABASE_URL  - URL целевой базы данных (обязательно)

Примеры:
  # Анализ purchases
  TARGET_DATABASE_URL="ваш_url" node import-hookahs-from-purchases.js analyze hookah.db
  
  # Импорт кальянов
  TARGET_DATABASE_URL="ваш_url" node import-hookahs-from-purchases.js import hookah.db
  
  # Создать резервную копию
  TARGET_DATABASE_URL="ваш_url" node import-hookahs-from-purchases.js backup

Логика работы:
  - Бесплатные покупки (is_free = 1) = кальяны
  - Количество кальянов = количество бесплатных покупок
  - Если есть рейтинг (rating > 0), то кальян использован
  - Существующие кальяны пользователя удаляются перед импортом
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

module.exports = HookahImporter;
