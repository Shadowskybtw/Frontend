const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');

async function migrateFromOldDb() {
  try {
    console.log('🔄 Мигрируем данные из старой базы данных...');
    
    // Открываем старую базу данных
    const oldDb = new Database('./hookah.db');
    console.log('✅ Старая база данных открыта');
    
    // Проверяем подключение к новой базе
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Новая база данных подключена');
    
    // 1. Мигрируем гостей в пользователей
    console.log('\n👥 Мигрируем гостей в пользователей...');
    
    const guests = oldDb.prepare('SELECT * FROM guests').all();
    console.log(`📊 Найдено ${guests.length} гостей в старой базе`);
    
    for (const guest of guests) {
      try {
        await prisma.user.create({
          data: {
            tg_id: BigInt(guest.tg_id),
            first_name: guest.first_name || 'Unknown',
            last_name: guest.last_name || '',
            phone: guest.phone || '',
            username: guest.username,
            created_at: new Date(guest.created_at || Date.now()),
            updated_at: new Date(guest.updated_at || Date.now()),
            is_admin: Boolean(guest.is_admin),
            total_purchases: 0, // Будет обновлено после миграции purchases
            total_regular_purchases: 0,
            total_free_purchases: 0
          }
        });
        console.log(`✅ Гость ${guest.first_name} ${guest.last_name} (TG: ${guest.tg_id}) мигрирован`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Гость ${guest.first_name} ${guest.last_name} (TG: ${guest.tg_id}) уже существует`);
        } else {
          console.error(`❌ Ошибка при миграции гостя ${guest.first_name} ${guest.last_name}:`, error.message);
        }
      }
    }
    
    // 2. Мигрируем покупки в hookah_history
    console.log('\n📝 Мигрируем покупки в hookah_history...');
    
    const purchases = oldDb.prepare('SELECT * FROM purchases').all();
    console.log(`📊 Найдено ${purchases.length} покупок в старой базе`);
    
    let migratedPurchases = 0;
    for (const purchase of purchases) {
      try {
        // Находим пользователя по tg_id
        const user = await prisma.user.findUnique({
          where: { tg_id: BigInt(purchase.tg_id) }
        });
        
        if (!user) {
          console.log(`⚠️ Пользователь с TG ID ${purchase.tg_id} не найден, пропускаем покупку ${purchase.id}`);
          continue;
        }
        
        await prisma.hookahHistory.create({
          data: {
            user_id: user.id,
            hookah_type: purchase.type || 'regular',
            slot_number: purchase.slot_number || null,
            created_at: new Date(purchase.created_at || Date.now())
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
        
        console.log(`✅ Статистика обновлена для ${user.first_name} ${user.last_name}: ${totalPurchases} покупок`);
      } catch (error) {
        console.error(`❌ Ошибка при обновлении статистики для пользователя ${user.id}:`, error.message);
      }
    }
    
    // Закрываем соединения
    oldDb.close();
    await prisma.$disconnect();
    
    console.log('\n🎉 Миграция из старой базы данных завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при миграции из старой базы данных:', error);
  }
}

migrateFromOldDb();
