#!/usr/bin/env node
/**
 * Скрипт для импорта данных в базу данных
 * Поддерживает импорт из JSON файлов экспорта
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

class DataImporter {
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
   * Импорт данных из JSON файла
   */
  async importFromFile(filename) {
    try {
      if (!fs.existsSync(filename)) {
        throw new Error(`Файл не найден: ${filename}`);
      }

      console.log(`🔄 Импорт данных из файла: ${filename}`);
      
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      
      if (!data.users || !Array.isArray(data.users)) {
        throw new Error('Неверный формат файла: отсутствуют данные пользователей');
      }

      console.log(`📊 Найдено пользователей для импорта: ${data.users.length}`);
      
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      // Импорт пользователей
      for (const user of data.users) {
        try {
          console.log(`👤 Импорт пользователя: ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id})`);
          
          // Проверяем, существует ли пользователь
          const existingUser = await this.db`
            SELECT id FROM users WHERE tg_id = ${user.tg_id} LIMIT 1
          `;
          
          if (existingUser.length > 0) {
            console.log(`⚠️  Пользователь уже существует, пропускаем`);
            skipped++;
            continue;
          }

          // Создаем пользователя
          const [newUser] = await this.db`
            INSERT INTO users (tg_id, first_name, last_name, phone, username, created_at, updated_at)
            VALUES (${user.tg_id}, ${user.first_name}, ${user.last_name}, ${user.phone}, ${user.username}, ${user.created_at}, ${user.updated_at})
            RETURNING id
          `;
          
          const userId = newUser.id;
          console.log(`✅ Пользователь создан с ID: ${userId}`);

          // Импортируем акции пользователя
          if (data.stocks) {
            const userStocks = data.stocks.filter(stock => stock.user_id === user.id);
            for (const stock of userStocks) {
              await this.db`
                INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
                VALUES (${userId}, ${stock.stock_name}, ${stock.progress}, ${stock.created_at}, ${stock.updated_at})
              `;
            }
            console.log(`📊 Импортировано акций: ${userStocks.length}`);
          }

          // Импортируем кальяны пользователя
          if (data.free_hookahs) {
            const userHookahs = data.free_hookahs.filter(hookah => hookah.user_id === user.id);
            for (const hookah of userHookahs) {
              await this.db`
                INSERT INTO free_hookahs (user_id, used, used_at, created_at)
                VALUES (${userId}, ${hookah.used}, ${hookah.used_at}, ${hookah.created_at})
              `;
            }
            console.log(`🎯 Импортировано кальянов: ${userHookahs.length}`);
          }

          imported++;
          
        } catch (error) {
          console.error(`❌ Ошибка при импорте пользователя ${user.tg_id}:`, error.message);
          errors++;
        }
      }

      console.log('\n📊 Результаты импорта:');
      console.log(`✅ Импортировано: ${imported}`);
      console.log(`⚠️  Пропущено: ${skipped}`);
      console.log(`❌ Ошибок: ${errors}`);
      
      return { imported, skipped, errors };
      
    } catch (error) {
      console.error('❌ Ошибка при импорте данных:', error.message);
      throw error;
    }
  }

  /**
   * Импорт данных пользователя из JSON файла
   */
  async importUserFromFile(filename) {
    try {
      if (!fs.existsSync(filename)) {
        throw new Error(`Файл не найден: ${filename}`);
      }

      console.log(`🔄 Импорт данных пользователя из файла: ${filename}`);
      
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      
      if (!data.user) {
        throw new Error('Неверный формат файла: отсутствуют данные пользователя');
      }

      const user = data.user;
      console.log(`👤 Импорт пользователя: ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id})`);
      
      // Проверяем, существует ли пользователь
      const existingUser = await this.db`
        SELECT id FROM users WHERE tg_id = ${user.tg_id} LIMIT 1
      `;
      
      if (existingUser.length > 0) {
        console.log(`⚠️  Пользователь уже существует, пропускаем`);
        return { imported: 0, skipped: 1, errors: 0 };
      }

      // Создаем пользователя
      const [newUser] = await this.db`
        INSERT INTO users (tg_id, first_name, last_name, phone, username, created_at, updated_at)
        VALUES (${user.tg_id}, ${user.first_name}, ${user.last_name}, ${user.phone}, ${user.username}, ${user.created_at}, ${user.updated_at})
        RETURNING id
      `;
      
      const userId = newUser.id;
      console.log(`✅ Пользователь создан с ID: ${userId}`);

      // Импортируем акции пользователя
      if (data.stocks && Array.isArray(data.stocks)) {
        for (const stock of data.stocks) {
          await this.db`
            INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
            VALUES (${userId}, ${stock.stock_name}, ${stock.progress}, ${stock.created_at}, ${stock.updated_at})
          `;
        }
        console.log(`📊 Импортировано акций: ${data.stocks.length}`);
      }

      // Импортируем кальяны пользователя
      if (data.free_hookahs && Array.isArray(data.free_hookahs)) {
        for (const hookah of data.free_hookahs) {
          await this.db`
            INSERT INTO free_hookahs (user_id, used, used_at, created_at)
            VALUES (${userId}, ${hookah.used}, ${hookah.used_at}, ${hookah.created_at})
          `;
        }
        console.log(`🎯 Импортировано кальянов: ${data.free_hookahs.length}`);
      }

      console.log('✅ Данные пользователя успешно импортированы');
      return { imported: 1, skipped: 0, errors: 0 };
      
    } catch (error) {
      console.error('❌ Ошибка при импорте данных пользователя:', error.message);
      throw error;
    }
  }

  /**
   * Создание резервной копии перед импортом
   */
  async createBackup() {
    try {
      console.log('🔄 Создание резервной копии...');
      
      const { DataExporter } = require('./export-all-data.js');
      const exporter = new DataExporter();
      
      const data = await exporter.exportAllData();
      const backupFilename = `backup-before-import-${new Date().toISOString().split('T')[0]}.json`;
      
      fs.writeFileSync(backupFilename, JSON.stringify(data, null, 2));
      console.log(`✅ Резервная копия создана: ${backupFilename}`);
      
      return backupFilename;
    } catch (error) {
      console.error('❌ Ошибка при создании резервной копии:', error.message);
      throw error;
    }
  }

  /**
   * Очистка базы данных (ОСТОРОЖНО!)
   */
  async clearDatabase() {
    try {
      console.log('⚠️  ВНИМАНИЕ: Это удалит ВСЕ данные из базы!');
      console.log('Для продолжения введите "YES" в течение 10 секунд...');
      
      // Простая проверка (в реальном приложении лучше использовать readline)
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve, reject) => {
        rl.question('Введите YES для подтверждения: ', (answer) => {
          rl.close();
          
          if (answer !== 'YES') {
            console.log('❌ Операция отменена');
            resolve(false);
            return;
          }

          this.db`
            DELETE FROM free_hookahs;
            DELETE FROM stocks;
            DELETE FROM users;
          `.then(() => {
            console.log('✅ База данных очищена');
            resolve(true);
          }).catch(reject);
        });
      });
      
    } catch (error) {
      console.error('❌ Ошибка при очистке базы данных:', error.message);
      throw error;
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const filename = process.argv[3];
  const importer = new DataImporter();

  try {
    // Проверяем подключение
    const connected = await importer.checkConnection();
    if (!connected) {
      process.exit(1);
    }

    switch (command) {
      case 'import':
        if (!filename) {
          console.error('❌ Укажите путь к файлу для импорта');
          process.exit(1);
        }
        await importer.importFromFile(filename);
        break;
        
      case 'import-user':
        if (!filename) {
          console.error('❌ Укажите путь к файлу пользователя для импорта');
          process.exit(1);
        }
        await importer.importUserFromFile(filename);
        break;
        
      case 'backup':
        await importer.createBackup();
        break;
        
      case 'clear':
        await importer.clearDatabase();
        break;
        
      case 'help':
      default:
        console.log(`
📥 Скрипт импорта данных

Использование:
  node import-data.js <command> [filename]

Команды:
  import <file>        - Импорт всех данных из JSON файла
  import-user <file>   - Импорт данных пользователя из JSON файла
  backup              - Создать резервную копию перед импортом
  clear               - Очистить базу данных (ОСТОРОЖНО!)
  help                - Показать эту справку

Примеры:
  # Импорт всех данных
  node import-data.js import full-export-2025-10-05.json
  
  # Импорт пользователя
  node import-data.js import-user user-123456789-export-2025-10-05.json
  
  # Создать резервную копию
  node import-data.js backup
  
  # Очистить базу (ОСТОРОЖНО!)
  node import-data.js clear

Примечание:
  - Перед импортом рекомендуется создать резервную копию
  - Существующие пользователи с тем же TG ID будут пропущены
  - Импорт можно выполнять несколько раз безопасно
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

module.exports = DataImporter;

