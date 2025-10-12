const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicateUsers() {
  try {
    console.log('🔍 Проверяем дублирующихся пользователей...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Ищем всех пользователей с tg_id = 937011437
    const duplicateUsers = await prisma.user.findMany({
      where: { tg_id: 937011437 },
      orderBy: { id: 'asc' }
    });
    
    console.log(`\n👥 Найдено пользователей с tg_id = 937011437: ${duplicateUsers.length}`);
    
    duplicateUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Имя: ${user.first_name} ${user.last_name}, Телефон: ${user.phone}, Создан: ${user.created_at}`);
    });
    
    if (duplicateUsers.length > 1) {
      console.log(`\n⚠️  ПРОБЛЕМА: Есть дублирующиеся пользователи с одинаковым tg_id!`);
      
      // Проверяем, у какого пользователя есть stocks и история
      for (const user of duplicateUsers) {
        const stocks = await prisma.stock.findMany({
          where: { user_id: user.id }
        });
        
        const history = await prisma.hookahHistory.findMany({
          where: { user_id: user.id },
          take: 5
        });
        
        const freeHookahs = await prisma.freeHookah.findMany({
          where: { user_id: user.id }
        });
        
        console.log(`\n📊 Пользователь ${user.first_name} ${user.last_name} (ID: ${user.id}):`);
        console.log(`   📦 Stocks: ${stocks.length}`);
        console.log(`   📝 История кальянов: ${history.length}`);
        console.log(`   🎁 Бесплатные кальяны: ${freeHookahs.length}`);
        
        if (stocks.length > 0) {
          console.log(`   📋 Stocks:`, stocks.map(s => `"${s.stock_name}" (${s.progress}%)`));
        }
      }
    }
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке дублирующихся пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicateUsers();
