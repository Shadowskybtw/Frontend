const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

// Создаем Prisma Client для PostgreSQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Подключаемся к SQLite базе данных
const sqliteDb = new Database('./prisma/hookah.db', { readonly: true });

async function migrateToPostgreSQL() {
  try {
    console.log('🚀 Начинаем миграцию данных из SQLite в PostgreSQL...');
    
    // Проверяем подключение к PostgreSQL
    await prisma.$connect();
    console.log('✅ Подключение к PostgreSQL установлено');
    
    // Очищаем существующие данные в PostgreSQL
    console.log('🧹 Очищаем существующие данные в PostgreSQL...');
    await prisma.hookahReview.deleteMany();
    await prisma.hookahHistory.deleteMany();
    await prisma.freeHookahRequest.deleteMany();
    await prisma.freeHookah.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.adminList.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Данные очищены');
    
    // 1. Мигрируем пользователей
    console.log('👥 Мигрируем пользователей...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    for (const user of users) {
      await prisma.user.create({
        data: {
          tg_id: user.tg_id,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          username: user.username,
          created_at: new Date(user.created_at),
          updated_at: new Date(user.updated_at),
          is_admin: Boolean(user.is_admin),
          total_purchases: user.total_purchases || 0,
          total_regular_purchases: user.total_regular_purchases || 0,
          total_free_purchases: user.total_free_purchases || 0
        }
      });
    }
    console.log(`✅ Мигрировано пользователей: ${users.length}`);
    
    // 2. Мигрируем запасы
    console.log('📦 Мигрируем запасы...');
    const stocks = sqliteDb.prepare('SELECT * FROM stocks').all();
    console.log(`📊 Найдено запасов: ${stocks.length}`);
    
    for (const stock of stocks) {
      await prisma.stock.create({
        data: {
          user_id: stock.user_id,
          stock_name: stock.stock_name,
          progress: stock.progress,
          promotion_completed: Boolean(stock.promotion_completed),
          created_at: new Date(stock.created_at),
          updated_at: new Date(stock.updated_at)
        }
      });
    }
    console.log(`✅ Мигрировано запасов: ${stocks.length}`);
    
    // 3. Мигрируем историю кальянов
    console.log('📝 Мигрируем историю кальянов...');
    const history = sqliteDb.prepare('SELECT * FROM hookah_history').all();
    console.log(`📊 Найдено записей истории: ${history.length}`);
    
    for (const record of history) {
      await prisma.hookahHistory.create({
        data: {
          user_id: record.user_id,
          hookah_type: record.hookah_type,
          slot_number: record.slot_number,
          created_at: record.created_at ? new Date(record.created_at) : null
        }
      });
    }
    console.log(`✅ Мигрировано записей истории: ${history.length}`);
    
    // 4. Мигрируем отзывы
    console.log('⭐ Мигрируем отзывы...');
    const reviews = sqliteDb.prepare('SELECT * FROM hookah_reviews').all();
    console.log(`📊 Найдено отзывов: ${reviews.length}`);
    
    for (const review of reviews) {
      await prisma.hookahReview.create({
        data: {
          user_id: review.user_id,
          hookah_id: review.hookah_id,
          rating: review.rating,
          review_text: review.review_text,
          created_at: new Date(review.created_at)
        }
      });
    }
    console.log(`✅ Мигрировано отзывов: ${reviews.length}`);
    
    // 5. Мигрируем список администраторов
    console.log('👑 Мигрируем список администраторов...');
    const adminList = sqliteDb.prepare('SELECT * FROM admin_list').all();
    console.log(`📊 Найдено администраторов: ${adminList.length}`);
    
    for (const admin of adminList) {
      await prisma.adminList.create({
        data: {
          tg_id: admin.tg_id,
          created_at: new Date(admin.created_at)
        }
      });
    }
    console.log(`✅ Мигрировано администраторов: ${adminList.length}`);
    
    // 6. Мигрируем бесплатные кальяны
    console.log('🎁 Мигрируем бесплатные кальяны...');
    const freeHookahs = sqliteDb.prepare('SELECT * FROM free_hookahs').all();
    console.log(`📊 Найдено бесплатных кальянов: ${freeHookahs.length}`);
    
    for (const hookah of freeHookahs) {
      await prisma.freeHookah.create({
        data: {
          user_id: hookah.user_id,
          used: Boolean(hookah.used),
          used_at: hookah.used_at ? new Date(hookah.used_at) : null,
          created_at: new Date(hookah.created_at)
        }
      });
    }
    console.log(`✅ Мигрировано бесплатных кальянов: ${freeHookahs.length}`);
    
    // 7. Мигрируем запросы на бесплатные кальяны
    console.log('📋 Мигрируем запросы на бесплатные кальяны...');
    const requests = sqliteDb.prepare('SELECT * FROM free_hookah_requests').all();
    console.log(`📊 Найдено запросов: ${requests.length}`);
    
    for (const request of requests) {
      await prisma.freeHookahRequest.create({
        data: {
          user_id: request.user_id,
          stock_id: request.stock_id,
          status: request.status,
          approved_by: request.approved_by,
          created_at: new Date(request.created_at),
          updated_at: new Date(request.updated_at)
        }
      });
    }
    console.log(`✅ Мигрировано запросов: ${requests.length}`);
    
    console.log('🎉 Миграция данных завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
  } finally {
    await prisma.$disconnect();
    sqliteDb.close();
  }
}

migrateToPostgreSQL();
