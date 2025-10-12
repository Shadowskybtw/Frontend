const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserData() {
  try {
    console.log('🔄 Обновляем данные пользователя...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Находим пользователя с tg_id = 937011437 используя raw SQL
    const userResult = await prisma.$queryRaw`
      SELECT id, first_name, last_name, phone, username 
      FROM users 
      WHERE tg_id = 937011437
    `;
    
    if (!userResult || userResult.length === 0) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    const user = userResult[0];
    console.log(`👤 Текущие данные пользователя:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Имя: ${user.first_name} ${user.last_name}`);
    console.log(`   Телефон: ${user.phone}`);
    console.log(`   Username: ${user.username}`);
    
    // Обновляем данные пользователя на актуальные из Telegram
    // Используем raw SQL чтобы избежать проблем с типами данных
    await prisma.$executeRaw`
      UPDATE users 
      SET first_name = 'Николай', 
          last_name = 'Шадовский', 
          phone = '+79270036642',
          username = 'shadowskydie'
      WHERE tg_id = 937011437
    `;
    
    // Получаем обновленного пользователя используя raw SQL
    const updatedUserResult = await prisma.$queryRaw`
      SELECT id, first_name, last_name, phone, username 
      FROM users 
      WHERE tg_id = 937011437
    `;
    const updatedUser = updatedUserResult[0];
    
    console.log(`\n✅ Данные пользователя обновлены:`);
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Имя: ${updatedUser.first_name} ${updatedUser.last_name}`);
    console.log(`   Телефон: ${updatedUser.phone}`);
    console.log(`   Username: ${updatedUser.username}`);
    
    // Проверяем, что stocks и история остались используя raw SQL
    const stocksResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM stocks WHERE user_id = ${updatedUser.id}
    `;
    const stocksCount = stocksResult[0].count;
    
    const historyResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM hookah_history WHERE user_id = ${updatedUser.id}
    `;
    const historyCount = historyResult[0].count;
    
    console.log(`\n📊 Данные сохранены:`);
    console.log(`   📦 Stocks: ${stocksCount}`);
    console.log(`   📝 История кальянов: ${historyCount}`);
    
    console.log('\n🎉 Обновление завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении данных пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserData();
