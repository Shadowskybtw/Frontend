#!/usr/bin/env node

const https = require('https');

const BOT_TOKEN = '7829386579:AAGAUFZdd6PbuDtdEI1zxAkfY1vlj0Mu0WE';
const WEBAPP_URL = 'https://next-5th7g9hii-shadowskys-projects.vercel.app/register';

let offset = 0;

function makeRequest(method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: data ? 'POST' : 'GET',
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      } : {}
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function sendMessage(chatId, text, replyMarkup = null) {
  const data = JSON.stringify({
    chat_id: chatId,
    text: text,
    ...(replyMarkup && { reply_markup: replyMarkup })
  });
  
  return await makeRequest('sendMessage', data);
}

async function getUpdates() {
  return await makeRequest(`getUpdates?offset=${offset}&timeout=30`);
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;

  console.log(`Received: ${text} from chat ${chatId}`);

  if (text && text.startsWith('/start')) {
    console.log(`Sending WebApp button to chat ${chatId}`);
    
    const replyMarkup = {
      inline_keyboard: [[
        {
          text: '🚀 Открыть приложение',
          web_app: { url: WEBAPP_URL }
        }
      ]]
    };

    const result = await sendMessage(
      chatId,
      'Добро пожаловать! Нажмите кнопку ниже, чтобы открыть приложение:',
      replyMarkup
    );

    console.log('Message sent:', result.ok);
  }
}

async function poll() {
  try {
    console.log('Polling for updates...');
    const updates = await getUpdates();
    
    if (updates.ok && updates.result.length > 0) {
      for (const update of updates.result) {
        if (update.message) {
          await handleMessage(update.message);
        }
        offset = update.update_id + 1;
      }
    }
  } catch (error) {
    console.error('Polling error:', error);
  }
  
  // Continue polling
  setTimeout(poll, 1000);
}

console.log('Starting bot polling...');
console.log('Send /start to the bot to test');
poll();
