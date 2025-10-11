const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log('🚀 Создаем тестового администратора...');
    
    // Создаем тестового администратора
    const adminUser = await prisma.user.create({
      data: {
        tg_id: 937011437, // Основной админ
        first_name: 'Тестовый',
        last_name: 'Админ',
        username: 'testadmin',
        phone: '+7900111111',
        is_admin: true,
        total_purchases: 0
      }
    });
    
    console.log('✅ Тестовый администратор создан:', adminUser);
    
    // Добавляем в список администраторов
    await prisma.adminList.create({
      data: {
        tg_id: 937011437,
        created_at: new Date()
      }
    });
    
    console.log('✅ Администратор добавлен в список админов');
    
    // Проверяем результат
    const userCount = await prisma.user.count();
    const adminCount = await prisma.adminList.count();
    
    console.log(`📊 Итоговые данные:`);
    console.log(`   - Пользователей: ${userCount}`);
    console.log(`   - Администраторов: ${adminCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестового администратора:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();
