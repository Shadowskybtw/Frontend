const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testProductionHistory() {
  try {
    console.log('🧪 Тестируем API истории кальянов на продакшне...');
    
    const testTgId = 937011437; // Тестовый админ
    const productionUrl = 'https://frontend-delta-sandy-58.vercel.app';
    
    console.log('📡 Тестируем GET /api/history/{tgId} на продакшне...');
    
    // Тест 1: Обычная история
    console.log('🔍 Тест 1: Обычная история');
    const response1 = await fetch(`${productionUrl}/api/history/${testTgId}?limit=10`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Обычная история работает на продакшне!');
      console.log('📊 Ответ:', {
        success: data1.success,
        itemsCount: data1.items?.length || 0,
        historyCount: data1.history?.length || 0,
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
      console.log('❌ Ошибка в обычной истории на продакшне:', response1.status, response1.statusText);
      const errorText = await response1.text();
      console.log('📄 Текст ошибки:', errorText);
    }
    
    // Тест 2: История с отзывами
    console.log('🔍 Тест 2: История с отзывами');
    const response2 = await fetch(`${productionUrl}/api/history/${testTgId}?withReviews=true&limit=10`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ История с отзывами работает на продакшне!');
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
      console.log('❌ Ошибка в истории с отзывами на продакшне:', response2.status, response2.statusText);
      const errorText = await response2.text();
      console.log('📄 Текст ошибки:', errorText);
    }
    
    console.log('🎉 Тестирование API истории кальянов на продакшне завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API истории кальянов на продакшне:', error);
  }
}

testProductionHistory();
