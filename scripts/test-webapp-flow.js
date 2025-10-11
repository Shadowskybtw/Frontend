const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebAppFlow() {
  try {
    console.log('🧪 Тестируем поток WebApp...');
    
    // Тестируем API check-or-register с существующим пользователем
    console.log('🔍 Тестируем поиск существующего пользователя...');
    
    const response = await fetch('http://localhost:3000/api/check-or-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': 'test_data'
      },
      body: JSON.stringify({
        tg_id: 937011437, // Тестовый админ
        firstName: 'Тестовый',
        lastName: 'Админ',
        username: 'testadmin'
      })
    });
    
    const data = await response.json();
    console.log('📡 Ответ API:', data);
    
    if (data.success) {
      console.log('✅ API работает корректно!');
      console.log('👤 Пользователь:', data.user);
      console.log('🆕 Новый пользователь:', data.isNewUser);
    } else {
      console.log('❌ API вернул ошибку:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании WebApp:', error);
  }
}

testWebAppFlow();
