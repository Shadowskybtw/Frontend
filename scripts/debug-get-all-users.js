const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugGetAllUsers() {
  try {
    console.log('🔍 Отладка функции getAllUsers...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Получаем всех пользователей без сортировки по created_at
    console.log('\n📋 Получаем всех пользователей...');
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        tg_id: true,
        first_name: true,
        last_name: true,
        phone: true,
        username: true
      }
    });
    
    console.log(`✅ Найдено пользователей: ${users.length}`);
    
    users.forEach((user, index) => {
      const phoneDigits = user.phone.replace(/\D/g, '');
      const last4 = phoneDigits.slice(-4);
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (TG: ${user.tg_id}): ${user.phone} (последние 4: ${last4})`);
    });
    
    // Проверяем поиск по номеру 6642
    console.log('\n🔍 Ищем пользователя с последними 4 цифрами 6642...');
    const targetUser = users.find(u => {
      const phoneDigits = u.phone.replace(/\D/g, '');
      return phoneDigits.endsWith('6642');
    });
    
    if (targetUser) {
      console.log(`✅ Найден пользователь: ${targetUser.first_name} ${targetUser.last_name} (TG: ${targetUser.tg_id})`);
    } else {
      console.log('❌ Пользователь с последними 4 цифрами 6642 не найден');
    }
    
    console.log('\n🎉 Отладка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при отладке getAllUsers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugGetAllUsers();
