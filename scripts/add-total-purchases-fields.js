#!/usr/bin/env node
/**
 * Скрипт для добавления полей общего количества покупок в таблицу users
 */

const { neon } = require('@neondatabase/serverless');

const TARGET_DATABASE_URL = process.env.TARGET_DATABASE_URL;

if (!TARGET_DATABASE_URL) {
  console.error('❌ TARGET_DATABASE_URL не настроен');
  process.exit(1);
}

const targetDb = neon(TARGET_DATABASE_URL);

async function addTotalPurchasesFields() {
  try {
    console.log('🔄 Добавление полей общего количества покупок...\n');

    // Добавляем поля для общего количества покупок
    await targetDb`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_regular_purchases INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS total_free_purchases INTEGER DEFAULT 0
    `;

    console.log('✅ Поля добавлены успешно!');
    console.log('   - total_purchases: общее количество покупок за все время');
    console.log('   - total_regular_purchases: количество обычных покупок');
    console.log('   - total_free_purchases: количество бесплатных покупок');

    // Проверяем структуру таблицы
    const tableInfo = await targetDb`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;

    console.log('\n📊 Текущая структура таблицы users:');
    tableInfo.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ Ошибка при добавлении полей:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await addTotalPurchasesFields();
    console.log('\n✅ Готово! Поля добавлены в таблицу users.');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addTotalPurchasesFields };
