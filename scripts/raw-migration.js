const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

const prisma = new PrismaClient();
const oldDb = new Database('./hookah.db', { readonly: true });
const newDb = new Database('./prisma/hookah.db');

async function rawMigration() {
  try {
    console.log('🚀 Запускаем миграцию через raw SQL...');
    
    // Очищаем текущие данные в новой базе
    console.log('🧹 Очищаем текущие данные в новой базе...');
    newDb.exec('DELETE FROM hookah_reviews');
    newDb.exec('DELETE FROM hookah_history');
    newDb.exec('DELETE FROM admin_list');
    newDb.exec('DELETE FROM stocks');
    newDb.exec('DELETE FROM users');
    console.log('✅ Данные очищены');
    
    // 1. Мигрируем пользователей (guests -> users)
    console.log('👥 Мигрируем пользователей...');
    
    const guests = oldDb.prepare('SELECT * FROM guests WHERE telegram_id IS NOT NULL').all();
    console.log(`📊 Найдено гостей: ${guests.length}`);
    
    let usersMigrated = 0;
    for (const guest of guests) {
      try {
        // Проверяем, что TG ID помещается в INT
        if (guest.telegram_id > 2147483647) {
          console.log(`   ⚠️ Пропускаем пользователя с большим TG ID: ${guest.telegram_id}`);
          continue;
        }
        
        // Конвертируем дату
        let createdAt;
        if (typeof guest.created_at === 'string' && guest.created_at.includes('-')) {
          // Формат YYYY-MM-DD HH:MM:SS.microseconds
          createdAt = new Date(guest.created_at).toISOString();
        } else {
          // Timestamp в миллисекундах
          createdAt = new Date(parseInt(guest.created_at)).toISOString();
        }
        
        // Вставляем пользователя через raw SQL
        const insertUser = newDb.prepare(`
          INSERT INTO users (tg_id, first_name, last_name, username, phone, is_admin, created_at, updated_at, total_purchases, total_regular_purchases, total_free_purchases)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertUser.run(
          parseInt(guest.telegram_id),
          String(guest.first_name || 'Unknown'),
          String(guest.last_name || 'User'),
          null,
          String(guest.phone || '+0000000000'),
          false,
          String(createdAt),
          String(createdAt),
          parseInt(guest.total_purchases || 0),
          0,
          0
        );
        
        usersMigrated++;
        if (usersMigrated % 50 === 0) {
          console.log(`   📈 Мигрировано пользователей: ${usersMigrated}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Ошибка при миграции пользователя ${guest.telegram_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Мигрировано пользователей: ${usersMigrated}`);
    
    // 2. Мигрируем покупки (purchases -> hookah_history)
    console.log('📦 Мигрируем покупки...');
    
    const purchases = oldDb.prepare('SELECT * FROM purchases').all();
    console.log(`📊 Найдено покупок: ${purchases.length}`);
    
    let historyMigrated = 0;
    
    for (const purchase of purchases) {
      try {
        // Пропускаем записи с null guest_id
        if (!purchase.guest_id) {
          continue;
        }
        
        // Находим пользователя по guest_id
        const user = newDb.prepare('SELECT id FROM users WHERE tg_id = ?').get(purchase.guest_id);
        
        if (user) {
          // Конвертируем дату
          let purchaseCreatedAt;
          if (typeof purchase.created_at === 'string' && purchase.created_at.includes('-')) {
            purchaseCreatedAt = new Date(purchase.created_at).toISOString();
          } else {
            purchaseCreatedAt = new Date(parseInt(purchase.created_at)).toISOString();
          }
          
          // Создаем запись в истории кальянов
          const insertHistory = newDb.prepare(`
            INSERT INTO hookah_history (user_id, hookah_type, created_at)
            VALUES (?, ?, ?)
          `);
          
          insertHistory.run(
            user.id,
            purchase.is_free ? 'free' : 'regular',
            String(purchaseCreatedAt)
          );
          historyMigrated++;
          
          // Если есть рейтинг, создаем отзыв
          if (purchase.rating) {
            const insertReview = newDb.prepare(`
              INSERT INTO hookah_reviews (user_id, hookah_id, rating, review_text)
              VALUES (?, ?, ?, ?)
            `);
            
            insertReview.run(
              user.id,
              historyMigrated, // Используем ID истории как hookah_id
              parseInt(purchase.rating),
              purchase.rating_comment ? String(purchase.rating_comment) : null
            );
          }
        }
        
        if (historyMigrated % 100 === 0) {
          console.log(`   📈 Мигрировано записей: ${historyMigrated}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Ошибка при миграции покупки ${purchase.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Мигрировано записей истории: ${historyMigrated}`);
    
    // 3. Мигрируем администраторов (admins -> admin_list)
    console.log('👑 Мигрируем администраторов...');
    
    const admins = oldDb.prepare('SELECT * FROM admins').all();
    console.log(`📊 Найдено администраторов: ${admins.length}`);
    
    let adminsMigrated = 0;
    for (const admin of admins) {
      try {
        // Проверяем, что TG ID помещается в INT
        if (admin.telegram_id > 2147483647) {
          console.log(`   ⚠️ Пропускаем администратора с большим TG ID: ${admin.telegram_id}`);
          continue;
        }
        
        // Проверяем, существует ли уже администратор
        const existing = newDb.prepare('SELECT id FROM admin_list WHERE tg_id = ?').get(admin.telegram_id);
        
        if (existing) {
          console.log(`   ⚠️ Администратор ${admin.telegram_id} уже существует, пропускаем`);
          continue;
        }
        
        // Конвертируем дату
        let adminCreatedAt;
        if (typeof admin.created_at === 'string' && admin.created_at.includes('-')) {
          adminCreatedAt = new Date(admin.created_at).toISOString();
        } else {
          adminCreatedAt = new Date(parseInt(admin.created_at)).toISOString();
        }
        
        // Вставляем администратора через raw SQL
        const insertAdmin = newDb.prepare(`
          INSERT INTO admin_list (tg_id, created_at)
          VALUES (?, ?)
        `);
        
        insertAdmin.run(
          parseInt(admin.telegram_id),
          String(adminCreatedAt)
        );
        adminsMigrated++;
      } catch (error) {
        console.log(`   ⚠️ Ошибка при миграции администратора ${admin.telegram_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Мигрировано администраторов: ${adminsMigrated}`);
    
    // 4. Создаем начальные запасы для пользователей
    console.log('📦 Создаем начальные запасы...');
    
    const users = newDb.prepare('SELECT id FROM users').all();
    let stocksCreated = 0;
    
    for (const user of users) {
      // Создаем 5 начальных запасов для каждого пользователя
      for (let i = 0; i < 5; i++) {
        const insertStock = newDb.prepare(`
          INSERT INTO stocks (user_id, created_at, updated_at)
          VALUES (?, ?, ?)
        `);
        
        const now = new Date().toISOString();
        insertStock.run(user.id, now, now);
        stocksCreated++;
      }
    }
    console.log(`✅ Создано начальных запасов: ${stocksCreated}`);
    
    console.log('🎉 Миграция через raw SQL завершена!');
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
  } finally {
    await prisma.$disconnect();
    oldDb.close();
    newDb.close();
  }
}

rawMigration();
