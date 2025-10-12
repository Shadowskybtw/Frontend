const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRealUsers() {
  try {
    console.log('🔍 Тестируем API для реальных пользователей...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Тестовые пользователи из скриншотов
    const testUsers = [
      { tgId: 937011437, name: 'Николай Шадовский', expectedPurchases: 11 },
      { tgId: 6922083035, name: 'Николай Гитлер', expectedPurchases: 0 }
    ];
    
    for (const user of testUsers) {
      console.log(`\n👤 Тестируем пользователя: ${user.name} (TG: ${user.tgId})`);
      
      // 1. Проверяем API history
      console.log('   📝 Тест API history...');
      try {
        const historyResponse = await fetch(`${baseUrl}/api/history/${user.tgId}?withReviews=true&limit=50&offset=0`);
        console.log(`      Статус: ${historyResponse.status} ${historyResponse.statusText}`);
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          console.log('      ✅ History API работает');
          console.log('      📊 Данные:', {
            success: historyData.success,
            itemsCount: historyData.items?.length || 0,
            historyCount: historyData.history?.length || 0,
            total: historyData.total
          });
          
          if (historyData.history && historyData.history.length > 0) {
            console.log('      📋 Первая запись истории:', {
              id: historyData.history[0].id,
              type: historyData.history[0].hookah_type,
              created_at: historyData.history[0].created_at
            });
          }
        } else {
          const errorText = await historyResponse.text();
          console.log('      ❌ History API ошибка:', errorText);
        }
      } catch (error) {
        console.log('      ❌ History API исключение:', error.message);
      }
      
      // 2. Проверяем API stocks
      console.log('   📦 Тест API stocks...');
      try {
        const stocksResponse = await fetch(`${baseUrl}/api/stocks/${user.tgId}`);
        console.log(`      Статус: ${stocksResponse.status} ${stocksResponse.statusText}`);
        
        if (stocksResponse.ok) {
          const stocksData = await stocksResponse.json();
          console.log('      ✅ Stocks API работает');
          console.log('      📊 Данные:', {
            success: stocksData.success,
            stocksCount: stocksData.stocks?.length || 0
          });
          
          if (stocksData.stocks && stocksData.stocks.length > 0) {
            const stock5Plus1 = stocksData.stocks.find(s => s.stock_name === '5+1 кальян');
            if (stock5Plus1) {
              console.log('      🎯 Stock "5+1 кальян":', {
                id: stock5Plus1.id,
                progress: stock5Plus1.progress
              });
            }
          }
        } else {
          const errorText = await stocksResponse.text();
          console.log('      ❌ Stocks API ошибка:', errorText);
        }
      } catch (error) {
        console.log('      ❌ Stocks API исключение:', error.message);
      }
      
      // 3. Проверяем API free-hookahs
      console.log('   🎁 Тест API free-hookahs...');
      try {
        const freeHookahsResponse = await fetch(`${baseUrl}/api/free-hookahs/${user.tgId}`);
        console.log(`      Статус: ${freeHookahsResponse.status} ${freeHookahsResponse.statusText}`);
        
        if (freeHookahsResponse.ok) {
          const freeHookahsData = await freeHookahsResponse.json();
          console.log('      ✅ Free hookahs API работает');
          console.log('      📊 Данные:', {
            success: freeHookahsData.success,
            hookahsCount: freeHookahsData.hookahs?.length || 0,
            unusedCount: freeHookahsData.unusedCount,
            totalCount: freeHookahsData.totalCount
          });
        } else {
          const errorText = await freeHookahsResponse.text();
          console.log('      ❌ Free hookahs API ошибка:', errorText);
        }
      } catch (error) {
        console.log('      ❌ Free hookahs API исключение:', error.message);
      }
    }
    
    console.log('\n🎉 Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  }
}

testRealUsers();
