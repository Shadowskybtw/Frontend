const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPhone() {
  try {
    console.log('📞 Проверяем номер телефона пользователя...');
    
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
    
    console.log(`👤 Пользователь: ${user.first_name} ${user.last_name} (TG: ${user.tg_id})`);
    console.log(`📞 Номер телефона: ${user.phone}`);
    
    // Извлекаем последние 4 цифры
    const phoneDigits = user.phone.replace(/\D/g, '');
    const last4Digits = phoneDigits.slice(-4);
    console.log(`🔢 Последние 4 цифры: ${last4Digits}`);
    
    // Проверяем, как работает поиск в API search-user
    console.log(`\n🔍 Тестируем поиск по номеру: ${last4Digits}`);
    
    // Получаем всех пользователей и проверяем поиск
    const allUsers = await prisma.user.findMany();
    
    const foundUser = allUsers.find(u => {
      const userPhoneDigits = u.phone.replace(/\D/g, '');
      return userPhoneDigits.endsWith(last4Digits);
    });
    
    if (foundUser) {
      console.log(`✅ Пользователь найден: ${foundUser.first_name} ${foundUser.last_name} (TG: ${foundUser.tg_id})`);
    } else {
      console.log(`❌ Пользователь не найден по номеру ${last4Digits}`);
    }
    
    // Показываем все номера телефонов в базе
    console.log(`\n📋 Все номера телефонов в базе данных:`);
    allUsers.forEach((u, index) => {
      const phoneDigits = u.phone.replace(/\D/g, '');
      const last4 = phoneDigits.slice(-4);
      console.log(`   ${index + 1}. ${u.first_name} ${u.last_name}: ${u.phone} (последние 4: ${last4})`);
    });
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке номера телефона:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPhone();
