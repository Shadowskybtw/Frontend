const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHistoryData() {
  try {
    console.log('🔍 Проверяем данные истории кальянов в базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Получаем общую статистику
    const totalUsers = await prisma.user.count();
    const totalHistory = await prisma.hookahHistory.count();
    const totalReviews = await prisma.hookahReview.count();
    
    console.log('📊 Общая статистика:');
    console.log(`   👥 Пользователей: ${totalUsers}`);
    console.log(`   📝 Записей истории: ${totalHistory}`);
    console.log(`   ⭐ Отзывов: ${totalReviews}`);
    
    // Проверяем пользователя с tg_id = 937011437
    const testUser = await prisma.user.findUnique({
      where: { tg_id: 937011437 }
    });
    
    if (testUser) {
      console.log(`\n👤 Тестовый пользователь найден: ${testUser.first_name} ${testUser.last_name}`);
      console.log(`   ID: ${testUser.id}`);
      console.log(`   TG ID: ${testUser.tg_id}`);
      console.log(`   Телефон: ${testUser.phone}`);
      
      // Получаем историю для этого пользователя
      const userHistory = await prisma.hookahHistory.findMany({
        where: { user_id: testUser.id },
        orderBy: { created_at: 'desc' },
        take: 10
      });
      
      console.log(`\n📝 История кальянов (последние 10 записей):`);
      console.log(`   Всего записей: ${userHistory.length}`);
      
      userHistory.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Тип: ${record.hookah_type}, Дата: ${record.created_at}`);
      });
      
      // Проверяем отзывы
      const userReviews = await prisma.hookahReview.findMany({
        where: { user_id: testUser.id },
        take: 5
      });
      
      console.log(`\n⭐ Отзывы (последние 5):`);
      console.log(`   Всего отзывов: ${userReviews.length}`);
      
      userReviews.forEach((review, index) => {
        console.log(`   ${index + 1}. Кальян ID: ${review.hookah_id}, Рейтинг: ${review.rating}, Текст: ${review.review_text || 'Нет'}`);
      });
      
    } else {
      console.log('❌ Тестовый пользователь с tg_id = 937011437 не найден');
    }
    
    // Проверяем последние записи истории
    console.log(`\n📝 Последние 5 записей истории (все пользователи):`);
    const recentHistory = await prisma.hookahHistory.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
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
    
    recentHistory.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.user.first_name} ${record.user.last_name} (TG: ${record.user.tg_id}) - ${record.hookah_type} - ${record.created_at}`);
    });
    
    console.log('\n🎉 Проверка данных завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHistoryData();
