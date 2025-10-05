#!/usr/bin/env node
/**
 * Скрипт для анализа файла с данными старого бота
 * Помогает понять структуру данных перед импортом
 */

const fs = require('fs');
const path = require('path');

class DataAnalyzer {
  constructor() {
    this.supportedFormats = ['.json', '.csv', '.txt'];
  }

  /**
   * Анализ файла с данными
   */
  async analyzeFile(filename) {
    try {
      if (!fs.existsSync(filename)) {
        throw new Error(`Файл не найден: ${filename}`);
      }

      const ext = path.extname(filename).toLowerCase();
      console.log(`🔍 Анализ файла: ${filename}`);
      console.log(`📄 Тип файла: ${ext}`);
      console.log(`📏 Размер файла: ${(fs.statSync(filename).size / 1024).toFixed(2)} KB\n`);

      switch (ext) {
        case '.json':
          return await this.analyzeJSON(filename);
        case '.csv':
          return await this.analyzeCSV(filename);
        case '.txt':
          return await this.analyzeText(filename);
        default:
          return await this.analyzeUnknown(filename);
      }
    } catch (error) {
      console.error('❌ Ошибка при анализе файла:', error.message);
      throw error;
    }
  }

  /**
   * Анализ JSON файла
   */
  async analyzeJSON(filename) {
    try {
      const content = fs.readFileSync(filename, 'utf8');
      const data = JSON.parse(content);
      
      console.log('📋 JSON структура:');
      this.printObjectStructure(data, 0, 3);
      
      // Определяем тип данных
      const dataType = this.detectJSONDataType(data);
      console.log(`\n🎯 Тип данных: ${dataType}`);
      
      // Анализируем пользователей
      const users = this.extractUsers(data);
      console.log(`\n👥 Пользователи: ${users.length}`);
      
      if (users.length > 0) {
        console.log('\n📊 Примеры пользователей:');
        users.slice(0, 3).forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.first_name || user.firstName || 'N/A'} ${user.last_name || user.lastName || 'N/A'}`);
          console.log(`      TG ID: ${user.tg_id || user.telegram_id || user.user_id || 'N/A'}`);
          console.log(`      Телефон: ${user.phone || user.phone_number || 'N/A'}`);
          console.log(`      Username: ${user.username || user.telegram_username || 'N/A'}`);
        });
      }
      
      // Анализируем акции
      const stocks = this.extractStocks(data);
      if (stocks.length > 0) {
        console.log(`\n📊 Акции: ${stocks.length}`);
        console.log('   Примеры акций:');
        stocks.slice(0, 3).forEach((stock, index) => {
          console.log(`   ${index + 1}. ${stock.stock_name || stock.name || 'N/A'}: ${stock.progress || 0}%`);
        });
      }
      
      // Анализируем кальяны
      const hookahs = this.extractHookahs(data);
      if (hookahs.length > 0) {
        console.log(`\n🎯 Кальяны: ${hookahs.length}`);
        const used = hookahs.filter(h => h.used || h.is_used).length;
        console.log(`   Использовано: ${used}`);
        console.log(`   Доступно: ${hookahs.length - used}`);
      }
      
      return {
        type: 'json',
        dataType,
        users: users.length,
        stocks: stocks.length,
        hookahs: hookahs.length,
        structure: this.getObjectStructure(data)
      };
      
    } catch (error) {
      console.error('❌ Ошибка при анализе JSON:', error.message);
      throw error;
    }
  }

  /**
   * Анализ CSV файла
   */
  async analyzeCSV(filename) {
    try {
      const content = fs.readFileSync(filename, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV файл пуст или содержит только заголовки');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1);
      
      console.log('📋 CSV структура:');
      console.log(`   Заголовки: ${headers.join(', ')}`);
      console.log(`   Строк данных: ${dataRows.length}`);
      
      console.log('\n📊 Примеры данных:');
      dataRows.slice(0, 3).forEach((line, index) => {
        const values = this.parseCSVLine(line);
        console.log(`   ${index + 1}. ${values.slice(0, 5).join(' | ')}${values.length > 5 ? '...' : ''}`);
      });
      
      // Анализируем поля
      const fieldAnalysis = this.analyzeCSVFields(headers, dataRows);
      console.log('\n🔍 Анализ полей:');
      Object.entries(fieldAnalysis).forEach(([field, info]) => {
        console.log(`   ${field}: ${info.type} (${info.nonEmpty}/${dataRows.length} заполнено)`);
      });
      
      return {
        type: 'csv',
        headers,
        rows: dataRows.length,
        fields: fieldAnalysis
      };
      
    } catch (error) {
      console.error('❌ Ошибка при анализе CSV:', error.message);
      throw error;
    }
  }

  /**
   * Анализ текстового файла
   */
  async analyzeText(filename) {
    try {
      const content = fs.readFileSync(filename, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      console.log('📋 Текстовый файл:');
      console.log(`   Строк: ${lines.length}`);
      console.log(`   Символов: ${content.length}`);
      
      console.log('\n📊 Первые строки:');
      lines.slice(0, 10).forEach((line, index) => {
        console.log(`   ${index + 1}. ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
      });
      
