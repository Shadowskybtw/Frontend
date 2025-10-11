const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestUser() {
  try {
    console.log('🚀 Добавляем тестового пользователя...');
    
    // Создаем тестового пользователя
    const user = await prisma.user.create({
      data: {
        tg_id: 123456789,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'testuser',
        phone: '+7900123456',
        is_admin: false,
        total_purchases: 0
      }
    });
    
    console.log('✅ Тестовый пользователь создан:', user);
    
    // Проверяем количество пользователей
    const userCount = await prisma.user.count();
    console.log(`📊 Всего пользователей в базе: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestUser();
