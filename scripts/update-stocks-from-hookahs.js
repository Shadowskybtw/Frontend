#!/usr/bin/env node
/**
 * Скрипт для обновления слотов в акциях на основе истории кальянов
 * Логика: 5 кальянов = 1 бесплатный, после бесплатного счетчик сбрасывается
 */

const { neon } = require('@neondatabase/serverless');

// Конфигурация
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL не настроен');
  process.exit(1);
}

const db = neon(DATABASE_URL);

class StockUpdater {
  constructor() {
    this.db = db;
  }

  /**
   * Проверка подключения к базе данных
   */
  async checkConnection() {
    try {
      await this.db`SELECT 1`;
      console.log('✅ Подключение к базе данных успешно');
      return true;
    } catch (error) {
      console.log('❌ Ошибка подключения к базе данных:', error.message);
      throw error;
    }
  }

  /**
   * Анализ истории кальянов пользователей
   */
  async analyzeHookahHistory() {
    try {
      console.log('🔍 Анализ истории кальянов пользователей...\n');

      // Получаем всех пользователей с их кальянами
      const usersWithHookahs = await this.db`
        SELECT 
          u.id as user_id,
          u.tg_id,
          u.first_name,
          u.last_name,
          fh.id as hookah_id,
          fh.used,
          fh.used_at,
          fh.created_at
        FROM users u
        LEFT JOIN free_hookahs fh ON u.id = fh.user_id
        ORDER BY u.id, fh.created_at ASC
      `;

      // Группируем по пользователям
      const userHistory = {};
      usersWithHookahs.forEach(row => {
        if (!userHistory[row.user_id]) {
          userHistory[row.user_id] = {
            user_id: row.user_id,
            tg_id: row.tg_id,
            first_name: row.first_name,
            last_name: row.last_name,
            hookahs: []
          };
        }
        if (row.hookah_id) {
          userHistory[row.user_id].hookahs.push({
            id: row.hookah_id,
            used: row.used,
            used_at: row.used_at,
            created_at: row.created_at
          });
        }
      });

      console.log(`👥 Найдено пользователей: ${Object.keys(userHistory).length}`);

      // Анализируем каждого пользователя
      const analysis = {};
      for (const [userId, userData] of Object.entries(userHistory)) {
        const result = this.analyzeUserHookahs(userData);
        analysis[userId] = result;
        
        if (result.totalHookahs > 0) {
          console.log(`👤 ${userData.first_name} ${userData.last_name} (TG: ${userData.tg_id}):`);
          console.log(`   Всего кальянов: ${result.totalHookahs}`);
          console.log(`   Использовано: ${result.usedHookahs}`);
          console.log(`   Бесплатных получено: ${result.freeHookahsReceived}`);
          console.log(`   Прогресс в акции: ${result.currentProgress}%`);
          console.log(`   Последний бесплатный: ${result.lastFreeHookahDate || 'не получал'}`);
          console.log('');
        }
      }

      return analysis;
    } catch (error) {
      console.error('❌ Ошибка при анализе истории кальянов:', error.message);
      throw error;
    }
  }

  /**
   * Анализ кальянов конкретного пользователя
   */
  analyzeUserHookahs(userData) {
    const hookahs = userData.hookahs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    let totalHookahs = hookahs.length;
    let usedHookahs = hookahs.filter(h => h.used).length;
    let freeHookahsReceived = 0;
    let currentProgress = 0;
    let lastFreeHookahDate = null;
    let hookahsAfterLastFree = 0;

    // Считаем бесплатные кальяны (использованные)
    const usedHookahsList = hookahs.filter(h => h.used);
    freeHookahsReceived = usedHookahsList.length;
    
    if (freeHookahsReceived > 0) {
      lastFreeHookahDate = usedHookahsList[usedHookahsList.length - 1].used_at;
      
      // Находим последний использованный кальян
      const lastUsedHookah = usedHookahsList[usedHookahsList.length - 1];
      const lastUsedIndex = hookahs.findIndex(h => h.id === lastUsedHookah.id);
      
      // Считаем кальяны после последнего бесплатного
      hookahsAfterLastFree = totalHookahs - lastUsedIndex - 1;
    } else {
      // Если бесплатных не было, то все кальяны - это прогресс
      hookahsAfterLastFree = totalHookahs;
    }

    // Рассчитываем прогресс (каждый кальян = 20%, так как 5 кальянов = 100%)
    currentProgress = Math.min(hookahsAfterLastFree * 20, 100);

    return {
      totalHookahs,
      usedHookahs,
      freeHookahsReceived,
      currentProgress,
      lastFreeHookahDate,
      hookahsAfterLastFree
    };
  }

