const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTimestampFields() {
  try {
    console.log('🔧 Исправляем поля timestamp в базе данных...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Функция для конвертации timestamp в миллисекундах в ISO строку
    function convertTimestamp(timestamp) {
      if (typeof timestamp === 'string' && /^\d{13}$/.test(timestamp)) {
        // Это timestamp в миллисекундах
        return new Date(parseInt(timestamp)).toISOString();
      } else if (typeof timestamp === 'string' && /^\d{10}$/.test(timestamp)) {
        // Это timestamp в секундах
        return new Date(parseInt(timestamp) * 1000).toISOString();
      }
      return timestamp; // Уже правильный формат
    }
    
    console.log('\n📊 Проверяем таблицы с timestamp полями...');
    
    // 1. Исправляем таблицу users
    console.log('\n👥 Исправляем таблицу users...');
    const usersResult = await prisma.$queryRaw`
      SELECT id, created_at, updated_at 
      FROM users 
      WHERE created_at LIKE '%1%' OR updated_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${usersResult.length}`);
    
    if (usersResult.length > 0) {
      console.log('Примеры проблемных записей:');
      usersResult.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, created_at: ${user.created_at}, updated_at: ${user.updated_at}`);
      });
      
      // Исправляем created_at
      await prisma.$executeRaw`
        UPDATE users 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      // Исправляем updated_at
      await prisma.$executeRaw`
        UPDATE users 
        SET updated_at = datetime(updated_at/1000, 'unixepoch')
        WHERE updated_at LIKE '%1%' AND length(updated_at) = 13
      `;
      
      console.log('✅ Поля created_at и updated_at в таблице users исправлены');
    }
    
    // 2. Исправляем таблицу stocks
    console.log('\n📦 Исправляем таблицу stocks...');
    const stocksResult = await prisma.$queryRaw`
      SELECT id, created_at, updated_at 
      FROM stocks 
      WHERE created_at LIKE '%1%' OR updated_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${stocksResult.length}`);
    
    if (stocksResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE stocks 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      await prisma.$executeRaw`
        UPDATE stocks 
        SET updated_at = datetime(updated_at/1000, 'unixepoch')
        WHERE updated_at LIKE '%1%' AND length(updated_at) = 13
      `;
      
      console.log('✅ Поля created_at и updated_at в таблице stocks исправлены');
    }
    
    // 3. Исправляем таблицу free_hookahs
    console.log('\n🎁 Исправляем таблицу free_hookahs...');
    const freeHookahsResult = await prisma.$queryRaw`
      SELECT id, created_at, used_at 
      FROM free_hookahs 
      WHERE created_at LIKE '%1%' OR used_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${freeHookahsResult.length}`);
    
    if (freeHookahsResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE free_hookahs 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      await prisma.$executeRaw`
        UPDATE free_hookahs 
        SET used_at = datetime(used_at/1000, 'unixepoch')
        WHERE used_at LIKE '%1%' AND length(used_at) = 13
      `;
      
      console.log('✅ Поля created_at и used_at в таблице free_hookahs исправлены');
    }
    
    // 4. Исправляем таблицу hookah_history
    console.log('\n📝 Исправляем таблицу hookah_history...');
    const historyResult = await prisma.$queryRaw`
      SELECT id, created_at 
      FROM hookah_history 
      WHERE created_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${historyResult.length}`);
    
    if (historyResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE hookah_history 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      console.log('✅ Поле created_at в таблице hookah_history исправлено');
    }
    
    // 5. Исправляем таблицу admins
    console.log('\n👑 Исправляем таблицу admins...');
    const adminsResult = await prisma.$queryRaw`
      SELECT id, created_at 
      FROM admins 
      WHERE created_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${adminsResult.length}`);
    
    if (adminsResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE admins 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      console.log('✅ Поле created_at в таблице admins исправлено');
    }
    
    // 6. Исправляем таблицу admin_list
    console.log('\n📋 Исправляем таблицу admin_list...');
    const adminListResult = await prisma.$queryRaw`
      SELECT id, created_at 
      FROM admin_list 
      WHERE created_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${adminListResult.length}`);
    
    if (adminListResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE admin_list 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      console.log('✅ Поле created_at в таблице admin_list исправлено');
    }
    
    // 7. Исправляем таблицу free_hookah_requests
    console.log('\n🎫 Исправляем таблицу free_hookah_requests...');
    const requestsResult = await prisma.$queryRaw`
      SELECT id, created_at, updated_at 
      FROM free_hookah_requests 
      WHERE created_at LIKE '%1%' OR updated_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${requestsResult.length}`);
    
    if (requestsResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE free_hookah_requests 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      await prisma.$executeRaw`
        UPDATE free_hookah_requests 
        SET updated_at = datetime(updated_at/1000, 'unixepoch')
        WHERE updated_at LIKE '%1%' AND length(updated_at) = 13
      `;
      
      console.log('✅ Поля created_at и updated_at в таблице free_hookah_requests исправлены');
    }
    
    // 8. Исправляем таблицу hookah_reviews
    console.log('\n⭐ Исправляем таблицу hookah_reviews...');
    const reviewsResult = await prisma.$queryRaw`
      SELECT id, created_at 
      FROM hookah_reviews 
      WHERE created_at LIKE '%1%'
      LIMIT 5
    `;
    
    console.log(`Найдено записей с проблемными timestamp: ${reviewsResult.length}`);
    
    if (reviewsResult.length > 0) {
      await prisma.$executeRaw`
        UPDATE hookah_reviews 
        SET created_at = datetime(created_at/1000, 'unixepoch')
        WHERE created_at LIKE '%1%' AND length(created_at) = 13
      `;
      
      console.log('✅ Поле created_at в таблице hookah_reviews исправлено');
    }
    
    console.log('\n🎉 Исправление timestamp полей завершено!');
    
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
    console.error('❌ Ошибка при исправлении timestamp полей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTimestampFields();
