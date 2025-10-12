const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTgIdType() {
  try {
    console.log('🔧 Исправляем тип поля tg_id на BIGINT...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Используем raw SQL для изменения типа колонки
    console.log('\n📝 Изменяем тип tg_id в таблице users...');
    await prisma.$executeRaw`ALTER TABLE users ALTER COLUMN tg_id TYPE BIGINT`;
    console.log('✅ Поле tg_id в таблице users изменено на BIGINT');
    
    console.log('\n📝 Изменяем тип tg_id в таблице admin_list...');
    await prisma.$executeRaw`ALTER TABLE admin_list ALTER COLUMN tg_id TYPE BIGINT`;
    console.log('✅ Поле tg_id в таблице admin_list изменено на BIGINT');
    
    // Проверяем, что изменения применились
    console.log('\n🧪 Тестируем создание пользователя с большим TG ID...');
    
    try {
      const testUser = await prisma.user.create({
        data: {
          tg_id: 6922083035,
          first_name: 'Тест',
          last_name: 'Пользователь',
          username: 'testuser',
          phone: '+79999999999'
        }
      });
      console.log('✅ Пользователь с большим TG ID создан:', testUser);
      
      // Удаляем тестового пользователя
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      console.log('✅ Тестовый пользователь удален');
      
    } catch (error) {
      console.error('❌ Ошибка при создании тестового пользователя:', error.message);
    }
    
    console.log('\n🎉 Исправление типа tg_id завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении типа tg_id:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTgIdType();
