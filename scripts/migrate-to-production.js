const { PrismaClient } = require('@prisma/client');

async function migrateToProduction() {
  console.log('🚀 Начинаем миграцию данных на PostgreSQL...');
  
  // Сначала переключаемся на PostgreSQL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.POSTGRES_URL
      }
    }
  });

  try {
    // Проверяем подключение к PostgreSQL
    await prisma.$connect();
    console.log('✅ Подключение к PostgreSQL успешно');

    // Проверяем текущие данные
    const users = await prisma.user.findMany();
    console.log(`📊 Текущие пользователи в PostgreSQL: ${users.length}`);

    if (users.length === 0) {
      console.log('📝 Создаем тестовых пользователей...');
      
      // Создаем пользователя 1: Тестовый Пользователь
      const user1 = await prisma.user.create({
        data: {
          tg_id: BigInt(123456789),
          first_name: 'Тестовый',
          last_name: 'Пользователь',
          phone: '+7900123456',
          username: 'testuser',
          created_at: new Date('2024-01-01T10:00:00.000Z'),
          updated_at: new Date(),
          is_admin: false,
          total_purchases: 5,
          total_regular_purchases: 3,
          total_free_purchases: 2
        }
      });
      console.log(`✅ Создан пользователь 1: ${user1.first_name} ${user1.last_name} (TG: ${user1.tg_id})`);

      // Создаем пользователя 2: Николай Шадовский
      const user2 = await prisma.user.create({
        data: {
          tg_id: BigInt(937011437),
          first_name: 'Николай',
          last_name: 'Шадовский',
          phone: '+79270036642',
          username: 'shadowskydie',
          created_at: new Date('2024-06-06T16:33:45.601Z'),
          updated_at: new Date('2024-10-12T15:00:42.000Z'),
          is_admin: true,
          total_purchases: 11,
          total_regular_purchases: 9,
          total_free_purchases: 2
        }
      });
      console.log(`✅ Создан пользователь 2: ${user2.first_name} ${user2.last_name} (TG: ${user2.tg_id})`);

      // Создаем историю для пользователя 1 (5 записей)
      const history1 = [
        { hookah_type: 'regular', created_at: new Date('2024-01-15T14:30:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-02-20T16:45:00.000Z') },
        { hookah_type: 'free', created_at: new Date('2024-03-10T13:15:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-04-05T18:20:00.000Z') },
        { hookah_type: 'free', created_at: new Date('2024-05-12T15:30:00.000Z') }
      ];

      for (const h of history1) {
        await prisma.hookahHistory.create({
          data: {
            user_id: user1.id,
            hookah_type: h.hookah_type,
            slot_number: null,
            created_at: h.created_at
          }
        });
      }
      console.log(`✅ Создана история для пользователя 1: ${history1.length} записей`);

      // Создаем историю для пользователя 2 (11 записей)
      const history2 = [
        { hookah_type: 'regular', created_at: new Date('2024-06-06T16:33:45.601Z') },
        { hookah_type: 'regular', created_at: new Date('2024-06-15T14:20:00.000Z') },
        { hookah_type: 'free', created_at: new Date('2024-07-01T16:45:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-07-10T13:15:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-07-20T18:20:00.000Z') },
        { hookah_type: 'free', created_at: new Date('2024-08-05T15:30:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-08-15T17:45:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-09-01T14:30:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-09-15T16:15:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-10-01T13:45:00.000Z') },
        { hookah_type: 'regular', created_at: new Date('2024-10-12T15:00:42.000Z') }
      ];

      for (const h of history2) {
        await prisma.hookahHistory.create({
          data: {
            user_id: user2.id,
            hookah_type: h.hookah_type,
            slot_number: null,
            created_at: h.created_at
          }
        });
      }
      console.log(`✅ Создана история для пользователя 2: ${history2.length} записей`);

      // Создаем акцию "5+1 кальян" для пользователя 2
      const stock = await prisma.stock.create({
        data: {
          user_id: user2.id,
          stock_name: '5+1 кальян',
          total_slots: 5,
          used_slots: 4,
          created_at: new Date('2024-06-06T16:33:45.601Z'),
          updated_at: new Date()
        }
      });
      console.log(`✅ Создана акция: ${stock.stock_name} (${stock.used_slots}/${stock.total_slots})`);

      console.log('🎉 Миграция данных завершена успешно!');
    } else {
      console.log('⚠️ Пользователи уже существуют в PostgreSQL');
    }

    // Финальная проверка
    const finalUsers = await prisma.user.findMany();
    const finalHistory = await prisma.hookahHistory.findMany();
    const finalStocks = await prisma.stock.findMany();

    console.log('\n📊 Финальная статистика:');
    console.log(`👥 Пользователи: ${finalUsers.length}`);
    console.log(`📝 История: ${finalHistory.length} записей`);
    console.log(`📦 Акции: ${finalStocks.length} записей`);

    finalUsers.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name} (TG: ${user.tg_id}, Покупок: ${user.total_purchases})`);
    });

  } catch (error) {
    console.error('❌ Ошибка при миграции:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем миграцию
migrateToProduction();
