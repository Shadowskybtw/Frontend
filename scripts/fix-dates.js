const Database = require('better-sqlite3');

function fixDates() {
  console.log('🔧 Исправляем форматы дат...');
  
  const db = new Database('./prisma/hookah.db');
  
  try {
    // Получаем пользователей
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    // Обновляем даты для пользователей
    const updateUser = db.prepare(`
      UPDATE users 
      SET created_at = ?, updated_at = ?
      WHERE id = ?
    `);
    
    for (const user of users) {
      const createdAt = new Date(parseInt(user.created_at)).toISOString();
      const updatedAt = new Date(parseInt(user.updated_at)).toISOString();
      
      updateUser.run(createdAt, updatedAt, user.id);
      console.log(`✅ Обновлены даты для пользователя ${user.id}: ${createdAt}`);
    }
    
    // Получаем администраторов
    const admins = db.prepare('SELECT * FROM admin_list').all();
    console.log(`👑 Найдено администраторов: ${admins.length}`);
    
    // Обновляем даты для администраторов
    const updateAdmin = db.prepare(`
      UPDATE admin_list 
      SET created_at = ?
      WHERE id = ?
    `);
    
    for (const admin of admins) {
      // Проверяем, является ли дата timestamp в миллисекундах
      const createdAt = admin.created_at.includes('.') 
        ? new Date(parseInt(admin.created_at)).toISOString()
        : new Date(admin.created_at).toISOString();
      
      updateAdmin.run(createdAt, admin.id);
      console.log(`✅ Обновлены даты для администратора ${admin.id}: ${createdAt}`);
    }
    
    console.log('✅ Форматы дат исправлены!');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении дат:', error);
  } finally {
    db.close();
  }
}

fixDates();
