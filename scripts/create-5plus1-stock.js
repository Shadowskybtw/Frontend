const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function create5Plus1Stock() {
  try {
    console.log('🎯 Создаем stock "5+1 кальян" для пользователя...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Находим пользователя с tg_id = 937011437
    const user = await prisma.user.findUnique({
      where: { tg_id: 937011437 }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log(`👤 Пользователь: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    
    // Проверяем, есть ли уже stock "5+1 кальян"
    const existingStock = await prisma.stock.findFirst({
      where: { 
        user_id: user.id,
        stock_name: '5+1 кальян'
      }
    });
    
    if (existingStock) {
      console.log(`✅ Stock "5+1 кальян" уже существует: ID ${existingStock.id}, Прогресс: ${existingStock.progress}%`);
      
      // Обновляем прогресс на 80% (4 из 5 слотов)
      const updatedStock = await prisma.stock.update({
        where: { id: existingStock.id },
        data: { progress: 80 }
      });
      
      console.log(`✅ Прогресс обновлен: ${updatedStock.progress}%`);
    } else {
      console.log(`📦 Создаем новый stock "5+1 кальян"...`);
      
      // Создаем новый stock с прогрессом 80% (4 из 5 слотов)
      const newStock = await prisma.stock.create({
        data: {
          user_id: user.id,
          stock_name: '5+1 кальян',
          progress: 80,
          promotion_completed: false
        }
      });
      
      console.log(`✅ Stock создан: ID ${newStock.id}, Прогресс: ${newStock.progress}%`);
    }
    
    // Проверяем все stocks пользователя
    const allStocks = await prisma.stock.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`\n📋 Все stocks пользователя (${allStocks.length} записей):`);
    allStocks.forEach((stock, index) => {
      console.log(`   ${index + 1}. ID: ${stock.id}, Название: "${stock.stock_name}", Прогресс: ${stock.progress}%`);
    });
    
    // Проверяем статистику
    const stock5Plus1 = allStocks.find(s => s.stock_name === '5+1 кальян');
    if (stock5Plus1) {
      const slotsFilled = Math.floor(stock5Plus1.progress / 20);
      const slotsRemaining = 5 - slotsFilled;
      
      console.log(`\n📊 Статистика "5+1 кальян":`);
      console.log(`   Заполнено слотов: ${slotsFilled}/5`);
      console.log(`   Осталось до бесплатного: ${slotsRemaining}`);
      console.log(`   Прогресс: ${stock5Plus1.progress}%`);
    }
    
    console.log('\n🎉 Создание stock завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании stock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

create5Plus1Stock();
