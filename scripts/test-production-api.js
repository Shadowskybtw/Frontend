const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testProductionAPI() {
  try {
    console.log('🧪 Тестируем API на продакшне...');
    
    const testUser = {
      tg_id: 937011437,
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      username: 'testuser'
    };
    
    console.log('📡 Отправляем запрос на /api/check-or-register...');
    console.log('👤 Тестовый пользователь:', testUser);
    
    const response = await fetch('https://frontend-delta-sandy-58.vercel.app/api/check-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': 'test_init_data'
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('📡 Статус ответа:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API работает корректно!');
      console.log('📊 Ответ:', data);
      
      if (data.success) {
        if (data.isNewUser) {
          console.log('🆕 Новый пользователь зарегистрирован');
        } else {
          console.log('👤 Существующий пользователь найден');
        }
        console.log('👤 Пользователь:', data.user.first_name, data.user.last_name);
        console.log('📱 Телефон:', data.user.phone);
      } else {
        console.log('❌ API вернул ошибку:', data.message);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API вернул ошибку:', response.status);
      console.log('📄 Текст ошибки:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error);
  }
}

testProductionAPI();
