This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Create a `.env.local` in `next-app` with:

```
# Telegram bot token for initData verification
# Get this from @BotFather in Telegram
TG_BOT_TOKEN=123456789:ABCDEF
NEXT_PUBLIC_TG_BOT_USERNAME=your_bot_username_without_at
TG_WEBHOOK_SECRET=generate_a_random_secret_string
WEBAPP_URL=https://your-domain.example

# Neon database connection string
# Get this from your Neon dashboard
DATABASE_URL=postgresql://username:password@hostname/database
```

Then restart the dev server. API routes run on the same domain as the frontend (no CORS) and verify Telegram `initData` via `TG_BOT_TOKEN`.

### Telegram Bot Integration (all on Next.js)

1. Set `NEXT_PUBLIC_TG_BOT_USERNAME` to your bot username (without `@`). The home page button will open Telegram using a deep link and fallback to `https://t.me/<bot>?start`.
2. Set `WEBAPP_URL` to the public URL of this Next app (used by webhook to form the WebApp button URL `WEBAPP_URL/register`).
3. Optionally set `TG_WEBHOOK_SECRET` for Telegram webhook verification.
4. Configure Telegram webhook to point to: `https://<your-domain>/api/telegram/webhook` and, if you use secret, supply header `X-Telegram-Bot-Api-Secret-Token: <TG_WEBHOOK_SECRET>`.

Webhook behavior: When the bot receives `/start`, it replies with an inline WebApp button pointing to `WEBAPP_URL/register`. Inside Telegram WebApp, the registration page validates `initData` server-side.

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` with:
   ```bash
   # Telegram bot
   TG_BOT_TOKEN=123456789:ABCDEF
   NEXT_PUBLIC_TG_BOT_USERNAME=your_bot_username_without_at
   TG_WEBHOOK_SECRET=generate_a_random_secret_string
   
   # Public URL where your Next app is reachable
   WEBAPP_URL=https://your-domain.example
   
   # Database (optional)
   DATABASE_URL=postgresql://username:password@host:5432/database
   ```

3. **Set up database (optional):**
   ```bash
   npm run setup-db
   # Follow the instructions to create your Neon database
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Set up Telegram webhook:**
   ```bash
   npm run setup-webhook
   ```

## Database Setup

1. Create a Neon database at [neon.tech](https://neon.tech)
2. Copy your connection string to `DATABASE_URL` in `.env.local`
3. Run the schema setup:

```bash
# Connect to your Neon database and run:
psql "your-neon-connection-string" -f src/lib/schema.sql
```

Or use the Neon SQL Editor to execute the contents of `src/lib/schema.sql`.

## API Routes

- `POST /api/register` - Register new user (requires Telegram initData)
- `GET /api/stocks/[tgId]` - Get user's stock progress
- `GET /api/free-hookahs/[tgId]` - Get user's free hookahs
- `POST /api/free-hookahs/[tgId]` - Use a free hookah

All routes require valid Telegram `initData` in the `x-telegram-init-data` header.

## Debugging & Testing

### Test Webhook Manually
```bash
# Test webhook endpoint
curl -X POST "https://your-domain.example/api/telegram/test" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "YOUR_CHAT_ID"}'
```

### Check Webhook Status
```bash
# Get webhook info
curl "https://api.telegram.org/bot$TG_BOT_TOKEN/getWebhookInfo"
```

### Debug Logs
- Check Vercel function logs for webhook debug output
- Look for "=== WEBHOOK DEBUG START ===" in logs
- Test endpoint: `GET /api/telegram/test` shows current configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
