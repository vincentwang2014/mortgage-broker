# ClearPath Mortgage — Full Stack Project

## Tech Stack
- **Frontend**: React + Vite → Deploy to Vercel
- **Backend**: Node.js API Routes → Vercel Functions / Railway
- **News**: RSS feeds + Claude AI summaries → Vercel KV cache
- **Email**: Resend API + newsletter automation
- **Database**: Vercel KV (Redis) for caching + subscribers

## Quick Start

### 1. Environment Variables
Create `.env` in backend/:
```
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
FROM_EMAIL=newsletter@yourdomain.com
BROKER_EMAIL=you@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

### 2. Run locally
```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```
