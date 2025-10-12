const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugProfileAPIs() {
  try {
    console.log('🔍 Отладка API endpoints профиля...');
    
    const testTgId = 937011437; // Тестовый админ
    const baseUrl = 'http://localhost:3000';
    
    console.log(`👤 Тестируем API для пользователя с tg_id: ${testTgId}`);
    
    // Тест 1: API stocks
    console.log('\n📦 Тест 1: API stocks');
    try {
      const stocksResponse = await fetch(`${baseUrl}/api/stocks/${testTgId}`);
      console.log(`   Статус: ${stocksResponse.status} ${stocksResponse.statusText}`);
      
      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json();
        console.log('   ✅ Stocks API работает');
        console.log('   📊 Данные:', {
          success: stocksData.success,
          stocksCount: stocksData.stocks?.length || 0
        });
        
        if (stocksData.stocks && stocksData.stocks.length > 0) {
          console.log('   📋 Первый stock:', stocksData.stocks[0]);
        }
      } else {
        const errorText = await stocksResponse.text();
        console.log('   ❌ Stocks API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Stocks API исключение:', error.message);
    }
    
    // Тест 2: API free-hookahs
    console.log('\n🎁 Тест 2: API free-hookahs');
    try {
      const freeHookahsResponse = await fetch(`${baseUrl}/api/free-hookahs/${testTgId}`);
      console.log(`   Статус: ${freeHookahsResponse.status} ${freeHookahsResponse.statusText}`);
      
      if (freeHookahsResponse.ok) {
        const freeHookahsData = await freeHookahsResponse.json();
        console.log('   ✅ Free hookahs API работает');
        console.log('   📊 Данные:', {
          success: freeHookahsData.success,
          hookahsCount: freeHookahsData.hookahs?.length || 0,
          unusedCount: freeHookahsData.unusedCount,
          totalCount: freeHookahsData.totalCount
        });
        
        if (freeHookahsData.hookahs && freeHookahsData.hookahs.length > 0) {
          console.log('   📋 Первый hookah:', freeHookahsData.hookahs[0]);
        }
      } else {
        const errorText = await freeHookahsResponse.text();
        console.log('   ❌ Free hookahs API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Free hookahs API исключение:', error.message);
    }
    
    // Тест 3: API history
    console.log('\n📝 Тест 3: API history');
    try {
      const historyResponse = await fetch(`${baseUrl}/api/history/${testTgId}?withReviews=true`);
      console.log(`   Статус: ${historyResponse.status} ${historyResponse.statusText}`);
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('   ✅ History API работает');
        console.log('   📊 Данные:', {
          success: historyData.success,
          itemsCount: historyData.items?.length || 0,
          historyCount: historyData.history?.length || 0,
          total: historyData.total
        });
        
        if (historyData.history && historyData.history.length > 0) {
          console.log('   📋 Первая запись истории:', historyData.history[0]);
        }
      } else {
        const errorText = await historyResponse.text();
        console.log('   ❌ History API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ History API исключение:', error.message);
    }
    
    // Тест 4: API admin
    console.log('\n👑 Тест 4: API admin');
    try {
      const adminResponse = await fetch(`${baseUrl}/api/admin?tg_id=${testTgId}`);
      console.log(`   Статус: ${adminResponse.status} ${adminResponse.statusText}`);
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('   ✅ Admin API работает');
        console.log('   📊 Данные:', {
          success: adminData.success,
          is_admin: adminData.is_admin
        });
      } else {
        const errorText = await adminResponse.text();
        console.log('   ❌ Admin API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Admin API исключение:', error.message);
    }
    
    console.log('\n🎉 Отладка API endpoints завершена!');
    
  } catch (error) {
    console.error('❌ Ошибка при отладке API endpoints:', error);
  }
}

debugProfileAPIs();
