const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recreateAdmins() {
  try {
    console.log('🚀 Пересоздаем список администраторов...');
    
    // Список администраторов из старой базы
    const adminTgIds = [
      885843500,
      736766814,
      1159515006,
      2085260735,
      1027936207,
      1347269957,
      610656536,
      883911484,
      6307473739,
      1962719148,
      937011437,
      5916603942,
      5766925451,
      454922712,
      367815510,
      6585577649,
      642604183,
      508089672,
      1016923611
    ];
    
    console.log(`📝 Добавляем ${adminTgIds.length} администраторов...`);
    
    for (const tgId of adminTgIds) {
      try {
        await prisma.adminList.create({
          data: {
            tg_id: tgId,
            created_at: new Date()
          }
        });
        console.log(`✅ Добавлен администратор: ${tgId}`);
      } catch (error) {
        console.log(`⚠️ Ошибка при добавлении ${tgId}: ${error.message}`);
      }
    }
    
    // Проверяем результат
    const adminCount = await prisma.adminList.count();
    console.log(`📊 Итоговое количество администраторов: ${adminCount}`);
    
    // Тестируем получение данных
    const admins = await prisma.adminList.findMany();
    console.log(`✅ Успешно получено ${admins.length} администраторов из базы данных`);
    
  } catch (error) {
    console.error('❌ Ошибка при пересоздании администраторов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmins();
