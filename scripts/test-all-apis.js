const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAllAPIs() {
  try {
    console.log('🔍 Тестируем все API endpoints...');
    
    const baseUrl = 'http://localhost:3000';
    const tgId = 937011437; // Тестовый пользователь
    
    console.log(`👤 Тестируем API для пользователя с tg_id: ${tgId}`);
    
    // 1. Тест API webapp/init
    console.log('\n📡 Тест 1: API webapp/init');
    try {
      const initResponse = await fetch(`${baseUrl}/api/webapp/init`);
      console.log(`   Статус: ${initResponse.status} ${initResponse.statusText}`);
      
      if (initResponse.ok) {
        const initData = await initResponse.json();
        console.log('   ✅ Init API работает');
        console.log('   📊 Данные:', {
          success: initData.success,
          user: initData.user ? {
            id: initData.user.id,
            first_name: initData.user.first_name,
            last_name: initData.user.last_name,
            username: initData.user.username
          } : null
        });
      } else {
        const errorText = await initResponse.text();
        console.log('   ❌ Init API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Init API исключение:', error.message);
    }
    
    // 2. Тест API stocks
    console.log('\n📦 Тест 2: API stocks');
    try {
      const stocksResponse = await fetch(`${baseUrl}/api/stocks/${tgId}`);
      console.log(`   Статус: ${stocksResponse.status} ${stocksResponse.statusText}`);
      
      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json();
        console.log('   ✅ Stocks API работает');
        console.log('   📊 Данные:', {
          success: stocksData.success,
          stocksCount: stocksData.stocks?.length || 0
        });
        
        if (stocksData.stocks && stocksData.stocks.length > 0) {
          console.log('   📋 Первый stock:', {
            id: stocksData.stocks[0].id,
            name: stocksData.stocks[0].stock_name,
            progress: stocksData.stocks[0].progress
          });
        }
      } else {
        const errorText = await stocksResponse.text();
        console.log('   ❌ Stocks API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Stocks API исключение:', error.message);
    }
    
    // 3. Тест API history
    console.log('\n📝 Тест 3: API history');
    try {
      const historyResponse = await fetch(`${baseUrl}/api/history/${tgId}?withReviews=true&limit=50&offset=0`);
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
          console.log('   📋 Первая запись истории:', {
            id: historyData.history[0].id,
            type: historyData.history[0].hookah_type,
            created_at: historyData.history[0].created_at
          });
        }
      } else {
        const errorText = await historyResponse.text();
        console.log('   ❌ History API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ History API исключение:', error.message);
    }
    
    // 4. Тест API free-hookahs
    console.log('\n🎁 Тест 4: API free-hookahs');
    try {
      const freeHookahsResponse = await fetch(`${baseUrl}/api/free-hookahs/${tgId}`);
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
      } else {
        const errorText = await freeHookahsResponse.text();
        console.log('   ❌ Free hookahs API ошибка:', errorText);
      }
    } catch (error) {
      console.log('   ❌ Free hookahs API исключение:', error.message);
    }
    
    // 5. Тест API admin
    console.log('\n👑 Тест 5: API admin');
    try {
      const adminResponse = await fetch(`${baseUrl}/api/admin?tg_id=${tgId}`);
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
    
    console.log('\n🎉 Тестирование всех API завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error);
  }
}

testAllAPIs();
