const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

async function migrateDataToBigInt() {
  try {
    console.log('🔄 Мигрируем данные в BigInt формат...');
    
    // Открываем старую базу данных (backup)
    const backupDb = new Database('./prisma/hookah.db.backup');
    console.log('✅ Резервная база данных открыта');
    
    // Проверяем подключение к новой базе
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Новая база данных подключена');
    
    // 1. Мигрируем пользователей
    console.log('\n👥 Мигрируем пользователей...');
    
    const users = backupDb.prepare('SELECT * FROM users').all();
    console.log(`📊 Найдено ${users.length} пользователей в резервной копии`);
    
    for (const user of users) {
      try {
        await prisma.user.create({
          data: {
            tg_id: BigInt(user.tg_id),
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
        console.log(`✅ Пользователь ${user.first_name} ${user.last_name} (TG: ${user.tg_id}) мигрирован`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Пользователь ${user.first_name} ${user.last_name} (TG: ${user.tg_id}) уже существует`);
        } else {
          console.error(`❌ Ошибка при миграции пользователя ${user.first_name} ${user.last_name}:`, error.message);
        }
      }
    }
    
    // 2. Мигрируем stocks
    console.log('\n📦 Мигрируем stocks...');
    
    const stocks = backupDb.prepare('SELECT * FROM stocks').all();
    console.log(`📊 Найдено ${stocks.length} stocks в резервной копии`);
    
    for (const stock of stocks) {
      try {
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
        console.log(`✅ Stock "${stock.stock_name}" для пользователя ${stock.user_id} мигрирован`);
      } catch (error) {
        console.error(`❌ Ошибка при миграции stock "${stock.stock_name}":`, error.message);
      }
    }
    
    // 3. Мигрируем hookah_history
    console.log('\n📝 Мигрируем hookah_history...');
    
    const history = backupDb.prepare('SELECT * FROM hookah_history').all();
    console.log(`📊 Найдено ${history.length} записей истории в резервной копии`);
    
    for (const record of history) {
      try {
        await prisma.hookahHistory.create({
          data: {
            user_id: record.user_id,
            hookah_type: record.hookah_type,
            slot_number: record.slot_number,
            created_at: record.created_at ? new Date(record.created_at) : null
          }
        });
        console.log(`✅ Запись истории ${record.id} для пользователя ${record.user_id} мигрирована`);
      } catch (error) {
        console.error(`❌ Ошибка при миграции записи истории ${record.id}:`, error.message);
      }
    }
    
    // 4. Мигрируем free_hookahs
    console.log('\n🎁 Мигрируем free_hookahs...');
    
    const freeHookahs = backupDb.prepare('SELECT * FROM free_hookahs').all();
    console.log(`📊 Найдено ${freeHookahs.length} бесплатных кальянов в резервной копии`);
    
    for (const hookah of freeHookahs) {
      try {
        await prisma.freeHookah.create({
          data: {
            user_id: hookah.user_id,
            used: Boolean(hookah.used),
            used_at: hookah.used_at ? new Date(hookah.used_at) : null,
            created_at: new Date(hookah.created_at)
          }
        });
        console.log(`✅ Бесплатный кальян ${hookah.id} для пользователя ${hookah.user_id} мигрирован`);
      } catch (error) {
        console.error(`❌ Ошибка при миграции бесплатного кальяна ${hookah.id}:`, error.message);
      }
    }
    
    // 5. Мигрируем hookah_reviews
    console.log('\n⭐ Мигрируем hookah_reviews...');
    
    const reviews = backupDb.prepare('SELECT * FROM hookah_reviews').all();
    console.log(`📊 Найдено ${reviews.length} отзывов в резервной копии`);
    
    for (const review of reviews) {
      try {
        await prisma.hookahReview.create({
          data: {
            user_id: review.user_id,
            hookah_id: review.hookah_id,
            rating: review.rating,
            review_text: review.review_text,
            created_at: new Date(review.created_at)
          }
        });
        console.log(`✅ Отзыв ${review.id} от пользователя ${review.user_id} мигрирован`);
      } catch (error) {
        console.error(`❌ Ошибка при миграции отзыва ${review.id}:`, error.message);
      }
    }
    
    // Закрываем соединения
    backupDb.close();
    await prisma.$disconnect();
    
    console.log('\n🎉 Миграция данных завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при миграции данных:', error);
  }
}

migrateDataToBigInt();
