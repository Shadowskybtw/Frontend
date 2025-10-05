const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const db = neon(DATABASE_URL);

async function testRegistration() {
  try {
    console.log('🧪 Тестирование системы регистрации...\n');
    
    // Тестовый пользователь
    const testUser = {
      tg_id: 999999999, // Новый ID для тестирования
      firstName: 'Test',
      lastName: 'NewUser',
      username: 'testnewuser'
    };
    
    console.log('1️⃣ Проверяем существование тестового пользователя...');
    const existingUser = await db`
      SELECT * FROM users WHERE tg_id = ${testUser.tg_id} LIMIT 1
    `;
    
    if (existingUser.length > 0) {
      console.log('❌ Тестовый пользователь уже существует, удаляем...');
      await db`DELETE FROM stocks WHERE user_id = ${existingUser[0].id}`;
      await db`DELETE FROM free_hookahs WHERE user_id = ${existingUser[0].id}`;
      await db`DELETE FROM users WHERE id = ${existingUser[0].id}`;
      console.log('✅ Тестовый пользователь удален');
    }
    
    console.log('2️⃣ Тестируем API endpoint регистрации...');
    
    const response = await fetch('http://localhost:3000/api/check-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    console.log('📡 Ответ API:', data);
    
    if (data.success) {
      console.log('✅ Регистрация прошла успешно!');
      console.log('👤 Пользователь:', data.user);
      console.log('🎁 Начальная акция:', data.initialStock);
      
      // Проверяем в базе данных
      console.log('3️⃣ Проверяем данные в базе...');
      const createdUser = await db`
        SELECT * FROM users WHERE tg_id = ${testUser.tg_id} LIMIT 1
      `;
      
      if (createdUser.length > 0) {
        console.log('✅ Пользователь найден в базе данных:', createdUser[0]);
        
        const userStocks = await db`
          SELECT * FROM stocks WHERE user_id = ${createdUser[0].id}
        `;
        console.log('✅ Акции пользователя:', userStocks);
        
        // Очищаем тестовые данные
        console.log('4️⃣ Очищаем тестовые данные...');
        await db`DELETE FROM stocks WHERE user_id = ${createdUser[0].id}`;
        await db`DELETE FROM users WHERE id = ${createdUser[0].id}`;
        console.log('✅ Тестовые данные очищены');
        
      } else {
        console.log('❌ Пользователь не найден в базе данных');
      }
      
    } else {
      console.log('❌ Ошибка регистрации:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Запускаем тест
testRegistration();
