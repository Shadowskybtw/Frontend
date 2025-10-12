const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGetAllUsers() {
  try {
    console.log('🧪 Тестируем функцию getAllUsers...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Тестируем Prisma запрос напрямую
    console.log('\n📋 Тестируем Prisma запрос...');
    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 5
    });
    
    console.log(`✅ Prisma запрос работает! Найдено пользователей: ${users.length}`);
    
    users.forEach((user, index) => {
      const phoneDigits = user.phone.replace(/\D/g, '');
      const last4 = phoneDigits.slice(-4);
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name}: ${user.phone} (последние 4: ${last4})`);
    });
    
    // Ищем пользователя с последними 4 цифрами 6642
    console.log('\n🔍 Ищем пользователя с последними 4 цифрами 6642...');
    const targetUser = users.find(u => {
      const phoneDigits = u.phone.replace(/\D/g, '');
      return phoneDigits.endsWith('6642');
    });
    
    if (targetUser) {
      console.log(`✅ Найден пользователь: ${targetUser.first_name} ${targetUser.last_name} (TG: ${targetUser.tg_id})`);
    } else {
      console.log('❌ Пользователь с последними 4 цифрами 6642 не найден в первых 5 записях');
      
      // Ищем во всех пользователях
      console.log('\n🔍 Ищем во всех пользователях...');
      const allUsers = await prisma.user.findMany({
        orderBy: { id: 'desc' }
      });
      
      const foundUser = allUsers.find(u => {
        const phoneDigits = u.phone.replace(/\D/g, '');
        return phoneDigits.endsWith('6642');
      });
      
      if (foundUser) {
        console.log(`✅ Найден пользователь: ${foundUser.first_name} ${foundUser.last_name} (TG: ${foundUser.tg_id})`);
      } else {
        console.log('❌ Пользователь с последними 4 цифрами 6642 не найден');
      }
    }
    
    console.log('\n🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании getAllUsers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGetAllUsers();
