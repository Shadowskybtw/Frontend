module.exports = {
  apps: [{
    name: 'dungeonhookah-bot',
    script: 'index.js',
    args: 'start',
    cwd: '/Users/nikolajmisin/Documents/WebApp/telegram-bot',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://neondb_owner:npg_Z9sDKnLjrX4l@ep-odd-surf-a2btswct-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      BOT_TOKEN: '8242076298:AAGnHplpi7Ad4hOo9z4zTugjqcCEXLJt9to',
      NOTIFICATION_TIME: '18:00',
      TIMEZONE: 'Europe/Moscow',
      BOT_NAME: 'DUNGEONHOOKAH_BOT',
      BOT_USERNAME: 'DUNGEONHOOKAH_BOT'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
