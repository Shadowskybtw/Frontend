const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

async function fixDatabaseSchema() {
  console.log('🔧 Исправляем схему базы данных...');
  
  const db = new Database('./prisma/hookah.db');
  
  try {
    // Создаем резервную копию данных
    console.log('💾 Создаем резервную копию данных...');
    
    const users = db.prepare('SELECT * FROM users').all();
    const adminList = db.prepare('SELECT * FROM admin_list').all();
    
    console.log(`📊 Найдено пользователей: ${users.length}`);
    console.log(`👑 Найдено администраторов: ${adminList.length}`);
    
    // Пересоздаем таблицу users с правильными типами
    console.log('🔨 Пересоздаем таблицу users...');
    
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        username TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        total_purchases INTEGER DEFAULT 0,
        total_regular_purchases INTEGER DEFAULT 0,
        total_free_purchases INTEGER DEFAULT 0
      )
    `);
    
    // Копируем данные
    const insertUser = db.prepare(`
      INSERT INTO users_new (
        id, tg_id, first_name, last_name, phone, username,
        created_at, updated_at, is_admin, total_purchases,
        total_regular_purchases, total_free_purchases
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const user of users) {
      insertUser.run(
        user.id,
        user.tg_id,
        user.first_name,
        user.last_name,
        user.phone,
        user.username,
        user.created_at,
        user.updated_at,
        user.is_admin || 0,
        user.total_purchases || 0,
        user.total_regular_purchases || 0,
        user.total_free_purchases || 0
      );
    }
    
    // Пересоздаем таблицу admin_list
    console.log('🔨 Пересоздаем таблицу admin_list...');
    
    db.exec(`
      CREATE TABLE admin_list_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )
    `);
    
    const insertAdmin = db.prepare(`
      INSERT INTO admin_list_new (id, tg_id, created_at)
      VALUES (?, ?, ?)
    `);
    
    for (const admin of adminList) {
      insertAdmin.run(admin.id, admin.tg_id, admin.created_at);
    }
    
    // Заменяем старые таблицы новыми
    console.log('🔄 Заменяем таблицы...');
    
    db.exec('DROP TABLE users');
    db.exec('DROP TABLE admin_list');
    db.exec('ALTER TABLE users_new RENAME TO users');
    db.exec('ALTER TABLE admin_list_new RENAME TO admin_list');
    
    console.log('✅ Схема базы данных исправлена!');
    
    // Проверяем результат
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_list').get();
    
    console.log(`📊 Результат:`);
    console.log(`   - Пользователей: ${userCount.count}`);
    console.log(`   - Администраторов: ${adminCount.count}`);
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении схемы:', error);
  } finally {
    db.close();
  }
}

fixDatabaseSchema();
