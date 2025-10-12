const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser2() {
  try {
    console.log('🔍 Проверяем пользователя 2 в базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    const tgId = 6922083035;
    
    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { tg_id: tgId }
    });
    
    if (user) {
      console.log(`👤 Пользователь найден:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   TG ID: ${user.tg_id}`);
      console.log(`   Имя: ${user.first_name} ${user.last_name}`);
      console.log(`   Телефон: ${user.phone}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Админ: ${user.is_admin}`);
      console.log(`   Всего покупок: ${user.total_purchases}`);
      
      // Проверяем stocks
      const stocks = await prisma.stock.findMany({
        where: { user_id: user.id }
      });
      console.log(`\n📦 Stocks: ${stocks.length} записей`);
      
      // Проверяем историю
      const history = await prisma.hookahHistory.findMany({
        where: { user_id: user.id }
      });
      console.log(`📝 История кальянов: ${history.length} записей`);
      
      // Проверяем бесплатные кальяны
      const freeHookahs = await prisma.freeHookah.findMany({
        where: { user_id: user.id }
      });
      console.log(`🎁 Бесплатные кальяны: ${freeHookahs.length} записей`);
      
    } else {
      console.log(`❌ Пользователь с tg_id = ${tgId} не найден в базе данных`);
      
      // Проверяем, есть ли пользователи с похожими данными
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { first_name: { contains: 'Николай' } },
            { last_name: { contains: 'Гитлер' } },
            { username: { contains: 'skywrldbtw' } }
          ]
        }
      });
      
      console.log(`\n🔍 Похожие пользователи (${similarUsers.length}):`);
      similarUsers.forEach((u, index) => {
        console.log(`   ${index + 1}. ID: ${u.id}, TG: ${u.tg_id}, Имя: ${u.first_name} ${u.last_name}, Username: ${u.username}`);
      });
    }
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser2();