  /**
   * Обновление слотов в акциях
   */
  async updateStocksFromHookahs() {
    try {
      console.log('🔄 Обновление слотов в акциях на основе истории кальянов...\n');

      // Анализируем историю кальянов
      const analysis = await this.analyzeHookahHistory();

      let updatedStocks = 0;
      let createdStocks = 0;
      let errors = 0;

      // Обновляем или создаем акции для каждого пользователя
      for (const [userId, userAnalysis] of Object.entries(analysis)) {
        try {
          if (userAnalysis.totalHookahs === 0) {
            console.log(`⚠️  Пользователь ${userId} не имеет кальянов, пропускаем`);
            continue;
          }

          // Проверяем, есть ли уже акция у пользователя
          const existingStocks = await this.db`
            SELECT id, progress FROM stocks WHERE user_id = ${parseInt(userId)}
          `;

          if (existingStocks.length > 0) {
            // Обновляем существующую акцию
            await this.db`
              UPDATE stocks 
              SET progress = ${userAnalysis.currentProgress}, updated_at = NOW()
              WHERE user_id = ${parseInt(userId)}
            `;
            updatedStocks++;
            console.log(`✅ Обновлена акция для пользователя ${userId}: ${userAnalysis.currentProgress}%`);
          } else {
            // Создаем новую акцию
            await this.db`
              INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
              VALUES (${parseInt(userId)}, 'Прогресс кальянов', ${userAnalysis.currentProgress}, NOW(), NOW())
            `;
            createdStocks++;
            console.log(`✅ Создана акция для пользователя ${userId}: ${userAnalysis.currentProgress}%`);
          }

        } catch (error) {
          console.error(`❌ Ошибка при обновлении акции для пользователя ${userId}:`, error.message);
          errors++;
        }
      }

      console.log('\n📊 Результаты обновления акций:');
      console.log(`✅ Акций обновлено: ${updatedStocks}`);
      console.log(`✅ Акций создано: ${createdStocks}`);
      console.log(`❌ Ошибок: ${errors}`);

      return {
        updated: updatedStocks,
        created: createdStocks,
        errors: errors
      };
    } catch (error) {
      console.error('❌ Ошибка при обновлении акций:', error.message);
      throw error;
    }
  }

