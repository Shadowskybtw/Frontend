#!/usr/bin/env node
/**
 * Скрипт для миграции данных пользователей
 * Поддерживает экспорт из текущей базы данных и импорт в новую
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Конфигурация
const SOURCE_DB_URL = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
const TARGET_DB_URL = process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;
const EXPORT_FILE = process.env.EXPORT_FILE || './users-export.json';

// Инициализация подключений к базам данных
const sourceDb = SOURCE_DB_URL ? neon(SOURCE_DB_URL) : null;
const targetDb = TARGET_DB_URL ? neon(TARGET_DB_URL) : null;

// Интерфейсы для типизации
const User = {
  id: 'number',
  tg_id: 'number', 
  first_name: 'string',
  last_name: 'string',
  phone: 'string',
  username: 'string|null',
  created_at: 'Date',
  updated_at: 'Date'
};

const Stock = {
  id: 'number',
  user_id: 'number',
  stock_name: 'string',
  progress: 'number',
  created_at: 'Date',
  updated_at: 'Date'
};

const FreeHookah = {
  id: 'number',
  user_id: 'number',
  used: 'boolean',
  used_at: 'Date|null',
  created_at: 'Date'
};

class UserMigrator {
  constructor() {
    this.sourceDb = sourceDb;
    this.targetDb = targetDb;
  }

  /**
   * Экспорт всех пользователей из базы данных
   */
  async exportUsers() {
    if (!this.sourceDb) {
      throw new Error('Source database not configured');
    }

    console.log('🔄 Экспорт пользователей...');
    
    try {
      // Получаем всех пользователей
      const users = await this.sourceDb`
        SELECT * FROM users ORDER BY created_at ASC
      `;
      
      console.log(`📊 Найдено пользователей: ${users.length}`);

      // Для каждого пользователя получаем связанные данные
      const fullData = [];
      
      for (const user of users) {
        console.log(`👤 Обработка пользователя: ${user.first_name} ${user.last_name} (ID: ${user.tg_id})`);
        
        // Получаем акции пользователя
        const stocks = await this.sourceDb`
          SELECT * FROM stocks WHERE user_id = ${user.id} ORDER BY created_at ASC
        `;
        
        // Получаем бесплатные кальяны пользователя
        const freeHookahs = await this.sourceDb`
          SELECT * FROM free_hookahs WHERE user_id = ${user.id} ORDER BY created_at ASC
        `;
        
        fullData.push({
          user,
          stocks,
          freeHookahs
        });
      }

      // Сохраняем в файл
      const exportData = {
        exported_at: new Date().toISOString(),
        total_users: users.length,
        data: fullData
      };

      fs.writeFileSync(EXPORT_FILE, JSON.stringify(exportData, null, 2));
      console.log(`✅ Данные экспортированы в файл: ${EXPORT_FILE}`);
      
      return exportData;
      
    } catch (error) {
      console.error('❌ Ошибка при экспорте:', error);
      throw error;
    }
  }

  /**
   * Импорт пользователей в базу данных
   */
  async importUsers(importFile = EXPORT_FILE) {
    if (!this.targetDb) {
      throw new Error('Target database not configured');
    }

    if (!fs.existsSync(importFile)) {
      throw new Error(`Import file not found: ${importFile}`);
    }

    console.log('🔄 Импорт пользователей...');
    
    try {
      const importData = JSON.parse(fs.readFileSync(importFile, 'utf8'));
      console.log(`📊 Загружено пользователей для импорта: ${importData.total_users}`);

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      for (const item of importData.data) {
        const { user, stocks, freeHookahs } = item;
        
        try {
          console.log(`👤 Импорт пользователя: ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id})`);
          
          // Проверяем, существует ли пользователь
          const existingUser = await this.targetDb`
            SELECT id FROM users WHERE tg_id = ${user.tg_id} LIMIT 1
          `;
          
          if (existingUser.length > 0) {
            console.log(`⚠️  Пользователь уже существует, пропускаем`);
            skipped++;
            continue;
          }

          // Создаем пользователя
          const [newUser] = await this.targetDb`
            INSERT INTO users (tg_id, first_name, last_name, phone, username, created_at, updated_at)
            VALUES (${user.tg_id}, ${user.first_name}, ${user.last_name}, ${user.phone}, ${user.username}, ${user.created_at}, ${user.updated_at})
            RETURNING id
          `;
          
          const userId = newUser.id;
          console.log(`✅ Пользователь создан с ID: ${userId}`);

          // Импортируем акции
          for (const stock of stocks) {
            await this.targetDb`
              INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
              VALUES (${userId}, ${stock.stock_name}, ${stock.progress}, ${stock.created_at}, ${stock.updated_at})
            `;
          }
          console.log(`📊 Импортировано акций: ${stocks.length}`);

          // Импортируем бесплатные кальяны
          for (const hookah of freeHookahs) {
            await this.targetDb`
              INSERT INTO free_hookahs (user_id, used, used_at, created_at)
              VALUES (${userId}, ${hookah.used}, ${hookah.used_at}, ${hookah.created_at})
            `;
          }
          console.log(`🎯 Импортировано кальянов: ${freeHookahs.length}`);

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
      
    } catch (error) {
      console.error('❌ Ошибка при импорте:', error);
      throw error;
    }
  }

  /**
   * Создание резервной копии текущих данных
   */
  async createBackup() {
    const backupFile = `./backup-${new Date().toISOString().split('T')[0]}.json`;
    console.log(`🔄 Создание резервной копии в файл: ${backupFile}`);
    
    const data = await this.exportUsers();
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`✅ Резервная копия создана: ${backupFile}`);
    
    return backupFile;
  }

  /**
   * Проверка подключения к базам данных
   */
  async checkConnections() {
    console.log('🔍 Проверка подключений к базам данных...');
    
    if (this.sourceDb) {
      try {
        await this.sourceDb`SELECT 1`;
        console.log('✅ Source database: подключено');
      } catch (error) {
        console.log('❌ Source database: ошибка подключения');
        throw error;
      }
    } else {
      console.log('⚠️  Source database: не настроено');
    }
    
    if (this.targetDb) {
      try {
        await this.targetDb`SELECT 1`;
        console.log('✅ Target database: подключено');
      } catch (error) {
        console.log('❌ Target database: ошибка подключения');
        throw error;
      }
    } else {
      console.log('⚠️  Target database: не настроено');
    }
  }

  /**
   * Показать статистику базы данных
   */
  async showStats() {
    if (!this.sourceDb) {
      console.log('❌ Source database не настроено');
      return;
    }

    console.log('📊 Статистика базы данных:');
    
    try {
      const [userCount] = await this.sourceDb`SELECT COUNT(*) as count FROM users`;
      const [stockCount] = await this.sourceDb`SELECT COUNT(*) as count FROM stocks`;
      const [hookahCount] = await this.sourceDb`SELECT COUNT(*) as count FROM free_hookahs`;
      
      console.log(`👥 Пользователей: ${userCount.count}`);
      console.log(`📊 Акций: ${stockCount.count}`);
      console.log(`🎯 Кальянов: ${hookahCount.count}`);
      
    } catch (error) {
      console.error('❌ Ошибка при получении статистики:', error);
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const migrator = new UserMigrator();

  try {
    switch (command) {
      case 'export':
        await migrator.checkConnections();
        await migrator.exportUsers();
        break;
        
      case 'import':
        await migrator.checkConnections();
        await migrator.importUsers();
        break;
        
      case 'backup':
        await migrator.checkConnections();
        await migrator.createBackup();
        break;
        
      case 'stats':
        await migrator.showStats();
        break;
        
      case 'help':
      default:
        console.log(`
🔄 Скрипт миграции пользователей

Использование:
  node migrate-users.js <command>

Команды:
  export    - Экспорт всех пользователей в JSON файл
  import    - Импорт пользователей из JSON файла
  backup    - Создание резервной копии
  stats     - Показать статистику базы данных
  help      - Показать эту справку

Переменные окружения:
  SOURCE_DATABASE_URL  - URL исходной базы данных (по умолчанию: DATABASE_URL)
  TARGET_DATABASE_URL  - URL целевой базы данных (по умолчанию: DATABASE_URL)
  EXPORT_FILE          - Путь к файлу экспорта (по умолчанию: ./users-export.json)

Примеры:
  # Экспорт данных
  node migrate-users.js export
  
  # Импорт данных
  node migrate-users.js import
  
  # Создание резервной копии
  node migrate-users.js backup
  
  # Просмотр статистики
  node migrate-users.js stats
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

module.exports = UserMigrator;

