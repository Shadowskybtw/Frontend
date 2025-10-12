const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebAppInitialization() {
  try {
    console.log('🧪 Тестируем инициализацию WebApp...');
    
    // Тестируем главную страницу
    console.log('📄 Тестируем главную страницу...');
    const homeResponse = await fetch('http://localhost:3000/');
    
    if (homeResponse.ok) {
      console.log('✅ Главная страница доступна');
      const html = await homeResponse.text();
      
      if (html.includes('UserProvider')) {
        console.log('✅ UserProvider найден на странице');
      }
      
      if (html.includes('Инициализация')) {
        console.log('✅ Текст инициализации найден');
      }
      
      // Проверяем, есть ли проблемы с JavaScript
      if (html.includes('error') || html.includes('Error')) {
        console.log('⚠️ Возможные ошибки JavaScript на странице');
      }
    } else {
      console.log('❌ Главная страница недоступна:', homeResponse.status);
    }
    
    // Тестируем API
    console.log('📡 Тестируем API check-or-register...');
    const response = await fetch('http://localhost:3000/api/check-or-register', {
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
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.success && !data.isNewUser) {
        console.log('✅ Пользователь найден в API');
        console.log('👤 Пользователь:', data.user.first_name, data.user.last_name);
        console.log('📱 Телефон:', data.user.phone);
        
        // Проверяем, что пользователь должен быть перенаправлен в профиль
        console.log('🔄 Пользователь должен быть перенаправлен в профиль, а не на регистрацию');
      } else {
        console.log('❌ Пользователь не найден в API или это новый пользователь');
      }
    } else {
      console.log('❌ API вернул ошибку:', response.status);
    }
    
    console.log('🎯 Рекомендации:');
    console.log('1. Проверьте консоль браузера на наличие ошибок JavaScript');
    console.log('2. Проверьте, что UserContext правильно инициализируется');
    console.log('3. Проверьте, что Telegram WebApp данные передаются корректно');
    console.log('4. Убедитесь, что WebApp открывается через Telegram, а не в обычном браузере');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

testWebAppInitialization();
