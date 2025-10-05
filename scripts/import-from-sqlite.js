#!/usr/bin/env node
/**
 * Скрипт для импорта данных из SQLite базы данных (.db файл)
 * Специально для работы с базами данных от старых ботов
 */

const { neon } = require('@neondatabase/serverless');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Конфигурация
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!TARGET_DATABASE_URL) {
  console.error('❌ TARGET_DATABASE_URL не настроен');
  process.exit(1);
}

const targetDb = neon(TARGET_DATABASE_URL);

class SQLiteImporter {
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
   * Анализ SQLite базы данных
   */
  async analyzeSQLiteDatabase(dbPath) {
    try {
      if (!fs.existsSync(dbPath)) {
        throw new Error(`Файл базы данных не найден: ${dbPath}`);
      }

      console.log(`🔍 Анализ SQLite базы данных: ${dbPath}`);
      console.log(`📏 Размер файла: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB\n`);

      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Получаем список таблиц
          db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
            if (err) {
              reject(err);
              return;
            }

            console.log('📋 Найденные таблицы:');
            tables.forEach(table => {
              console.log(`   - ${table.name}`);
            });

            // Анализируем каждую таблицу
            this.analyzeTables(db, tables)
              .then(analysis => {
                db.close();
                resolve(analysis);
              })
              .catch(reject);
          });
        });
      });
    } catch (error) {
      console.error('❌ Ошибка при анализе SQLite базы данных:', error.message);
      throw error;
    }
  }

  /**
   * Анализ таблиц в базе данных
   */
  async analyzeTables(db, tables) {
    const analysis = {
      tables: {},
      totalUsers: 0,
      totalStocks: 0,
      totalHookahs: 0
    };

    for (const table of tables) {
      try {
        const tableName = table.name;
        console.log(`\n📊 Анализ таблицы: ${tableName}`);

        // Получаем структуру таблицы
        const schema = await this.getTableSchema(db, tableName);
        console.log(`   Структура: ${schema.map(col => `${col.name}(${col.type})`).join(', ')}`);

        // Получаем количество записей
        const count = await this.getTableCount(db, tableName);
        console.log(`   Записей: ${count}`);

        // Получаем примеры данных
        const samples = await this.getTableSamples(db, tableName, 3);
        if (samples.length > 0) {
          console.log(`   Примеры данных:`);
          samples.forEach((sample, index) => {
            const preview = Object.entries(sample)
              .slice(0, 3)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            console.log(`     ${index + 1}. ${preview}${Object.keys(sample).length > 3 ? '...' : ''}`);
          });
        }

        analysis.tables[tableName] = {
          schema,
          count,
          samples
        };

        // Определяем тип таблицы
        const tableType = this.detectTableType(tableName, schema);
        if (tableType === 'users') analysis.totalUsers = count;
        if (tableType === 'stocks') analysis.totalStocks = count;
        if (tableType === 'hookahs') analysis.totalHookahs = count;

      } catch (error) {
        console.error(`❌ Ошибка при анализе таблицы ${table.name}:`, error.message);
      }
    }

    console.log(`\n📊 Итого найдено:`);
    console.log(`   👥 Пользователей: ${analysis.totalUsers}`);
    console.log(`   📊 Акций: ${analysis.totalStocks}`);
    console.log(`   🎯 Кальянов: ${analysis.totalHookahs}`);

    return analysis;
  }

  /**
   * Получение схемы таблицы
   */
  getTableSchema(db, tableName) {
    return new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Получение количества записей в таблице
   */
  getTableCount(db, tableName) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row.count);
      });
    });
  }

  /**
   * Получение примеров данных из таблицы
   */
  getTableSamples(db, tableName, limit = 3) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName} LIMIT ${limit}`, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Определение типа таблицы
   */
  detectTableType(tableName, schema) {
    const name = tableName.toLowerCase();
    const columns = schema.map(col => col.name.toLowerCase());

    if (name.includes('user') || columns.includes('tg_id') || columns.includes('telegram_id')) {
      return 'users';
    }
    if (name.includes('stock') || name.includes('progress') || columns.includes('stock_name')) {
      return 'stocks';
    }
    if (name.includes('hookah') || name.includes('free') || columns.includes('used')) {
      return 'hookahs';
    }
    return 'unknown';
  }

  /**
   * Импорт данных из SQLite базы данных
   */
  async importFromSQLite(dbPath) {
    try {
      console.log(`🔄 Импорт данных из SQLite базы: ${dbPath}`);
      
      // Создаем резервную копию
      await this.createBackup();

      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, async (err) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Получаем все таблицы
            const tables = await this.getTables(db);
            console.log(`📋 Найдено таблиц: ${tables.length}`);

            let importedUsers = 0;
            let skippedUsers = 0;
            let errors = 0;
            const userMapping = new Map(); // Старый ID -> Новый ID

            // Импортируем пользователей
            for (const table of tables) {
              const tableType = this.detectTableType(table.name, await this.getTableSchema(db, table.name));
              
              if (tableType === 'users') {
                console.log(`\n👥 Импорт пользователей из таблицы: ${table.name}`);
                const result = await this.importUsersFromTable(db, table.name, userMapping);
                importedUsers += result.imported;
                skippedUsers += result.skipped;
                errors += result.errors;
              }
            }

            // Импортируем акции
            let importedStocks = 0;
            for (const table of tables) {
              const tableType = this.detectTableType(table.name, await this.getTableSchema(db, table.name));
              
              if (tableType === 'stocks') {
                console.log(`\n📊 Импорт акций из таблицы: ${table.name}`);
                importedStocks += await this.importStocksFromTable(db, table.name, userMapping);
              }
            }

            // Импортируем кальяны
            let importedHookahs = 0;
            for (const table of tables) {
              const tableType = this.detectTableType(table.name, await this.getTableSchema(db, table.name));
              
              if (tableType === 'hookahs') {
                console.log(`\n🎯 Импорт кальянов из таблицы: ${table.name}`);
                importedHookahs += await this.importHookahsFromTable(db, table.name, userMapping);
              }
            }

            console.log('\n📊 Результаты импорта:');
            console.log(`✅ Пользователей импортировано: ${importedUsers}`);
            console.log(`⚠️  Пользователей пропущено: ${skippedUsers}`);
            console.log(`❌ Ошибок: ${errors}`);
            console.log(`📊 Акций импортировано: ${importedStocks}`);
            console.log(`🎯 Кальянов импортировано: ${importedHookahs}`);

            db.close();
            resolve({
              users: { imported: importedUsers, skipped: skippedUsers, errors },
              stocks: { imported: importedStocks },
              hookahs: { imported: importedHookahs }
            });

          } catch (error) {
            db.close();
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('❌ Ошибка при импорте из SQLite:', error.message);
      throw error;
    }
  }

  /**
   * Получение списка таблиц
   */
  getTables(db) {
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(tables);
      });
    });
  }

  /**
   * Импорт пользователей из таблицы
   */
  async importUsersFromTable(db, tableName, userMapping) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName}`, async (err, users) => {
        if (err) {
          reject(err);
          return;
        }

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const user of users) {
          try {
            const mappedUser = this.mapUserData(user);
            if (!mappedUser) {
              console.log(`⚠️  Пропускаем пользователя с неполными данными`);
              skipped++;
              continue;
            }

            console.log(`👤 Импорт пользователя: ${mappedUser.first_name} ${mappedUser.last_name} (TG ID: ${mappedUser.tg_id})`);
            
            // Проверяем, существует ли пользователь
            const existingUser = await this.targetDb`
              SELECT id FROM users WHERE tg_id = ${mappedUser.tg_id} LIMIT 1
            `;
            
            if (existingUser.length > 0) {
              console.log(`⚠️  Пользователь уже существует, пропускаем`);
              skipped++;
              continue;
            }

            // Создаем пользователя
            const [newUser] = await this.targetDb`
              INSERT INTO users (tg_id, first_name, last_name, phone, username, created_at, updated_at)
              VALUES (${mappedUser.tg_id}, ${mappedUser.first_name}, ${mappedUser.last_name}, ${mappedUser.phone}, ${mappedUser.username}, ${mappedUser.created_at}, ${mappedUser.updated_at})
              RETURNING id
            `;
            
            const newUserId = newUser.id;
            userMapping.set(user.id, newUserId);
            console.log(`✅ Пользователь создан с ID: ${newUserId}`);

            imported++;
            
          } catch (error) {
            console.error(`❌ Ошибка при импорте пользователя:`, error.message);
            errors++;
          }
        }

        resolve({ imported, skipped, errors });
      });
    });
  }

  /**
   * Импорт акций из таблицы
   */
  async importStocksFromTable(db, tableName, userMapping) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName}`, async (err, stocks) => {
        if (err) {
          reject(err);
          return;
        }

        let imported = 0;

        for (const stock of stocks) {
          try {
            const newUserId = userMapping.get(stock.user_id);
            if (!newUserId) {
              console.log(`⚠️  Пропускаем акцию для несуществующего пользователя`);
              continue;
            }

            await this.targetDb`
              INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
              VALUES (${newUserId}, ${stock.stock_name || stock.name || 'Акция'}, ${stock.progress || 0}, ${stock.created_at || new Date()}, ${stock.updated_at || new Date()})
            `;
            imported++;
          } catch (error) {
            console.error(`❌ Ошибка при импорте акции:`, error.message);
          }
        }

        resolve(imported);
      });
    });
  }

  /**
   * Импорт кальянов из таблицы
   */
  async importHookahsFromTable(db, tableName, userMapping) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName}`, async (err, hookahs) => {
        if (err) {
          reject(err);
          return;
        }

        let imported = 0;

        for (const hookah of hookahs) {
          try {
            const newUserId = userMapping.get(hookah.user_id);
            if (!newUserId) {
              console.log(`⚠️  Пропускаем кальян для несуществующего пользователя`);
              continue;
            }

            await this.targetDb`
              INSERT INTO free_hookahs (user_id, used, used_at, created_at)
              VALUES (${newUserId}, ${hookah.used || hookah.is_used || false}, ${hookah.used_at || null}, ${hookah.created_at || new Date()})
            `;
            imported++;
          } catch (error) {
            console.error(`❌ Ошибка при импорте кальяна:`, error.message);
          }
        }

        resolve(imported);
      });
    });
  }

  /**
   * Преобразование данных пользователя в нужный формат
   */
  mapUserData(user) {
    try {
      // Различные варианты полей от старого бота
      const tgId = user.tg_id || user.telegram_id || user.user_id || user.id;
      const firstName = user.first_name || user.firstName || user.name || user.firstname;
      const lastName = user.last_name || user.lastName || user.surname || user.lastname;
      const phone = user.phone || user.phone_number || user.telephone;
      const username = user.username || user.telegram_username || user.tg_username;

      if (!tgId || !firstName || !lastName || !phone) {
        console.log(`⚠️  Неполные данные пользователя:`, user);
        return null;
      }

      return {
        tg_id: parseInt(tgId),
        first_name: String(firstName).trim(),
        last_name: String(lastName).trim(),
        phone: String(phone).trim(),
        username: username ? String(username).trim() : null,
        created_at: user.created_at || user.createdAt || new Date(),
        updated_at: user.updated_at || user.updatedAt || new Date()
      };
    } catch (error) {
      console.error('❌ Ошибка при преобразовании данных пользователя:', error.message);
      return null;
    }
  }

  /**
   * Создание резервной копии перед импортом
   */
  async createBackup() {
    try {
      console.log('🔄 Создание резервной копии перед импортом...');
      
      // Экспортируем данные напрямую
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
          exported_by: 'SQLiteImporter',
          version: '1.0',
          total_users: users.length,
          total_stocks: stocks.length,
          total_hookahs: freeHookahs.length
        },
        users: users,
        stocks: stocks,
        free_hookahs: freeHookahs
      };
      
      const backupFilename = `backup-before-sqlite-import-${new Date().toISOString().split('T')[0]}.json`;
      
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
  const importer = new SQLiteImporter();

  try {
    // Проверяем подключение к целевой базе
    await importer.checkTargetConnection();

    switch (command) {
      case 'analyze':
        if (!dbPath) {
          console.error('❌ Укажите путь к .db файлу');
          process.exit(1);
        }
        await importer.analyzeSQLiteDatabase(dbPath);
        break;
        
      case 'import':
        if (!dbPath) {
          console.error('❌ Укажите путь к .db файлу');
          process.exit(1);
        }
        await importer.importFromSQLite(dbPath);
        break;
        
      case 'backup':
        await importer.createBackup();
        break;
        
      case 'help':
      default:
        console.log(`
📥 Скрипт импорта данных из SQLite базы данных (.db файл)

Использование:
  node import-from-sqlite.js <command> [db_path]

Команды:
  analyze <db_path>  - Анализ SQLite базы данных
  import <db_path>   - Импорт данных из SQLite базы
  backup             - Создать резервную копию
  help               - Показать эту справку

Переменные окружения:
  TARGET_DATABASE_URL  - URL целевой базы данных (обязательно)

Примеры:
  # Анализ SQLite базы данных
  TARGET_DATABASE_URL="ваш_url" node import-from-sqlite.js analyze old-bot.db
  
  # Импорт из SQLite базы данных
  TARGET_DATABASE_URL="ваш_url" node import-from-sqlite.js import old-bot.db
  
  # Создать резервную копию
  TARGET_DATABASE_URL="ваш_url" node import-from-sqlite.js backup

Что анализируется:
  - Структура таблиц
  - Количество записей в каждой таблице
  - Примеры данных
  - Автоматическое определение типов таблиц

Что импортируется:
  - Пользователи (таблицы с tg_id, telegram_id, user_id)
  - Акции (таблицы с stock_name, progress)
  - Кальяны (таблицы с used, free_hookah)

Поддерживаемые поля пользователей:
  - tg_id, telegram_id, user_id, id
  - first_name, firstName, name, firstname
  - last_name, lastName, surname, lastname
  - phone, phone_number, telephone
  - username, telegram_username, tg_username
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

module.exports = SQLiteImporter;
