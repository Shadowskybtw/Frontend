const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserStocks() {
  try {
    console.log('🔍 Проверяем stocks пользователя...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Получаем пользователя с tg_id = 937011437
    const user = await prisma.user.findUnique({
      where: { tg_id: 937011437 }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log(`👤 Пользователь: ${user.first_name} ${user.last_name} (ID: ${user.id})`);
    
    // Получаем все stocks пользователя
    const stocks = await prisma.stock.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`\n📦 Stocks пользователя (${stocks.length} записей):`);
    stocks.forEach((stock, index) => {
      console.log(`   ${index + 1}. ID: ${stock.id}, Название: "${stock.stock_name}", Прогресс: ${stock.progress}%, Завершено: ${stock.promotion_completed}`);
    });
    
    // Ищем stock с названием "5+1 кальян"
    const targetStock = stocks.find(s => s.stock_name === '5+1 кальян');
    if (targetStock) {
      console.log(`\n✅ Найден stock "5+1 кальян": ID ${targetStock.id}, Прогресс: ${targetStock.progress}%`);
    } else {
      console.log(`\n❌ Stock "5+1 кальян" не найден`);
      console.log(`   Доступные названия: ${stocks.map(s => `"${s.stock_name}"`).join(', ')}`);
    }
    
    // Проверяем историю кальянов
    const history = await prisma.hookahHistory.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    console.log(`\n📝 История кальянов (последние 10 записей):`);
    history.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}, Тип: ${record.hookah_type}, Дата: ${record.created_at}`);
    });
    
    // Статистика по типам кальянов
    const regularCount = history.filter(h => h.hookah_type === 'regular').length;
    const freeCount = history.filter(h => h.hookah_type === 'free').length;
    
    console.log(`\n📊 Статистика кальянов:`);
    console.log(`   🔵 Обычные кальяны: ${regularCount}`);
    console.log(`   🟢 Бесплатные кальяны: ${freeCount}`);
    console.log(`   📋 Всего кальянов: ${history.length}`);
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке stocks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStocks();
