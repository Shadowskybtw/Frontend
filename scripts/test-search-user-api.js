const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSearchUserAPI() {
  try {
    console.log('🧪 Тестируем API search-user...');
    
    const phoneDigits = '6642'; // Последние 4 цифры номера +79270036642
    const baseUrl = 'http://localhost:3000';
    
    console.log(`📡 Тестируем GET /api/search-user?phone=${phoneDigits}`);
    
    const response = await fetch(`${baseUrl}/api/search-user?phone=${phoneDigits}`);
    
    console.log(`Статус: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search-user API работает');
      console.log('📊 Данные:', {
        success: data.success,
        user: data.user ? {
          name: `${data.user.first_name} ${data.user.last_name}`,
          tg_id: data.user.tg_id,
          phone: data.user.phone
        } : null,
        stats: data.stats
      });
      
      if (data.stats) {
        console.log('📋 Статистика кальянов:');
        console.log(`   Заполнено слотов: ${data.stats.slotsFilled}/5`);
        console.log(`   Осталось до бесплатного: ${data.stats.slotsRemaining}`);
        console.log(`   Прогресс: ${data.stats.progress}%`);
        console.log(`   Есть бесплатный кальян: ${data.stats.hasFreeHookah ? 'Да' : 'Нет'}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Search-user API ошибка:', errorText);
    }
    
    console.log('\n🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API search-user:', error);
  }
}

testSearchUserAPI();
