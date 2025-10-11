const Database = require('better-sqlite3');
const path = require('path');

// Подключение к старой базе данных
const oldDbPath = path.join(__dirname, '../hookah.db');
const oldDb = new Database(oldDbPath);

// Подключение к новой Prisma базе данных
const newDbPath = path.join(__dirname, '../prisma/hookah.db');
const newDb = new Database(newDbPath);

console.log('🚀 Начинаем миграцию данных из старой базы в Prisma...');

try {
  // Начинаем транзакцию
  newDb.exec('BEGIN TRANSACTION;');

  console.log('📊 Мигрируем пользователей (guests -> users)...');
  
  // Получаем всех гостей из старой базы
  const guests = oldDb.prepare('SELECT * FROM guests').all();
  console.log(`   Найдено ${guests.length} пользователей`);
  
  // Вставляем пользователей в новую базу
  const insertUser = newDb.prepare(`
    INSERT OR IGNORE INTO users (
      tg_id, first_name, last_name, username, phone, 
      is_admin, created_at, updated_at, total_purchases
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let usersMigrated = 0;
  for (const guest of guests) {
    try {
      insertUser.run(
        parseInt(guest.telegram_id),  // конвертируем в число
        String(guest.first_name || ''),
        String(guest.last_name || ''),
        '', // username отсутствует в старой базе
        String(guest.phone || ''),
        false, // is_admin будет обновлено позже
        String(guest.created_at || new Date().toISOString()),
        new Date().toISOString(),
        guest.total_purchases ? parseInt(guest.total_purchases) : 0
      );
      usersMigrated++;
    } catch (error) {
      console.log(`   ⚠️  Ошибка при миграции пользователя ${guest.telegram_id}: ${error.message}`);
    }
  }
  console.log(`   ✅ Мигрировано ${usersMigrated} пользователей`);

  console.log('📦 Мигрируем покупки (purchases -> stocks)...');
  
  // Получаем все покупки из старой базы
  const purchases = oldDb.prepare('SELECT * FROM purchases').all();
  console.log(`   Найдено ${purchases.length} покупок`);
  
  // Вставляем покупки как запасы в новую базу
  const insertStock = newDb.prepare(`
    INSERT OR IGNORE INTO stocks (
      user_id, created_at, updated_at
    ) VALUES (?, ?, ?)
  `);
  
  let stocksMigrated = 0;
  for (const purchase of purchases) {
    try {
      insertStock.run(
        purchase.guest_id,
        purchase.created_at || new Date().toISOString(),
        new Date().toISOString()
      );
      stocksMigrated++;
    } catch (error) {
      console.log(`   ⚠️  Ошибка при миграции покупки ${purchase.id}: ${error.message}`);
    }
  }
  console.log(`   ✅ Мигрировано ${stocksMigrated} запасов`);

  console.log('👑 Мигрируем администраторов (admins -> admin_list)...');
  
  // Получаем всех администраторов из старой базы
  const admins = oldDb.prepare('SELECT * FROM admins').all();
  console.log(`   Найдено ${admins.length} администраторов`);
  
  // Вставляем администраторов в новую базу
  const insertAdmin = newDb.prepare(`
    INSERT OR IGNORE INTO admin_list (
      tg_id, created_at
    ) VALUES (?, ?)
  `);
  
  let adminsMigrated = 0;
  for (const admin of admins) {
    try {
      insertAdmin.run(
        admin.telegram_id,  // поле называется telegram_id в старой базе
        admin.created_at || new Date().toISOString()
      );
      adminsMigrated++;
    } catch (error) {
      console.log(`   ⚠️  Ошибка при миграции администратора ${admin.telegram_id}: ${error.message}`);
    }
  }
  console.log(`   ✅ Мигрировано ${adminsMigrated} администраторов`);

  // Обновляем флаги is_admin у пользователей
  console.log('🔄 Обновляем флаги is_admin...');
  const updateAdminFlags = newDb.prepare(`
    UPDATE users 
    SET is_admin = true, updated_at = ?
    WHERE tg_id IN (SELECT tg_id FROM admin_list)
  `);
  const updateResult = updateAdminFlags.run(new Date().toISOString());
  console.log(`   ✅ Обновлено ${updateResult.changes} пользователей как администраторы`);

  // Подтверждаем транзакцию
  newDb.exec('COMMIT;');
  
  console.log('🎉 Миграция завершена успешно!');
  console.log(`📊 Результат:`);
  console.log(`   - Пользователи: ${usersMigrated}`);
  console.log(`   - Запасы: ${stocksMigrated}`);
  console.log(`   - Администраторы: ${adminsMigrated}`);
  
  // Проверяем результат
  const userCount = newDb.prepare('SELECT COUNT(*) as count FROM users').get();
  const stockCount = newDb.prepare('SELECT COUNT(*) as count FROM stocks').get();
  const adminCount = newDb.prepare('SELECT COUNT(*) as count FROM admin_list').get();
  
  console.log(`\n📈 Итоговые данные в Prisma базе:`);
  console.log(`   - Пользователи: ${userCount.count}`);
  console.log(`   - Запасы: ${stockCount.count}`);
  console.log(`   - Администраторы: ${adminCount.count}`);

} catch (error) {
  console.error('❌ Ошибка при миграции:', error);
  newDb.exec('ROLLBACK;');
  process.exit(1);
} finally {
  oldDb.close();
  newDb.close();
}
