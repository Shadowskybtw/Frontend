#!/usr/bin/env node
/**
 * Скрипт для исправления логики акций на основе правильного понимания старого бота
 * Логика: каждые 5 покупок = 1 бесплатный кальян, счетчик сбрасывается после получения бесплатного
 */

const { neon } = require('@neondatabase/serverless');

// Конфигурация
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL не настроен');
  process.exit(1);
}

const db = neon(DATABASE_URL);

class StockLogicFixer {
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
   * Анализ правильной логики кальянов
   */
  async analyzeCorrectLogic() {
    try {
      console.log('🔍 Анализ правильной логики кальянов...\n');

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

      // Анализируем каждого пользователя с правильной логикой
      const analysis = {};
      for (const [userId, userData] of Object.entries(userHistory)) {
        const result = this.analyzeUserCorrectLogic(userData);
        analysis[userId] = result;
        
        if (result.totalHookahs > 0) {
          console.log(`👤 ${userData.first_name} ${userData.last_name} (TG: ${userData.tg_id}):`);
          console.log(`   Всего кальянов: ${result.totalHookahs}`);
          console.log(`   Использовано: ${result.usedHookahs}`);
          console.log(`   Бесплатных получено: ${result.freeHookahsReceived}`);
          console.log(`   Покупок в текущем цикле: ${result.purchasesInCurrentCycle}`);
          console.log(`   Прогресс в акции: ${result.currentProgress}%`);
          console.log(`   Готов к бесплатному: ${result.readyForFree ? 'ДА' : 'НЕТ'}`);
          console.log('');
        }
      }

      return analysis;
    } catch (error) {
      console.error('❌ Ошибка при анализе логики кальянов:', error.message);
      throw error;
    }
  }

  /**
   * Правильный анализ кальянов пользователя
   */
  analyzeUserCorrectLogic(userData) {
    const hookahs = userData.hookahs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    let totalHookahs = hookahs.length;
    let usedHookahs = hookahs.filter(h => h.used).length;
    let freeHookahsReceived = usedHookahs; // Использованные = бесплатные
    
    // Рассчитываем покупки в текущем цикле
    let purchasesInCurrentCycle = totalHookahs;
    let currentProgress = 0;
    let readyForFree = false;

    if (freeHookahsReceived > 0) {
      // Если были бесплатные, считаем покупки после последнего бесплатного
      const usedHookahsList = hookahs.filter(h => h.used);
      const lastUsedHookah = usedHookahsList[usedHookahsList.length - 1];
      const lastUsedIndex = hookahs.findIndex(h => h.id === lastUsedHookah.id);
      
      // Покупки в текущем цикле = общее количество - количество до последнего бесплатного
      purchasesInCurrentCycle = totalHookahs - lastUsedIndex - 1;
    }

    // Рассчитываем прогресс (каждый кальян = 20%, так как 5 кальянов = 100%)
    currentProgress = Math.min(purchasesInCurrentCycle * 20, 100);
    
    // Готов к бесплатному, если накопил 5+ покупок в текущем цикле
    readyForFree = purchasesInCurrentCycle >= 5;

    return {
      totalHookahs,
      usedHookahs,
      freeHookahsReceived,
      purchasesInCurrentCycle,
      currentProgress,
      readyForFree
    };
  }

  /**
   * Обновление акций с правильной логикой
   */
  async updateStocksWithCorrectLogic() {
    try {
      console.log('🔄 Обновление акций с правильной логикой...\n');

      // Анализируем с правильной логикой
      const analysis = await this.analyzeCorrectLogic();

      let updatedStocks = 0;
      let createdStocks = 0;
      let errors = 0;
      let readyForFreeCount = 0;

      // Обновляем или создаем акции для каждого пользователя
      for (const [userId, userAnalysis] of Object.entries(analysis)) {
        try {
          if (userAnalysis.totalHookahs === 0) {
            continue;
          }

          if (userAnalysis.readyForFree) {
            readyForFreeCount++;
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
          } else {
            // Создаем новую акцию
            await this.db`
              INSERT INTO stocks (user_id, stock_name, progress, created_at, updated_at)
              VALUES (${parseInt(userId)}, 'Прогресс кальянов', ${userAnalysis.currentProgress}, NOW(), NOW())
            `;
            createdStocks++;
          }

        } catch (error) {
          console.error(`❌ Ошибка при обновлении акции для пользователя ${userId}:`, error.message);
          errors++;
        }
      }

      console.log('\n📊 Результаты обновления акций:');
      console.log(`✅ Акций обновлено: ${updatedStocks}`);
      console.log(`✅ Акций создано: ${createdStocks}`);
      console.log(`🎯 Готовых к бесплатному: ${readyForFreeCount}`);
      console.log(`❌ Ошибок: ${errors}`);

      return {
        updated: updatedStocks,
        created: createdStocks,
        readyForFree: readyForFreeCount,
        errors: errors
      };
    } catch (error) {
      console.error('❌ Ошибка при обновлении акций:', error.message);
      throw error;
    }
  }

