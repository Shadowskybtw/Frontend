const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTgIdType() {
  try {
    console.log('🔧 Исправляем тип поля tg_id в SQLite...');
    
    // Проверяем подключение
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // В SQLite нужно пересоздать таблицу для изменения типа колонки
    console.log('\n📝 Пересоздаем таблицу users с правильным типом tg_id...');
    
    // Создаем временную таблицу с правильной структурой
    await prisma.$executeRaw`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        username TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        total_purchases INTEGER DEFAULT 0,
        total_regular_purchases INTEGER DEFAULT 0,
        total_free_purchases INTEGER DEFAULT 0
      )
    `;
    console.log('✅ Временная таблица users_new создана');
    
    // Копируем данные из старой таблицы в новую
    await prisma.$executeRaw`
      INSERT INTO users_new 
      SELECT * FROM users
    `;
    console.log('✅ Данные скопированы в новую таблицу');
    
    // Удаляем старую таблицу
    await prisma.$executeRaw`DROP TABLE users`;
    console.log('✅ Старая таблица users удалена');
    
    // Переименовываем новую таблицу
    await prisma.$executeRaw`ALTER TABLE users_new RENAME TO users`;
    console.log('✅ Таблица users переименована');
    
    // Пересоздаем таблицу admin_list
    console.log('\n📝 Пересоздаем таблицу admin_list...');
    
    await prisma.$executeRaw`
      CREATE TABLE admin_list_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tg_id INTEGER NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )
    `;
    
    await prisma.$executeRaw`
      INSERT INTO admin_list_new 
      SELECT * FROM admin_list
    `;
    
    await prisma.$executeRaw`DROP TABLE admin_list`;
    await prisma.$executeRaw`ALTER TABLE admin_list_new RENAME TO admin_list`;
    console.log('✅ Таблица admin_list пересоздана');
    
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
