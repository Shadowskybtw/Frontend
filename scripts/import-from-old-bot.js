#!/usr/bin/env node
/**
 * Скрипт для импорта данных из старого бота в текущую базу данных
 * Поддерживает различные форматы данных от старого бота
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Конфигурация
const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL;

if (!TARGET_DATABASE_URL) {
  console.error('❌ TARGET_DATABASE_URL не настроен');
  process.exit(1);
}

const targetDb = neon(TARGET_DATABASE_URL);
const oldDb = OLD_DATABASE_URL ? neon(OLD_DATABASE_URL) : null;

class OldBotImporter {
  constructor() {
    this.targetDb = targetDb;
    this.oldDb = oldDb;
  }

  /**
   * Проверка подключений к базам данных
   */
  async checkConnections() {
    console.log('🔍 Проверка подключений к базам данных...');
    
    try {
      await this.targetDb`SELECT 1`;
      console.log('✅ Target database: подключено');
    } catch (error) {
      console.log('❌ Target database: ошибка подключения');
      throw error;
    }
    
    if (this.oldDb) {
      try {
        await this.oldDb`SELECT 1`;
        console.log('✅ Old database: подключено');
      } catch (error) {
        console.log('❌ Old database: ошибка подключения');
        throw error;
      }
    } else {
      console.log('⚠️  Old database: не настроено (будет использоваться файловый импорт)');
    }
  }

  /**
   * Импорт из JSON файла (универсальный)
   */
  async importFromJSONFile(filename) {
    try {
      if (!fs.existsSync(filename)) {
        throw new Error(`Файл не найден: ${filename}`);
      }

      console.log(`🔄 Импорт данных из JSON файла: ${filename}`);
      
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      
      // Определяем формат данных
      const format = this.detectDataFormat(data);
      console.log(`📋 Обнаружен формат данных: ${format}`);
      
      let users = [];
      let stocks = [];
      let hookahs = [];

      switch (format) {
        case 'full_export':
          users = data.users || [];
          stocks = data.stocks || [];
          hookahs = data.free_hookahs || [];
          break;
          
        case 'users_array':
          users = Array.isArray(data) ? data : [];
          break;
          
        case 'nested_users':
          users = data.map(item => item.user || item).filter(Boolean);
          stocks = data.flatMap(item => item.stocks || []);
          hookahs = data.flatMap(item => item.freeHookahs || item.free_hookahs || []);
          break;
          
        case 'single_user':
          users = [data];
          break;
          
        default:
          throw new Error(`Неподдерживаемый формат данных: ${format}`);
      }

      console.log(`📊 Найдено для импорта:`);
      console.log(`   Пользователей: ${users.length}`);
      console.log(`   Акций: ${stocks.length}`);
      console.log(`   Кальянов: ${hookahs.length}`);

      return await this.importData(users, stocks, hookahs);
      
    } catch (error) {
      console.error('❌ Ошибка при импорте из JSON файла:', error.message);
      throw error;
    }
  }

  /**
   * Импорт из CSV файла
   */
  async importFromCSVFile(filename) {
    try {
      if (!fs.existsSync(filename)) {
        throw new Error(`Файл не найден: ${filename}`);
      }

      console.log(`🔄 Импорт данных из CSV файла: ${filename}`);
      
      const csvContent = fs.readFileSync(filename, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV файл пуст или содержит только заголовки');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const users = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const user = {};
        headers.forEach((header, index) => {
          user[header] = values[index];
        });

        // Преобразуем данные в нужный формат
        const mappedUser = this.mapUserData(user);
        if (mappedUser) {
          users.push(mappedUser);
        }
      }

      console.log(`📊 Найдено пользователей для импорта: ${users.length}`);
      return await this.importData(users, [], []);
      
    } catch (error) {
      console.error('❌ Ошибка при импорте из CSV файла:', error.message);
      throw error;
    }
  }

  /**
   * Импорт из старой базы данных
   */
  async importFromOldDatabase() {
    if (!this.oldDb) {
      throw new Error('Старая база данных не настроена');
    }

    try {
      console.log('🔄 Импорт данных из старой базы данных...');
      
      // Получаем пользователей из старой базы
      const users = await this.oldDb`
        SELECT * FROM users ORDER BY created_at ASC
      `;
      
      console.log(`📊 Найдено пользователей в старой базе: ${users.length}`);

      // Получаем акции из старой базы (если есть)
      let stocks = [];
      try {
        stocks = await this.oldDb`
          SELECT * FROM stocks ORDER BY created_at ASC
        `;
        console.log(`📊 Найдено акций в старой базе: ${stocks.length}`);
      } catch (error) {
        console.log('⚠️  Таблица stocks не найдена в старой базе');
      }

      // Получаем кальяны из старой базы (если есть)
      let hookahs = [];
      try {
        hookahs = await this.oldDb`
          SELECT * FROM free_hookahs ORDER BY created_at ASC
        `;
        console.log(`📊 Найдено кальянов в старой базе: ${hookahs.length}`);
      } catch (error) {
        console.log('⚠️  Таблица free_hookahs не найдена в старой базе');
      }

      return await this.importData(users, stocks, hookahs);
      
    } catch (error) {
      console.error('❌ Ошибка при импорте из старой базы данных:', error.message);
      throw error;
    }
  }

  /**
   * Основной метод импорта данных
   */
  async importData(users, stocks, hookahs) {
    try {
      console.log('\n🔄 Начинаем импорт данных...');
      
      let importedUsers = 0;
      let skippedUsers = 0;
      let errors = 0;
      const userMapping = new Map(); // Старый ID -> Новый ID

      // Импорт пользователей
      for (const user of users) {
        try {
          const mappedUser = this.mapUserData(user);
          if (!mappedUser) {
            console.log(`⚠️  Пропускаем пользователя с неполными данными`);
            skippedUsers++;
            continue;
          }

          console.log(`👤 Импорт пользователя: ${mappedUser.first_name} ${mappedUser.last_name} (TG ID: ${mappedUser.tg_id})`);
          
          // Проверяем, существует ли пользователь
          const existingUser = await this.targetDb`
            SELECT id FROM users WHERE tg_id = ${mappedUser.tg_id} LIMIT 1
          `;
          
          if (existingUser.length > 0) {
            console.log(`⚠️  Пользователь уже существует, пропускаем`);
            skippedUsers++;
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

          importedUsers++;
          
        } catch (error) {
          console.error(`❌ Ошибка при импорте пользователя:`, error.message);
          errors++;
        }
      }

      // Импорт акций
      let importedStocks = 0;
      for (const stock of stocks) {
        try {
          const newUserId = userMapping.get(stock.user_id);
          if (!newUserId) {
            console.log(`⚠️  Пропускаем акцию для несуществующего пользователя`);
            continue;
          }

          await this.targetDb`
            INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
            VALUES (${newUserId}, ${stock.stock_name}, ${stock.progress}, ${stock.created_at}, ${stock.updated_at})
          `;
          importedStocks++;
        } catch (error) {
          console.error(`❌ Ошибка при импорте акции:`, error.message);
        }
      }

      // Импорт кальянов
      let importedHookahs = 0;
      for (const hookah of hookahs) {
        try {
          const newUserId = userMapping.get(hookah.user_id);
          if (!newUserId) {
            console.log(`⚠️  Пропускаем кальян для несуществующего пользователя`);
            continue;
          }

          await this.targetDb`
            INSERT INTO free_hookahs (user_id, used, used_at, created_at)
            VALUES (${newUserId}, ${hookah.used}, ${hookah.used_at}, ${hookah.created_at})
          `;
          importedHookahs++;
        } catch (error) {
          console.error(`❌ Ошибка при импорте кальяна:`, error.message);
        }
      }

      console.log('\n📊 Результаты импорта:');
      console.log(`✅ Пользователей импортировано: ${importedUsers}`);
      console.log(`⚠️  Пользователей пропущено: ${skippedUsers}`);
      console.log(`❌ Ошибок: ${errors}`);
      console.log(`📊 Акций импортировано: ${importedStocks}`);
      console.log(`🎯 Кальянов импортировано: ${importedHookahs}`);
      
      return {
        users: { imported: importedUsers, skipped: skippedUsers, errors },
        stocks: { imported: importedStocks },
        hookahs: { imported: importedHookahs }
      };
      
    } catch (error) {
      console.error('❌ Ошибка при импорте данных:', error.message);
      throw error;
    }
  }

  /**
   * Определение формата данных
   */
  detectDataFormat(data) {
    if (data.users && data.stocks && data.free_hookahs) {
      return 'full_export';
    }
    if (Array.isArray(data) && data.length > 0) {
      if (data[0].user || data[0].tg_id) {
        return 'nested_users';
      }
      return 'users_array';
    }
    if (data.tg_id || data.first_name) {
      return 'single_user';
    }
    return 'unknown';
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
   * Парсинг CSV строки с учетом кавычек
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Создание резервной копии перед импортом
   */
  async createBackup() {
    try {
      console.log('🔄 Создание резервной копии перед импортом...');
      
      const { DataExporter } = require('./export-all-data.js');
      const exporter = new DataExporter();
      
      const data = await exporter.exportAllData();
      const backupFilename = `backup-before-old-bot-import-${new Date().toISOString().split('T')[0]}.json`;
      
      fs.writeFileSync(backupFilename, JSON.stringify(data, null, 2));
      console.log(`✅ Резервная копия создана: ${backupFilename}`);
      
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
  const filename = process.argv[3];
  const importer = new OldBotImporter();

  try {
    // Проверяем подключения
    await importer.checkConnections();

    switch (command) {
      case 'json':
        if (!filename) {
          console.error('❌ Укажите путь к JSON файлу');
          process.exit(1);
        }
        await importer.createBackup();
        await importer.importFromJSONFile(filename);
        break;
        
      case 'csv':
        if (!filename) {
          console.error('❌ Укажите путь к CSV файлу');
          process.exit(1);
        }
        await importer.createBackup();
        await importer.importFromCSVFile(filename);
        break;
        
      case 'database':
        await importer.createBackup();
        await importer.importFromOldDatabase();
        break;
        
      case 'backup':
        await importer.createBackup();
        break;
        
      case 'help':
      default:
        console.log(`
📥 Скрипт импорта данных из старого бота

Использование:
  node import-from-old-bot.js <command> [filename]

Команды:
  json <file>      - Импорт из JSON файла
  csv <file>       - Импорт из CSV файла
  database         - Импорт из старой базы данных
  backup           - Создать резервную копию
  help             - Показать эту справку

Переменные окружения:
  TARGET_DATABASE_URL  - URL целевой базы данных (обязательно)
  OLD_DATABASE_URL     - URL старой базы данных (для database команды)

Примеры:
  # Импорт из JSON файла
  node import-from-old-bot.js json old-bot-data.json
  
  # Импорт из CSV файла
  node import-from-old-bot.js csv old-users.csv
  
  # Импорт из старой базы данных
  OLD_DATABASE_URL="старая_база" node import-from-old-bot.js database
  
  # Создать резервную копию
  node import-from-old-bot.js backup

Поддерживаемые форматы JSON:
  - Полный экспорт: {users: [], stocks: [], free_hookahs: []}
  - Массив пользователей: [{tg_id, first_name, ...}, ...]
  - Вложенные данные: [{user: {...}, stocks: [...], ...}, ...]
  - Один пользователь: {tg_id, first_name, ...}

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

module.exports = OldBotImporter;
