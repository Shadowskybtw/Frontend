const { PrismaClient } = require('@prisma/client');

async function testPrismaDirect() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Тестируем Prisma клиент напрямую...');
    
    // Подключаемся к базе данных
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно');
    
    // Получаем пользователей
    const users = await prisma.user.findMany();
    console.log(`👥 Найдено пользователей: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (TG ID: ${user.tg_id})`);
    });
    
    // Получаем администраторов
    const admins = await prisma.adminList.findMany();
    console.log(`👑 Найдено администраторов: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`   - TG ID: ${admin.tg_id}`);
    });
    
    // Получаем запасы
    const stocks = await prisma.stock.findMany();
    console.log(`📦 Найдено запасов: ${stocks.length}`);
    
    // Получаем бесплатные кальяны
    const freeHookahs = await prisma.freeHookah.findMany();
    console.log(`🎁 Найдено бесплатных кальянов: ${freeHookahs.length}`);
    
    console.log('🎉 Prisma клиент работает корректно!');
    
  } catch (error) {
    console.error('❌ Ошибка Prisma клиента:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaDirect();
