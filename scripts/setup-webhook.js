#!/usr/bin/env node

/**
 * Скрипт для настройки Telegram webhook
 * Настраивает webhook вместо polling для работы бота в облаке
 */

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN || '8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://frontend-delta-sandy-58.vercel.app/api/telegram/webhook';

async function setupWebhook() {
  console.log('🔧 Настройка Telegram webhook...');
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
  
  try {
    // 1. Удаляем старый webhook (если есть)
    console.log('🗑️  Удаление старого webhook...');
    await makeRequest('deleteWebhook');
    
    // 2. Устанавливаем новый webhook
    console.log('✅ Установка нового webhook...');
    const result = await makeRequest('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query']
    });
    
    if (result.ok) {
      console.log('🎉 Webhook успешно настроен!');
      console.log('📊 Информация о webhook:');
      console.log(`   URL: ${result.result.url}`);
      console.log(`   Pending updates: ${result.result.pending_update_count}`);
    } else {
      console.error('❌ Ошибка настройки webhook:', result.description);
    }
    
    // 3. Проверяем информацию о боте
    console.log('\n🤖 Информация о боте:');
    const botInfo = await makeRequest('getMe');
    if (botInfo.ok) {
      console.log(`   Имя: ${botInfo.result.first_name}`);
      console.log(`   Username: @${botInfo.result.username}`);
      console.log(`   ID: ${botInfo.result.id}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

function makeRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
    const postData = JSON.stringify(params);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Запускаем настройку
if (require.main === module) {
  setupWebhook();
}

module.exports = { setupWebhook };