  /**
   * Показать пользователей готовых к бесплатному кальяну
   */
  async showReadyForFreeUsers() {
    try {
      console.log('🎯 Пользователи готовые к бесплатному кальяну:\n');

      const readyUsers = await this.db`
        SELECT 
          u.first_name,
          u.last_name,
          u.tg_id,
          u.phone,
          s.progress,
          COUNT(fh.id) as total_hookahs,
          COUNT(CASE WHEN fh.used = true THEN 1 END) as used_hookahs
        FROM users u
        JOIN stocks s ON u.id = s.user_id
        LEFT JOIN free_hookahs fh ON u.id = fh.user_id
        WHERE s.progress = 100
        GROUP BY u.id, u.first_name, u.last_name, u.tg_id, u.phone, s.progress
        ORDER BY total_hookahs DESC
      `;

      if (readyUsers.length === 0) {
        console.log('❌ Нет пользователей готовых к бесплатному кальяну');
        return;
      }

      console.log(`📊 Найдено ${readyUsers.length} пользователей готовых к бесплатному кальяну:\n`);

      readyUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   TG ID: ${user.tg_id}`);
        console.log(`   Телефон: ${user.phone}`);
        console.log(`   Всего кальянов: ${user.total_hookahs}`);
        console.log(`   Использовано: ${user.used_hookahs}`);
        console.log(`   Прогресс: ${user.progress}%`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Ошибка при получении пользователей готовых к бесплатному:', error.message);
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
          u.id, u.tg_id, u.first_name, u.last_name, u.phone,
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
      console.log(`   Телефон: ${userData.phone}`);
      console.log(`   Прогресс в акции: ${userData.progress || 0}%`);

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

      // Анализируем логику
      const analysis = this.analyzeUserCorrectLogic({
        user_id: userData.id,
        hookahs: hookahs
      });

      console.log(`\n📊 Анализ:`);
      console.log(`   Всего кальянов: ${analysis.totalHookahs}`);
      console.log(`   Использовано: ${analysis.usedHookahs}`);
      console.log(`   Бесплатных получено: ${analysis.freeHookahsReceived}`);
      console.log(`   Покупок в текущем цикле: ${analysis.purchasesInCurrentCycle}`);
      console.log(`   Готов к бесплатному: ${analysis.readyForFree ? 'ДА' : 'НЕТ'}`);

    } catch (error) {
      console.error('❌ Ошибка при получении информации о пользователе:', error.message);
      throw error;
    }
  }

  /**
   * Показать статистику
   */
  async showStats() {
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

    } catch (error) {
      console.error('❌ Ошибка при получении статистики:', error.message);
      throw error;
    }
  }
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];
  const fixer = new StockLogicFixer();

  try {
    // Проверяем подключение
    const connected = await fixer.checkConnection();
    if (!connected) {
      process.exit(1);
    }

    switch (command) {
      case 'analyze':
        await fixer.analyzeCorrectLogic();
        break;
        
      case 'update':
        await fixer.updateStocksWithCorrectLogic();
        break;
        
      case 'ready':
        await fixer.showReadyForFreeUsers();
        break;
        
      case 'stats':
        await fixer.showStats();
        break;
        
      case 'user':
        if (!arg) {
          console.error('❌ Укажите TG ID пользователя');
          process.exit(1);
        }
        await fixer.showUserDetails(parseInt(arg));
        break;
        
      case 'help':
      default:
        console.log(`
📊 Скрипт исправления логики акций

Использование:
  node fix-stocks-logic.js <command> [argument]

Команды:
  analyze         - Анализ правильной логики кальянов
  update          - Обновление акций с правильной логикой
  ready           - Показать пользователей готовых к бесплатному
  stats           - Показать статистику акций
  user <tg_id>    - Показать детальную информацию о пользователе
  help            - Показать эту справку

Переменные окружения:
  DATABASE_URL  - URL базы данных (обязательно)

Примеры:
  # Анализ логики
  DATABASE_URL="ваш_url" node fix-stocks-logic.js analyze
  
  # Обновление акций
  DATABASE_URL="ваш_url" node fix-stocks-logic.js update
  
  # Показать готовых к бесплатному
  DATABASE_URL="ваш_url" node fix-stocks-logic.js ready
  
  # Информация о пользователе
  DATABASE_URL="ваш_url" node fix-stocks-logic.js user 123456789

Правильная логика:
  - Каждые 5 покупок = 1 бесплатный кальян
  - После получения бесплатного счетчик сбрасывается
  - Прогресс = (покупки в текущем цикле) * 20%
  - Готов к бесплатному = 5+ покупок в текущем цикле
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

module.exports = StockLogicFixer;
