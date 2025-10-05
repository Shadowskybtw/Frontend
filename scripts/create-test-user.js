const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const db = neon(DATABASE_URL);

async function createTestUser() {
  try {
    console.log('🔍 Проверяем существование тестового пользователя...');
    
    // Проверяем, есть ли уже пользователь
    const existingUser = await db`
      SELECT * FROM users WHERE tg_id = 937011437 LIMIT 1
    `;
    
    if (existingUser.length > 0) {
      console.log('✅ Тестовый пользователь уже существует:', existingUser[0]);
      return existingUser[0];
    }
    
    console.log('➕ Создаем тестового пользователя...');
    
    // Создаем тестового пользователя
    const newUser = await db`
      INSERT INTO users (tg_id, first_name, last_name, phone, username)
      VALUES (937011437, 'Test', 'User', '+1234567890', 'testuser')
      RETURNING *
    `;
    
    console.log('✅ Тестовый пользователь создан:', newUser[0]);
    
    // Создаем тестовую акцию
    console.log('➕ Создаем тестовую акцию...');
    const newStock = await db`
      INSERT INTO stocks (user_id, stock_name, progress)
      VALUES (${newUser[0].id}, 'Акция кальянов', 60)
      RETURNING *
    `;
    
    console.log('✅ Тестовая акция создана:', newStock[0]);
    
    // Создаем тестовые бесплатные кальяны
    console.log('➕ Создаем тестовые бесплатные кальяны...');
    const freeHookahs = await db`
      INSERT INTO free_hookahs (user_id, used)
      VALUES 
        (${newUser[0].id}, true),
        (${newUser[0].id}, true),
        (${newUser[0].id}, false)
      RETURNING *
    `;
    
    console.log('✅ Тестовые бесплатные кальяны созданы:', freeHookahs);
    
    console.log('🎉 Тестовые данные успешно созданы!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error.message);
  }
}

createTestUser();
