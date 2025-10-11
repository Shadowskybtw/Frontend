const Database = require('better-sqlite3');

const newDb = new Database('./prisma/hookah.db');

async function fixDateFormats() {
  try {
    console.log('🔧 Исправляем форматы дат...');
    
    // Исправляем даты в таблице users
    console.log('👥 Исправляем даты пользователей...');
    const users = newDb.prepare('SELECT id, created_at, updated_at FROM users').all();
    
    const updateUser = newDb.prepare(`
      UPDATE users 
      SET created_at = ?, updated_at = ?
      WHERE id = ?
    `);
    
    for (const user of users) {
      // Конвертируем даты в ISO формат
      const createdAt = new Date(user.created_at).toISOString();
      const updatedAt = new Date(user.updated_at).toISOString();
      
      updateUser.run(createdAt, updatedAt, user.id);
    }
    console.log(`✅ Обновлено ${users.length} пользователей`);
    
    // Исправляем даты в таблице admin_list
    console.log('👑 Исправляем даты администраторов...');
    const admins = newDb.prepare('SELECT id, created_at FROM admin_list').all();
    
    const updateAdmin = newDb.prepare(`
      UPDATE admin_list 
      SET created_at = ?
      WHERE id = ?
    `);
    
    for (const admin of admins) {
      const createdAt = new Date(admin.created_at).toISOString();
      updateAdmin.run(createdAt, admin.id);
    }
    console.log(`✅ Обновлено ${admins.length} администраторов`);
    
    // Исправляем даты в таблице hookah_history
    console.log('📝 Исправляем даты истории...');
    const history = newDb.prepare('SELECT id, created_at FROM hookah_history').all();
    
    const updateHistory = newDb.prepare(`
      UPDATE hookah_history 
      SET created_at = ?
      WHERE id = ?
    `);
    
    for (const record of history) {
      const createdAt = new Date(record.created_at).toISOString();
      updateHistory.run(createdAt, record.id);
    }
    console.log(`✅ Обновлено ${history.length} записей истории`);
    
    // Исправляем даты в таблице stocks
    console.log('📦 Исправляем даты запасов...');
    const stocks = newDb.prepare('SELECT id, created_at, updated_at FROM stocks').all();
    
    const updateStock = newDb.prepare(`
      UPDATE stocks 
      SET created_at = ?, updated_at = ?
      WHERE id = ?
    `);
    
    for (const stock of stocks) {
      const createdAt = new Date(stock.created_at).toISOString();
      const updatedAt = new Date(stock.updated_at).toISOString();
      updateStock.run(createdAt, updatedAt, stock.id);
    }
    console.log(`✅ Обновлено ${stocks.length} запасов`);
    
    console.log('🎉 Форматы дат исправлены!');
  } catch (error) {
    console.error('❌ Ошибка при исправлении форматов дат:', error);
  } finally {
    newDb.close();
  }
}

fixDateFormats();