  /**
   * Показать статистику по акциям
   */
  async showStocksStats() {
    try {
      console.log('📊 Статистика акций:');
      
      const stats = await this.db`
        SELECT 
          COUNT(*) as total_stocks,
          AVG(progress) as avg_progress,
          COUNT(CASE WHEN progress = 100 THEN 1 END) as completed_stocks,
          COUNT(CASE WHEN progress = 0 THEN 1 END) as zero_progress,
          COUNT(CASE WHEN progress > 0 AND progress < 100 THEN 1 END) as in_progress
        FROM stocks
      `;

      const [stat] = stats;
      console.log(`   Всего акций: ${stat.total_stocks}`);
      console.log(`   Средний прогресс: ${Math.round(stat.avg_progress || 0)}%`);
      console.log(`   Завершено (100%): ${stat.completed_stocks}`);
      console.log(`   В процессе: ${stat.in_progress}`);
      console.log(`   Нулевой прогресс: ${stat.zero_progress}`);

      // Показываем топ пользователей по прогрессу
      const topUsers = await this.db`
        SELECT 
          u.first_name,
          u.last_name,
          u.tg_id,
          s.progress
        FROM stocks s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.progress DESC
        LIMIT 10
      `;

      console.log('\n🏆 Топ пользователей по прогрессу:');
      topUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (TG: ${user.tg_id}): ${user.progress}%`);
      });

    } catch (error) {
      console.error('❌ Ошибка при получении статистики акций:', error.message);
      throw error;
    }
  }

  /**
   * Показать детальную информацию о пользователе
   */
  async showUserDetails(tgId) {
    try {
      const user = await this.db`
        SELECT 
          u.id, u.tg_id, u.first_name, u.last_name,
          s.progress, s.stock_name, s.created_at as stock_created_at
        FROM users u
        LEFT JOIN stocks s ON u.id = s.user_id
        WHERE u.tg_id = ${parseInt(tgId)}
        LIMIT 1
      `;

      if (user.length === 0) {
        console.log(`❌ Пользователь с TG ID ${tgId} не найден`);
        return;
      }

      const userData = user[0];
      console.log(`\n👤 Информация о пользователе:`);
      console.log(`   Имя: ${userData.first_name} ${userData.last_name}`);
      console.log(`   TG ID: ${userData.tg_id}`);
      console.log(`   Прогресс в акции: ${userData.progress || 0}%`);
      console.log(`   Название акции: ${userData.stock_name || 'не создана'}`);

      // Получаем историю кальянов
      const hookahs = await this.db`
        SELECT 
          id, used, used_at, created_at
        FROM free_hookahs
        WHERE user_id = ${userData.id}
        ORDER BY created_at ASC
      `;

      console.log(`\n🎯 История кальянов (${hookahs.length} штук):`);
      hookahs.forEach((hookah, index) => {
        const status = hookah.used ? 'использован' : 'доступен';
        const date = hookah.used ? hookah.used_at : hookah.created_at;
        console.log(`   ${index + 1}. ${status} (${new Date(date).toLocaleString('ru-RU')})`);
      });

    } catch (error) {
      console.error('❌ Ошибка при получении информации о пользователе:', error.message);
      throw error;
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const updater = new StockUpdater();

  try {
    // Проверяем подключение
    const connected = await updater.checkConnection();
    if (!connected) {
      process.exit(1);
    }

    switch (command) {
      case 'analyze':
        await updater.analyzeHookahHistory();
        break;
        
      case 'update':
        await updater.updateStocksFromHookahs();
        break;
        
      case 'stats':
        await updater.showStocksStats();
        break;
        
      case 'user':
        if (!arg) {
          console.error('❌ Укажите TG ID пользователя');
          process.exit(1);
        }
        await updater.showUserDetails(parseInt(arg));
        break;
        
      case 'help':
      default:
        console.log(`
📊 Скрипт обновления акций на основе истории кальянов

Использование:
  node update-stocks-from-hookahs.js <command> [argument]

Команды:
  analyze         - Анализ истории кальянов пользователей
  update          - Обновление слотов в акциях
  stats           - Показать статистику акций
  user <tg_id>    - Показать детальную информацию о пользователе
  help            - Показать эту справку

Переменные окружения:
  DATABASE_URL  - URL базы данных (обязательно)

Примеры:
  # Анализ истории кальянов
  DATABASE_URL="ваш_url" node update-stocks-from-hookahs.js analyze
  
  # Обновление акций
  DATABASE_URL="ваш_url" node update-stocks-from-hookahs.js update
  
  # Статистика акций
  DATABASE_URL="ваш_url" node update-stocks-from-hookahs.js stats
  
  # Информация о пользователе
  DATABASE_URL="ваш_url" node update-stocks-from-hookahs.js user 123456789

Логика работы:
  - 5 кальянов = 1 бесплатный (100% прогресс)
  - После получения бесплатного счетчик сбрасывается
  - Прогресс = (количество кальянов после последнего бесплатного) * 20%
  - Если бесплатных не было, то прогресс = (общее количество кальянов) * 20%
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = StockUpdater;
