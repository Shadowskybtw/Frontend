#!/usr/bin/env node

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  console.error('❌ TG_BOT_TOKEN not found in .env.local');
  process.exit(1);
}

if (!WEBAPP_URL) {
  console.error('❌ WEBAPP_URL not found in .env.local');
  process.exit(1);
}

const WEBHOOK_URL = `${WEBAPP_URL}/api/telegram/webhook`;

console.log('🤖 Setting up Telegram webhook...');
console.log(`Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`Webhook URL: ${WEBHOOK_URL}`);
console.log(`Secret: ${WEBHOOK_SECRET ? '✅ Set' : '❌ Not set'}`);

// First, get current webhook info
function getWebhookInfo() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getWebhookInfo`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Set webhook
function setWebhook() {
  return new Promise((resolve, reject) => {
    const payload = {
      url: WEBHOOK_URL
    };

    if (WEBHOOK_SECRET) {
      payload.secret_token = WEBHOOK_SECRET;
    }

    const postData = JSON.stringify(payload);

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n📋 Current webhook info:');
    const currentInfo = await getWebhookInfo();
    console.log(JSON.stringify(currentInfo, null, 2));

    console.log('\n🔧 Setting new webhook...');
    const result = await setWebhook();
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📱 Send /start to your bot to test`);
    } else {
      console.error('❌ Failed to set webhook:', result);
    }

    console.log('\n📋 New webhook info:');
    const newInfo = await getWebhookInfo();
    console.log(JSON.stringify(newInfo, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
