const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('🧪 Тестируем API check-or-register...');
    
    // Тестируем поиск существующего пользователя
    const testTgId = 937011437; // Тестовый админ
    
    console.log(`🔍 Ищем пользователя с TG ID: ${testTgId}`);
    
    const user = await prisma.user.findUnique({
      where: { tg_id: testTgId }
    });
    
    if (user) {
      console.log('✅ Пользователь найден:', {
        id: user.id,
        tg_id: user.tg_id,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin
      });
    } else {
      console.log('❌ Пользователь не найден');
    }
    
    // Тестируем создание нового пользователя
    console.log('🆕 Тестируем создание нового пользователя...');
    
    // Генерируем уникальный TG ID в пределах INT
    const uniqueTgId = Math.floor(Math.random() * 1000000000) + 1000000000;
    
    const now = new Date().toISOString();
    
    // Используем raw SQL для создания пользователя
    const result = await prisma.$executeRaw`
      INSERT INTO users (tg_id, first_name, last_name, phone, username, created_at, updated_at, is_admin, total_purchases, total_regular_purchases, total_free_purchases)
      VALUES (${uniqueTgId}, 'Тестовый', 'Пользователь', '+7999999999', 'testuser', ${now}, ${now}, 0, 0, 0, 0)
    `;
    
    // Получаем созданного пользователя
    const newUser = await prisma.user.findUnique({
      where: { tg_id: uniqueTgId }
    });
    
    console.log('✅ Новый пользователь создан:', newUser);
    
    // Удаляем тестового пользователя
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    
    console.log('🗑️ Тестовый пользователь удален');
    
    console.log('🎉 API тестирование завершено успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
