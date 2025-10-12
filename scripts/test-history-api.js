const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testHistoryAPI() {
  try {
    console.log('🧪 Тестируем API истории кальянов...');
    
    // Тестируем локальный API
    const testTgId = 937011437; // Тестовый админ
    
    console.log('📡 Тестируем GET /api/history/{tgId}...');
    
    // Тест 1: Обычная история
    console.log('🔍 Тест 1: Обычная история');
    const response1 = await fetch(`http://localhost:3000/api/history/${testTgId}?limit=10`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Обычная история работает!');
      console.log('📊 Ответ:', {
        success: data1.success,
        itemsCount: data1.items?.length || 0,
        total: data1.total,
        hasMore: data1.hasMore
      });
      
      if (data1.items && data1.items.length > 0) {
        console.log('📋 Первая запись:', {
          id: data1.items[0].id,
          hookah_type: data1.items[0].hookah_type,
          created_at: data1.items[0].created_at
        });
      }
    } else {
      console.log('❌ Ошибка в обычной истории:', response1.status, response1.statusText);
      const errorText = await response1.text();
      console.log('📄 Текст ошибки:', errorText);
    }
    
    // Тест 2: История с отзывами
    console.log('🔍 Тест 2: История с отзывами');
    const response2 = await fetch(`http://localhost:3000/api/history/${testTgId}?withReviews=true&limit=10`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ История с отзывами работает!');
      console.log('📊 Ответ:', {
        success: data2.success,
        itemsCount: data2.items?.length || 0,
        historyCount: data2.history?.length || 0,
        total: data2.total
      });
      
      if (data2.history && data2.history.length > 0) {
        console.log('📋 Первая запись с отзывом:', {
          id: data2.history[0].id,
          hookah_type: data2.history[0].hookah_type,
          created_at: data2.history[0].created_at,
          hasReview: !!data2.history[0].review
        });
      }
    } else {
      console.log('❌ Ошибка в истории с отзывами:', response2.status, response2.statusText);
      const errorText = await response2.text();
      console.log('📄 Текст ошибки:', errorText);
    }
    
    // Тест 3: Добавление записи в историю
    console.log('🔍 Тест 3: Добавление записи в историю');
    const response3 = await fetch(`http://localhost:3000/api/history/${testTgId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hookah_type: 'regular',
        slot_number: 1
      })
    });
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Добавление записи работает!');
      console.log('📊 Ответ:', {
        success: data3.success,
        message: data3.message,
        historyId: data3.history?.id
      });
    } else {
      console.log('❌ Ошибка при добавлении записи:', response3.status, response3.statusText);
      const errorText = await response3.text();
      console.log('📄 Текст ошибки:', errorText);
    }
    
    console.log('🎉 Тестирование API истории кальянов завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API истории кальянов:', error);
  }
}

testHistoryAPI();
