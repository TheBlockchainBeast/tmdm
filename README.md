# TMD Market - Telegram Mini App

A Telegram Mini App built with Next.js, React, and TypeScript.

## Features

- 🚀 Next.js 14 with App Router
- ⚛️ React 18
- 📘 TypeScript
- 🎨 Tailwind CSS
- 📱 Telegram WebApp API integration
- 🔧 ESLint configured

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Telegram Mini App Setup

1. Create a bot using [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newapp` command to create a new Mini App
3. Set the web app URL to your deployed application
4. The app will automatically initialize when opened in Telegram

## Project Structure

```
.
├── app/              # Next.js app directory
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # React components
├── lib/              # Utility functions
│   └── telegram.ts   # Telegram WebApp helpers
├── types/            # TypeScript type definitions
│   └── telegram.d.ts # Telegram WebApp types
└── public/           # Static assets
```

## Telegram WebApp API

The app includes TypeScript types and utility functions for the Telegram WebApp API. You can access the WebApp instance using:

```typescript
import { getTelegramWebApp, getTelegramUser } from '@/lib/telegram';

const tg = getTelegramWebApp();
const user = getTelegramUser();
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private project
