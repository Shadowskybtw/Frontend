const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check5Plus1Stocks() {
  try {
    console.log('🔍 Проверяем stocks с названием "5+1 кальян"...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Ищем все stocks с названием "5+1 кальян"
    const stocks5Plus1 = await prisma.stock.findMany({
      where: { stock_name: '5+1 кальян' },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            tg_id: true
          }
        }
      }
    });
    
    console.log(`\n📦 Stocks с названием "5+1 кальян" (${stocks5Plus1.length} записей):`);
    stocks5Plus1.forEach((stock, index) => {
      console.log(`   ${index + 1}. ID: ${stock.id}, Пользователь: ${stock.user.first_name} ${stock.user.last_name} (TG: ${stock.user.tg_id}), Прогресс: ${stock.progress}%`);
    });
    
    // Проверяем пользователя с tg_id = 937011437
    const user = await prisma.user.findUnique({
      where: { tg_id: 937011437 }
    });
    
    if (user) {
      console.log(`\n👤 Пользователь: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
      
      // Ищем stock "5+1 кальян" у этого пользователя
      const userStock5Plus1 = await prisma.stock.findFirst({
        where: { 
          user_id: user.id,
          stock_name: '5+1 кальян'
        }
      });
      
      if (userStock5Plus1) {
        console.log(`✅ У пользователя есть stock "5+1 кальян": ID ${userStock5Plus1.id}, Прогресс: ${userStock5Plus1.progress}%`);
      } else {
        console.log(`❌ У пользователя НЕТ stock "5+1 кальян"`);
        
        // Проверяем, есть ли stock с прогрессом 80%
        const stockWithProgress = await prisma.stock.findFirst({
          where: { 
            user_id: user.id,
            progress: 80
          }
        });
        
        if (stockWithProgress) {
          console.log(`🔍 Найден stock с прогрессом 80%: ID ${stockWithProgress.id}, Название: "${stockWithProgress.stock_name}"`);
        } else {
          console.log(`❌ У пользователя нет stock с прогрессом 80%`);
        }
        
        // Проверяем все stocks пользователя
        const allUserStocks = await prisma.stock.findMany({
          where: { user_id: user.id }
        });
        
        console.log(`\n📋 Все stocks пользователя:`);
        allUserStocks.forEach((stock, index) => {
          console.log(`   ${index + 1}. ID: ${stock.id}, Название: "${stock.stock_name}", Прогресс: ${stock.progress}%`);
        });
      }
    }
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке stocks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check5Plus1Stocks();
