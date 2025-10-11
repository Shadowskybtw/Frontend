const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testWebApp() {
  try {
    console.log('🧪 Тестируем WebApp...');
    
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log('✅ База данных подключена');
    
    // Проверяем пользователей
    const userCount = await prisma.user.count();
    console.log(`📊 Пользователей в базе: ${userCount}`);
    
    // Проверяем администраторов
    const adminCount = await prisma.adminList.count();
    console.log(`👑 Администраторов в базе: ${adminCount}`);
    
    // Проверяем запасы
    const stockCount = await prisma.stock.count();
    console.log(`📦 Запасов в базе: ${stockCount}`);
    
    // Проверяем бесплатные кальяны
    const freeHookahCount = await prisma.freeHookah.count();
    console.log(`🎁 Бесплатных кальянов в базе: ${freeHookahCount}`);
    
    // Проверяем историю
    const historyCount = await prisma.hookahHistory.count();
    console.log(`📝 Записей в истории: ${historyCount}`);
    
    // Тестируем поиск пользователя
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      console.log(`👤 Тестовый пользователь: ${testUser.first_name} ${testUser.last_name} (TG ID: ${testUser.tg_id})`);
      
      // Проверяем, является ли он администратором
      const isAdmin = await prisma.adminList.findFirst({
        where: { tg_id: testUser.tg_id }
      });
      console.log(`🔐 Является администратором: ${isAdmin ? 'Да' : 'Нет'}`);
    }
    
    console.log('🎉 Все тесты прошли успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWebApp();
