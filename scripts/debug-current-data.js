const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCurrentData() {
  try {
    console.log('🔍 Отладка текущих данных пользователя...');
    
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
    
    // Проверяем stocks
    console.log('\n📦 Stocks пользователя:');
    const stocks = await prisma.stock.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });
    
    stocks.forEach((stock, index) => {
      console.log(`   ${index + 1}. ID: ${stock.id}, Название: "${stock.stock_name}", Прогресс: ${stock.progress}%`);
    });
    
    // Проверяем stock "5+1 кальян"
    const stock5Plus1 = stocks.find(s => s.stock_name === '5+1 кальян');
    if (stock5Plus1) {
      const slotsFilled = Math.floor(stock5Plus1.progress / 20);
      const slotsRemaining = 5 - slotsFilled;
      console.log(`\n🎯 Stock "5+1 кальян":`);
      console.log(`   Прогресс: ${stock5Plus1.progress}%`);
      console.log(`   Заполнено слотов: ${slotsFilled}/5`);
      console.log(`   Осталось до бесплатного: ${slotsRemaining}`);
    } else {
      console.log('\n❌ Stock "5+1 кальян" не найден!');
    }
    
    // Проверяем историю кальянов
    console.log('\n📝 История кальянов:');
    const history = await prisma.hookahHistory.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    console.log(`   Всего записей: ${history.length}`);
    if (history.length > 0) {
      console.log('   Последние 10 записей:');
      history.forEach((record, index) => {
        console.log(`     ${index + 1}. ID: ${record.id}, Тип: ${record.hookah_type}, Дата: ${record.created_at}`);
      });
    }
    
    // Статистика по типам кальянов
    const regularCount = history.filter(h => h.hookah_type === 'regular').length;
    const freeCount = history.filter(h => h.hookah_type === 'free').length;
    
    console.log(`\n📊 Статистика кальянов:`);
    console.log(`   🔵 Обычные кальяны: ${regularCount}`);
    console.log(`   🟢 Бесплатные кальяны: ${freeCount}`);
    console.log(`   📋 Всего кальянов: ${history.length}`);
    
    // Проверяем бесплатные кальяны
    console.log('\n🎁 Бесплатные кальяны:');
    const freeHookahs = await prisma.freeHookah.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`   Всего записей: ${freeHookahs.length}`);
    if (freeHookahs.length > 0) {
      const unusedCount = freeHookahs.filter(h => !h.used).length;
      console.log(`   Неиспользованных: ${unusedCount}`);
      console.log(`   Использованных: ${freeHookahs.length - unusedCount}`);
    }
    
    // Проверяем отзывы
    console.log('\n⭐ Отзывы:');
    const reviews = await prisma.hookahReview.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });
    
    console.log(`   Всего отзывов: ${reviews.length}`);
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      console.log(`   Средняя оценка: ${avgRating.toFixed(1)}/5`);
    }
    
    console.log('\n🎉 Отладка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при отладке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCurrentData();