      // Попробуем определить формат
      const format = this.detectTextFormat(content);
      console.log(`\n🎯 Предполагаемый формат: ${format}`);
      
      return {
        type: 'text',
        lines: lines.length,
        characters: content.length,
        format
      };
      
    } catch (error) {
      console.error('❌ Ошибка при анализе текстового файла:', error.message);
      throw error;
    }
  }

  /**
   * Анализ файла неизвестного типа
   */
  async analyzeUnknown(filename) {
    try {
      const content = fs.readFileSync(filename, 'utf8');
      
      console.log('📋 Файл неизвестного типа:');
      console.log(`   Размер: ${content.length} символов`);
      
      // Попробуем определить формат по содержимому
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        console.log('🎯 Похоже на JSON, попробуем проанализировать...');
        return await this.analyzeJSON(filename);
      }
      
      if (content.includes(',') && content.includes('\n')) {
        console.log('🎯 Похоже на CSV, попробуем проанализировать...');
        return await this.analyzeCSV(filename);
      }
      
      console.log('📊 Первые 500 символов:');
      console.log(content.substring(0, 500));
      
      return {
        type: 'unknown',
        size: content.length,
        preview: content.substring(0, 500)
      };
      
    } catch (error) {
      console.error('❌ Ошибка при анализе файла:', error.message);
      throw error;
    }
  }

  /**
   * Определение типа JSON данных
   */
  detectJSONDataType(data) {
    if (data.users && data.stocks && data.free_hookahs) {
      return 'full_export';
    }
    if (Array.isArray(data) && data.length > 0) {
      if (data[0].user || data[0].tg_id) {
        return 'nested_users';
      }
      return 'users_array';
    }
    if (data.tg_id || data.first_name) {
      return 'single_user';
    }
    return 'unknown';
  }

  /**
   * Извлечение пользователей из данных
   */
  extractUsers(data) {
    if (data.users && Array.isArray(data.users)) {
      return data.users;
    }
    if (Array.isArray(data)) {
      return data.map(item => item.user || item).filter(Boolean);
    }
    if (data.tg_id || data.first_name) {
      return [data];
    }
    return [];
  }

  /**
   * Извлечение акций из данных
   */
  extractStocks(data) {
    if (data.stocks && Array.isArray(data.stocks)) {
      return data.stocks;
    }
    if (Array.isArray(data)) {
      return data.flatMap(item => item.stocks || []);
    }
    return [];
  }

  /**
   * Извлечение кальянов из данных
   */
  extractHookahs(data) {
    if (data.free_hookahs && Array.isArray(data.free_hookahs)) {
      return data.free_hookahs;
    }
    if (Array.isArray(data)) {
      return data.flatMap(item => item.freeHookahs || item.free_hookahs || []);
    }
    return [];
  }

  /**
   * Печать структуры объекта
   */
  printObjectStructure(obj, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return;
    
    const indent = '  '.repeat(depth);
    
    if (Array.isArray(obj)) {
      console.log(`${indent}Array[${obj.length}]`);
      if (obj.length > 0 && depth < maxDepth) {
        this.printObjectStructure(obj[0], depth + 1, maxDepth);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).slice(0, 10).forEach(key => {
        const value = obj[key];
        const type = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
        console.log(`${indent}${key}: ${type}`);
        if (typeof value === 'object' && value !== null && depth < maxDepth) {
          this.printObjectStructure(value, depth + 1, maxDepth);
        }
      });
      if (Object.keys(obj).length > 10) {
        console.log(`${indent}... и еще ${Object.keys(obj).length - 10} полей`);
      }
    } else {
      console.log(`${indent}${typeof obj}: ${String(obj).substring(0, 50)}`);
    }
  }

  /**
   * Получение структуры объекта
   */
  getObjectStructure(obj) {
    if (Array.isArray(obj)) {
      return { type: 'array', length: obj.length, itemType: obj.length > 0 ? typeof obj[0] : 'unknown' };
    }
    if (typeof obj === 'object' && obj !== null) {
      return { type: 'object', keys: Object.keys(obj), keyCount: Object.keys(obj).length };
    }
    return { type: typeof obj };
  }

  /**
   * Анализ полей CSV
   */
  analyzeCSVFields(headers, rows) {
    const analysis = {};
    
    headers.forEach((header, index) => {
      const values = rows.map(row => {
        const parsed = this.parseCSVLine(row);
        return parsed[index] || '';
      }).filter(v => v.trim());
      
      analysis[header] = {
        type: this.detectFieldType(values),
        nonEmpty: values.length,
        sample: values.slice(0, 3)
      };
    });
    
    return analysis;
  }

  /**
   * Определение типа поля
   */
  detectFieldType(values) {
    if (values.length === 0) return 'empty';
    
    const numeric = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
    const boolean = values.filter(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(v.toLowerCase())).length;
    const date = values.filter(v => !isNaN(Date.parse(v))).length;
    
    if (numeric / values.length > 0.8) return 'numeric';
    if (boolean / values.length > 0.8) return 'boolean';
    if (date / values.length > 0.8) return 'date';
    return 'text';
  }

  /**
   * Определение формата текстового файла
   */
  detectTextFormat(content) {
    if (content.includes('{') && content.includes('}')) return 'JSON-like';
    if (content.includes(',') && content.includes('\n')) return 'CSV-like';
    if (content.includes('|')) return 'Pipe-separated';
    if (content.includes('\t')) return 'Tab-separated';
    return 'Plain text';
  }

  /**
   * Парсинг CSV строки
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}

// CLI интерфейс
async function main() {
  const filename = process.argv[2];
  const analyzer = new DataAnalyzer();

  if (!filename) {
    console.log(`
🔍 Скрипт анализа файлов с данными старого бота

Использование:
  node analyze-data-file.js <filename>

Поддерживаемые форматы:
  - JSON файлы (.json)
  - CSV файлы (.csv)
  - Текстовые файлы (.txt)
  - Файлы неизвестного типа

Примеры:
  # Анализ JSON файла
  node analyze-data-file.js old-bot-data.json
  
  # Анализ CSV файла
  node analyze-data-file.js users.csv
  
  # Анализ текстового файла
  node analyze-data-file.js data.txt

Что анализируется:
  - Структура данных
  - Количество пользователей, акций, кальянов
  - Примеры данных
  - Типы полей
  - Рекомендации по импорту
    `);
    process.exit(1);
  }

  try {
    await analyzer.analyzeFile(filename);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataAnalyzer;
