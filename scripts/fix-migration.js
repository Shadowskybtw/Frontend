const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

async function fixMigration() {
  try {
    console.log('🔄 Исправляем миграцию данных...');
    
    // Открываем старую базу данных
    const oldDb = new Database('./hookah.db');
    console.log('✅ Старая база данных открыта');
    
    // Проверяем подключение к новой базе
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Новая база данных подключена');
    
    // 1. Сначала получаем всех гостей
    console.log('\n👥 Получаем всех гостей...');
    
    const guests = oldDb.prepare('SELECT * FROM guests').all();
    console.log(`📊 Найдено ${guests.length} гостей в старой базе`);
    
    // Создаем мапу guest_id -> user_id для быстрого поиска
    const guestIdToUserId = new Map();
    
    for (const guest of guests) {
      try {
        // Ищем пользователя по telegram_id
        const user = await prisma.user.findUnique({
          where: { tg_id: BigInt(guest.telegram_id) }
        });
        
        if (user) {
          guestIdToUserId.set(guest.id, user.id);
          console.log(`✅ Гость ${guest.id} -> Пользователь ${user.id} (TG: ${guest.telegram_id})`);
        } else {
          console.log(`⚠️ Пользователь с TG ID ${guest.telegram_id} не найден`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при поиске пользователя для гостя ${guest.id}:`, error.message);
      }
    }
    
    // 2. Теперь мигрируем покупки
    console.log('\n📝 Мигрируем покупки...');
    
    const purchases = oldDb.prepare('SELECT * FROM purchases').all();
    console.log(`📊 Найдено ${purchases.length} покупок в старой базе`);
    
    let migratedPurchases = 0;
    let skippedPurchases = 0;
    
    for (const purchase of purchases) {
      try {
        const userId = guestIdToUserId.get(purchase.guest_id);
        
        if (!userId) {
          console.log(`⚠️ Пользователь для гостя ${purchase.guest_id} не найден, пропускаем покупку ${purchase.id}`);
          skippedPurchases++;
          continue;
        }
        
        await prisma.hookahHistory.create({
          data: {
            user_id: userId,
            hookah_type: purchase.is_free ? 'free' : 'regular',
            slot_number: null,
            created_at: purchase.created_at ? new Date(purchase.created_at) : new Date()
          }
        });
        
        migratedPurchases++;
        if (migratedPurchases % 100 === 0) {
          console.log(`✅ Мигрировано ${migratedPurchases} покупок...`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при миграции покупки ${purchase.id}:`, error.message);
      }
    }
    
    console.log(`✅ Всего мигрировано ${migratedPurchases} покупок`);
    console.log(`⚠️ Пропущено ${skippedPurchases} покупок`);
    
    // 3. Обновляем статистику пользователей
    console.log('\n📊 Обновляем статистику пользователей...');
    
    const users = await prisma.user.findMany();
    for (const user of users) {
      try {
        const history = await prisma.hookahHistory.findMany({
          where: { user_id: user.id }
        });
        
        const totalPurchases = history.length;
        const regularPurchases = history.filter(h => h.hookah_type === 'regular').length;
        const freePurchases = history.filter(h => h.hookah_type === 'free').length;
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            total_purchases: totalPurchases,
            total_regular_purchases: regularPurchases,
            total_free_purchases: freePurchases
          }
        });
        
        if (totalPurchases > 0) {
          console.log(`✅ Статистика обновлена для ${user.first_name} ${user.last_name}: ${totalPurchases} покупок (${regularPurchases} обычных, ${freePurchases} бесплатных)`);
        }
      } catch (error) {
        console.error(`❌ Ошибка при обновлении статистики для пользователя ${user.id}:`, error.message);
      }
    }
    
    // Закрываем соединения
    oldDb.close();
    await prisma.$disconnect();
    
    console.log('\n🎉 Миграция данных завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при миграции данных:', error);
  }
}

fixMigration();
