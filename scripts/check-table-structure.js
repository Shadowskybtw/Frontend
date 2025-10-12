const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    console.log('🔍 Проверяем структуру таблиц...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Используем raw SQL для проверки структуры
    console.log('\n📋 Структура таблицы users:');
    const usersStructure = await prisma.$queryRaw`PRAGMA table_info(users)`;
    console.log(usersStructure);
    
    console.log('\n📋 Структура таблицы admin_list:');
    const adminListStructure = await prisma.$queryRaw`PRAGMA table_info(admin_list)`;
    console.log(adminListStructure);
    
    // Проверяем данные в таблице users
    console.log('\n👥 Пользователи в таблице users:');
    const users = await prisma.$queryRaw`SELECT id, tg_id, first_name, last_name, username FROM users LIMIT 10`;
    console.log(users);
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке структуры:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();
