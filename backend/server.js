import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import newsRouter from './api/news.js';
import chatRouter from './api/chat.js';
import quoteRouter from './api/quote.js';
import subscribeRouter from './api/subscribe.js';
import adminRouter from './api/admin.js';
import { sendWeeklyNewsletter } from './api/newsletter.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/news', newsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/quote', quoteRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Refresh news every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[CRON] Refreshing news cache...');
  try {
    const { refreshNewsCache } = await import('./api/news.js');
    await refreshNewsCache();
    console.log('[CRON] News cache refreshed');
  } catch (e) {
    console.error('[CRON] News refresh failed:', e.message);
  }
});

// Weekly newsletter every Tuesday 8am PT (15:00 UTC)
cron.schedule('0 15 * * 2', async () => {
  console.log('[CRON] Sending weekly newsletter...');
  try {
    await sendWeeklyNewsletter();
    console.log('[CRON] Newsletter sent');
  } catch (e) {
    console.error('[CRON] Newsletter failed:', e.message);
  }
});

app.listen(PORT, () => {
  console.log(`ClearPath API running on port ${PORT}`);
});

export default app;
