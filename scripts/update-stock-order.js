const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateStockOrder() {
  try {
    console.log('🔄 Обновляем порядок stocks...');
    
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
    
    // Обновляем stock "5+1 кальян" чтобы он был самым новым
    const stock5Plus1 = await prisma.stock.findFirst({
      where: { 
        user_id: user.id,
        stock_name: '5+1 кальян'
      }
    });
    
    if (stock5Plus1) {
      // Обновляем updated_at чтобы stock был первым в списке
      await prisma.stock.update({
        where: { id: stock5Plus1.id },
        data: { 
          updated_at: new Date(),
          progress: 80 // Убеждаемся что прогресс правильный
        }
      });
      
      console.log(`✅ Stock "5+1 кальян" обновлен: ID ${stock5Plus1.id}, Прогресс: 80%`);
    } else {
      console.log(`❌ Stock "5+1 кальян" не найден!`);
    }
    
    // Проверяем порядок stocks
    console.log('\n📋 Порядок stocks после обновления:');
    const stocks = await prisma.stock.findMany({
      where: { user_id: user.id },
      orderBy: { updated_at: 'desc' }
    });
    
    stocks.forEach((stock, index) => {
      console.log(`   ${index + 1}. ID: ${stock.id}, Название: "${stock.stock_name}", Прогресс: ${stock.progress}%`);
    });
    
    console.log('\n🎉 Обновление завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении порядка stocks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStockOrder();
