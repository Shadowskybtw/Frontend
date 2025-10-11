const Database = require('better-sqlite3');

const oldDb = new Database('./hookah.db', { readonly: true });
const newDb = new Database('./prisma/hookah.db');

async function fixPurchasesCorrect() {
  try {
    console.log('🚀 Исправляем покупки с правильной связью...');
    
    // 1. Мигрируем покупки (purchases -> hookah_history + hookah_reviews)
    console.log('📦 Мигрируем покупки...');
    
    const purchases = oldDb.prepare('SELECT * FROM purchases').all();
    console.log(`📊 Найдено покупок: ${purchases.length}`);
    
    let historyMigrated = 0;
    const insertHistory = newDb.prepare(`
      INSERT INTO hookah_history (user_id, hookah_type, created_at)
      VALUES (?, ?, ?)
    `);
    const insertReview = newDb.prepare(`
      INSERT INTO hookah_reviews (user_id, hookah_id, rating, review_text)
      VALUES (?, ?, ?, ?)
    `);
    
    for (const purchase of purchases) {
      try {
        if (!purchase.guest_id) {
          continue;
        }
        
        // Находим гостя по id в старой базе
        const guest = oldDb.prepare('SELECT telegram_id FROM guests WHERE id = ?').get(purchase.guest_id);
        
        if (guest) {
          // Находим пользователя по telegram_id в новой базе
          const user = newDb.prepare('SELECT id FROM users WHERE tg_id = ?').get(guest.telegram_id);
          
          if (user) {
            let purchaseCreatedAt;
            if (typeof purchase.created_at === 'string' && purchase.created_at.includes('-')) {
              purchaseCreatedAt = new Date(purchase.created_at).toISOString();
            } else {
              purchaseCreatedAt = new Date(parseInt(purchase.created_at)).toISOString();
            }
            
            insertHistory.run(
              user.id,
              purchase.is_free ? 'free' : 'regular',
              String(purchaseCreatedAt)
            );
            historyMigrated++;
            
            if (purchase.rating) {
              insertReview.run(
                user.id,
                historyMigrated, // Используем ID истории как hookah_id
                parseInt(purchase.rating),
                purchase.rating_comment ? String(purchase.rating_comment) : null
              );
            }
          }
        }
        
        if (historyMigrated % 100 === 0) {
          console.log(`   📈 Мигрировано записей: ${historyMigrated}`);
        }
      } catch (error) {
        console.log(`   ⚠️ Ошибка при миграции покупки ${purchase.id}: ${error.message}`);
      }
    }
    
    console.log(`✅ Мигрировано записей истории: ${historyMigrated}`);
    
    // 2. Создаем начальные запасы для пользователей
    console.log('📦 Создаем начальные запасы...');
    
    const users = newDb.prepare('SELECT id FROM users').all();
    const insertStock = newDb.prepare(`
      INSERT INTO stocks (user_id, stock_name, progress, promotion_completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let stocksCreated = 0;
    for (const user of users) {
      // Создаем 5 начальных запасов для каждого пользователя
      for (let i = 0; i < 5; i++) {
        const now = new Date().toISOString();
        insertStock.run(
          parseInt(user.id),
          String(`Запас ${i + 1}`),
          parseInt(0),
          0, // false as integer
          String(now),
          String(now)
        );
        stocksCreated++;
      }
    }
    console.log(`✅ Создано начальных запасов: ${stocksCreated}`);
    
    console.log('🎉 Исправление покупок завершено!');
  } catch (error) {
    console.error('❌ Ошибка при исправлении:', error);
  } finally {
    oldDb.close();
    newDb.close();
  }
}

fixPurchasesCorrect();
