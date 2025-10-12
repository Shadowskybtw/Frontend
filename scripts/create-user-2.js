const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUser2() {
  try {
    console.log('👤 Создаем второго пользователя...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    const tgId = 6922083035;
    
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.$queryRaw`SELECT * FROM users WHERE tg_id = ${tgId}`;
    
    if (existingUser.length > 0) {
      console.log('⚠️ Пользователь уже существует:', existingUser[0]);
      return;
    }
    
    // Создаем пользователя
    console.log('📝 Создаем пользователя с TG ID:', tgId);
    
    const newUser = await prisma.$queryRaw`
      INSERT INTO users (tg_id, first_name, last_name, phone, username, created_at, updated_at, is_admin, total_purchases, total_regular_purchases, total_free_purchases)
      VALUES (${tgId}, 'Николай', 'Гитлер', '+79270036643', 'skywrldbtw', datetime('now'), datetime('now'), 1, 0, 0, 0)
    `;
    
    console.log('✅ Пользователь создан');
    
    // Проверяем созданного пользователя
    const createdUser = await prisma.$queryRaw`SELECT * FROM users WHERE tg_id = ${tgId}`;
    console.log('👤 Созданный пользователь:', createdUser[0]);
    
    console.log('\n🎉 Пользователь успешно создан!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser2();
