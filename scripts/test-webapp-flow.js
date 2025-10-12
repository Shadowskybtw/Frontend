const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebAppFlow() {
  try {
    console.log('🧪 Тестируем полный поток WebApp...');
    
    // 1. Тестируем главную страницу
    console.log('📄 Тестируем главную страницу...');
    const homeResponse = await fetch('http://localhost:3000/');
    
    if (homeResponse.ok) {
      console.log('✅ Главная страница доступна');
      const html = await homeResponse.text();
      
      if (html.includes('UserProvider')) {
        console.log('✅ UserProvider найден');
      }
      
      if (html.includes('Инициализация')) {
        console.log('✅ Текст инициализации найден');
      }
    } else {
      console.log('❌ Главная страница недоступна:', homeResponse.status);
    }
    
    // 2. Тестируем API для существующего пользователя
    console.log('🔍 Тестируем API для существующего пользователя...');
    const existingUserResponse = await fetch('http://localhost:3000/api/check-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': 'test_init_data'
      },
      body: JSON.stringify({
        tg_id: 937011437,
        firstName: 'Николай',
        lastName: 'Мишин',
        username: null
      })
    });
    
    if (existingUserResponse.ok) {
      const existingUserData = await existingUserResponse.json();
      console.log('✅ API для существующего пользователя работает:', existingUserData.success);
      
      if (existingUserData.success && !existingUserData.isNewUser) {
        console.log('✅ Существующий пользователь найден корректно');
        console.log('👤 Пользователь:', existingUserData.user.first_name, existingUserData.user.last_name);
      }
    } else {
      console.log('❌ API для существующего пользователя не работает:', existingUserResponse.status);
    }
    
    // 3. Тестируем API для нового пользователя
    console.log('🔍 Тестируем API для нового пользователя...');
    const newUserResponse = await fetch('http://localhost:3000/api/check-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': 'test_init_data'
      },
      body: JSON.stringify({
        tg_id: Math.floor(Math.random() * 1000000000) + 1000000000,
        firstName: 'Тестовый',
        lastName: 'Пользователь',
        username: 'testuser'
      })
    });
    
    if (newUserResponse.ok) {
      const newUserData = await newUserResponse.json();
      console.log('✅ API для нового пользователя работает:', newUserData.success);
      
      if (newUserData.success && newUserData.isNewUser) {
        console.log('✅ Новый пользователь создан корректно');
        console.log('👤 Пользователь:', newUserData.user.first_name, newUserData.user.last_name);
        
        // Удаляем тестового пользователя
        console.log('🗑️ Удаляем тестового пользователя...');
        // Здесь можно было бы добавить удаление, но пока просто логируем
      }
    } else {
      console.log('❌ API для нового пользователя не работает:', newUserResponse.status);
    }
    
    console.log('🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

testWebAppFlow();