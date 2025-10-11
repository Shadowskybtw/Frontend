const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

async function fullMigration() {
  console.log('🚀 Начинаем полную миграцию данных...');
  
  const oldDb = new Database('./hookah.db');
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Подключение к базам данных установлено');
    
    // Очищаем текущие данные в новой базе
    console.log('🗑️ Очищаем текущие данные...');
    await prisma.hookahReview.deleteMany();
    await prisma.freeHookahRequest.deleteMany();
    await prisma.hookahHistory.deleteMany();
    await prisma.freeHookah.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.user.deleteMany();
    
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
        
               // Конвертируем дату в ISO строку
               let createdAt;
               if (typeof guest.created_at === 'string' && guest.created_at.includes('-')) {
                 // Формат YYYY-MM-DD HH:MM:SS.microseconds
                 createdAt = new Date(guest.created_at).toISOString();
               } else {
                 // Timestamp в миллисекундах
                 createdAt = new Date(parseInt(guest.created_at)).toISOString();
               }
        
        const user = await prisma.user.create({
          data: {
            tg_id: guest.telegram_id,
            first_name: guest.first_name || 'Unknown',
            last_name: guest.last_name || 'User',
            phone: guest.phone || '+0000000000',
            username: null,
            is_admin: false,
            total_purchases: guest.total_purchases || 0,
            total_regular_purchases: 0,
            total_free_purchases: 0,
            created_at: createdAt,
            updated_at: createdAt
          }
        });
        
        usersMigrated++;
        if (usersMigrated % 50 === 0) {
          console.log(`   📈 Мигрировано пользователей: ${usersMigrated}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Ошибка при миграции пользователя ${guest.telegram_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Мигрировано пользователей: ${usersMigrated}`);
    
    // 2. Мигрируем покупки (purchases -> stocks + hookah_history)
    console.log('📦 Мигрируем покупки...');
    
    const purchases = oldDb.prepare('SELECT * FROM purchases').all();
    console.log(`📊 Найдено покупок: ${purchases.length}`);
    
    let stocksMigrated = 0;
    let historyMigrated = 0;
    
    for (const purchase of purchases) {
      try {
        // Пропускаем записи с null guest_id
        if (!purchase.guest_id) {
          continue;
        }
        
        // Находим пользователя по guest_id
        const user = await prisma.user.findFirst({
          where: {
            tg_id: purchase.guest_id
          }
        });
        
        if (user) {
               // Конвертируем дату в ISO строку
               let purchaseCreatedAt;
               if (typeof purchase.created_at === 'string' && purchase.created_at.includes('-')) {
                 purchaseCreatedAt = new Date(purchase.created_at).toISOString();
               } else {
                 purchaseCreatedAt = new Date(parseInt(purchase.created_at)).toISOString();
               }
          
          // Создаем запись в истории кальянов
          await prisma.hookahHistory.create({
            data: {
              user_id: user.id,
              hookah_type: purchase.is_free ? 'free' : 'regular',
              created_at: purchaseCreatedAt
            }
          });
          historyMigrated++;
          
          // Если есть рейтинг, создаем отзыв
          if (purchase.rating) {
            await prisma.hookahReview.create({
              data: {
                user_id: user.id,
                hookah_id: historyMigrated, // Используем ID истории как hookah_id
                rating: purchase.rating,
                review_text: purchase.rating_comment || null
              }
            });
          }
        }
        
        if ((stocksMigrated + historyMigrated) % 100 === 0) {
          console.log(`   📈 Мигрировано записей: ${stocksMigrated + historyMigrated}`);
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
        
        // Пропускаем, если уже существует
        const existing = await prisma.adminList.findUnique({
          where: { tg_id: admin.telegram_id }
        });
        
        if (existing) {
          console.log(`   ⚠️ Администратор ${admin.telegram_id} уже существует, пропускаем`);
          continue;
        }
        
               // Конвертируем дату в ISO строку
               let adminCreatedAt;
               if (typeof admin.created_at === 'string' && admin.created_at.includes('-')) {
                 adminCreatedAt = new Date(admin.created_at).toISOString();
               } else {
                 adminCreatedAt = new Date(parseInt(admin.created_at)).toISOString();
               }
        
        await prisma.adminList.create({
          data: {
            tg_id: admin.telegram_id,
            created_at: adminCreatedAt
          }
        });
        adminsMigrated++;
      } catch (error) {
        console.log(`   ⚠️ Ошибка при миграции администратора ${admin.telegram_id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Мигрировано администраторов: ${adminsMigrated}`);
    
    // 4. Создаем начальные запасы для пользователей
    console.log('📦 Создаем начальные запасы...');
    
    const users = await prisma.user.findMany();
    let stocksCreated = 0;
    
    for (const user of users) {
      try {
        await prisma.stock.create({
          data: {
            user_id: user.id,
            stock_name: '5+1 кальян',
            progress: 0,
            promotion_completed: false
          }
        });
        stocksCreated++;
      } catch (error) {
        console.log(`   ⚠️ Ошибка при создании запаса для пользователя ${user.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Создано запасов: ${stocksCreated}`);
    
    // Проверяем результат
    console.log('📊 Итоговые данные:');
    const userCount = await prisma.user.count();
    const adminCount = await prisma.adminList.count();
    const stockCount = await prisma.stock.count();
    const historyCount = await prisma.hookahHistory.count();
    const reviewCount = await prisma.hookahReview.count();
    
    console.log(`   - Пользователей: ${userCount}`);
    console.log(`   - Администраторов: ${adminCount}`);
    console.log(`   - Запасов: ${stockCount}`);
    console.log(`   - Записей истории: ${historyCount}`);
    console.log(`   - Отзывов: ${reviewCount}`);
    
    console.log('🎉 Полная миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

fullMigration();
