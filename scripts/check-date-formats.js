const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDateFormats() {
  try {
    console.log('🔍 Проверяем форматы дат в базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Проверяем разные форматы дат в таблице users
    console.log('\n📅 Проверяем форматы дат в таблице users...');
    
    const dateFormats = await prisma.$queryRaw`
      SELECT DISTINCT 
        substr(created_at, 1, 20) as created_at_sample,
        substr(updated_at, 1, 20) as updated_at_sample,
        COUNT(*) as count
      FROM users 
      GROUP BY substr(created_at, 1, 20), substr(updated_at, 1, 20)
      ORDER BY count DESC
      LIMIT 10
    `;
    
    console.log('Форматы дат в таблице users:');
    dateFormats.forEach((format, index) => {
      console.log(`   ${index + 1}. created_at: "${format.created_at_sample}", updated_at: "${format.updated_at_sample}", count: ${format.count}`);
    });
    
    // Проверяем конкретные записи
    console.log('\n📋 Примеры записей:');
    const samples = await prisma.$queryRaw`
      SELECT id, first_name, last_name, created_at, updated_at
      FROM users 
      ORDER BY id DESC
      LIMIT 5
    `;
    
    samples.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Имя: ${user.first_name} ${user.last_name}`);
      console.log(`      created_at: "${user.created_at}" (тип: ${typeof user.created_at})`);
      console.log(`      updated_at: "${user.updated_at}" (тип: ${typeof user.updated_at})`);
    });
    
    console.log('\n🎉 Проверка завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при проверке форматов дат:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDateFormats();
