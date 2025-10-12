const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDateFormats() {
  try {
    console.log('🔧 Исправляем форматы дат в базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    console.log('\n📅 Исправляем форматы дат в таблице users...');
    
    // Исправляем created_at в таблице users
    await prisma.$executeRaw`
      UPDATE users 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    // Исправляем updated_at в таблице users
    await prisma.$executeRaw`
      UPDATE users 
      SET updated_at = datetime(updated_at) || '.000Z'
      WHERE updated_at NOT LIKE '%.%' AND updated_at NOT LIKE '%Z'
    `;
    
    console.log('✅ Поля created_at и updated_at в таблице users исправлены');
    
    console.log('\n📦 Исправляем форматы дат в таблице stocks...');
    
    // Исправляем created_at в таблице stocks
    await prisma.$executeRaw`
      UPDATE stocks 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    // Исправляем updated_at в таблице stocks
    await prisma.$executeRaw`
      UPDATE stocks 
      SET updated_at = datetime(updated_at) || '.000Z'
      WHERE updated_at NOT LIKE '%.%' AND updated_at NOT LIKE '%Z'
    `;
    
    console.log('✅ Поля created_at и updated_at в таблице stocks исправлены');
    
    console.log('\n🎁 Исправляем форматы дат в таблице free_hookahs...');
    
    // Исправляем created_at в таблице free_hookahs
    await prisma.$executeRaw`
      UPDATE free_hookahs 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    // Исправляем used_at в таблице free_hookahs
    await prisma.$executeRaw`
      UPDATE free_hookahs 
      SET used_at = datetime(used_at) || '.000Z'
      WHERE used_at NOT LIKE '%.%' AND used_at NOT LIKE '%Z' AND used_at IS NOT NULL
    `;
    
    console.log('✅ Поля created_at и used_at в таблице free_hookahs исправлены');
    
    console.log('\n📝 Исправляем форматы дат в таблице hookah_history...');
    
    // Исправляем created_at в таблице hookah_history
    await prisma.$executeRaw`
      UPDATE hookah_history 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z' AND created_at IS NOT NULL
    `;
    
    console.log('✅ Поле created_at в таблице hookah_history исправлено');
    
    console.log('\n👑 Исправляем форматы дат в таблице admins...');
    
    // Исправляем created_at в таблице admins
    await prisma.$executeRaw`
      UPDATE admins 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    console.log('✅ Поле created_at в таблице admins исправлено');
    
    console.log('\n📋 Исправляем форматы дат в таблице admin_list...');
    
    // Исправляем created_at в таблице admin_list
    await prisma.$executeRaw`
      UPDATE admin_list 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    console.log('✅ Поле created_at в таблице admin_list исправлено');
    
    console.log('\n🎫 Исправляем форматы дат в таблице free_hookah_requests...');
    
    // Исправляем created_at в таблице free_hookah_requests
    await prisma.$executeRaw`
      UPDATE free_hookah_requests 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    // Исправляем updated_at в таблице free_hookah_requests
    await prisma.$executeRaw`
      UPDATE free_hookah_requests 
      SET updated_at = datetime(updated_at) || '.000Z'
      WHERE updated_at NOT LIKE '%.%' AND updated_at NOT LIKE '%Z'
    `;
    
    console.log('✅ Поля created_at и updated_at в таблице free_hookah_requests исправлены');
    
    console.log('\n⭐ Исправляем форматы дат в таблице hookah_reviews...');
    
    // Исправляем created_at в таблице hookah_reviews
    await prisma.$executeRaw`
      UPDATE hookah_reviews 
      SET created_at = datetime(created_at) || '.000Z'
      WHERE created_at NOT LIKE '%.%' AND created_at NOT LIKE '%Z'
    `;
    
    console.log('✅ Поле created_at в таблице hookah_reviews исправлено');
    
    console.log('\n🎉 Исправление форматов дат завершено!');
    
    // Проверяем, что теперь Prisma может читать данные
    console.log('\n🧪 Тестируем чтение данных через Prisma...');
    try {
      const testUsers = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          created_at: true,
          updated_at: true
        }
      });
      console.log('✅ Prisma успешно читает данные!');
      console.log('Примеры записей:');
      testUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name}: created_at=${user.created_at}, updated_at=${user.updated_at}`);
      });
    } catch (error) {
      console.error('❌ Ошибка при чтении данных через Prisma:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении форматов дат:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDateFormats();