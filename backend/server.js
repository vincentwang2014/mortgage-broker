import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
// In Docker the dist is copied to ./frontend/dist; in local dev it lives at ../frontend/dist
const DIST = existsSync(join(__dirname, 'frontend/dist'))
  ? join(__dirname, 'frontend/dist')
  : join(__dirname, '../frontend/dist');

import newsRouter from './api/news.js';
import chatRouter from './api/chat.js';
import quoteRouter from './api/quote.js';
import subscribeRouter from './api/subscribe.js';
import adminRouter from './api/admin.js';
import agentsRouter from './api/agents.js';
import documentsRouter from './api/documents.js';
import prequalRouter from './api/prequal.js';
import chatlogRouter from './api/chatlog.js';
import guidelinesRouter from './api/guidelines.js';
import pricingJobsRouter from './api/pricingJobs.js';
import { sendWeeklyNewsletter } from './api/newsletter.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json({ limit: '10mb' }));
app.use('/api/documents', express.json({ limit: '25mb' }));

app.use('/api/news', newsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/quote', quoteRouter);
app.use('/api/subscribe', subscribeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/prequal', prequalRouter);
app.use('/api/chatlog', chatlogRouter);
app.use('/api/guidelines', guidelinesRouter);
app.use('/api/pricing-jobs', pricingJobsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve built frontend
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(join(DIST, 'index.html')));
}

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

// Weekly guideline check every Monday 7am PT (14:00 UTC)
cron.schedule('0 14 * * 1', async () => {
  console.log('[CRON] Checking guideline updates...');
  try {
    const { checkGuidelineUpdates } = await import('./api/guidelines.js');
    const results = await checkGuidelineUpdates();
    console.log(`[CRON] Guidelines: ${results.length} new docs added`);
  } catch (e) {
    console.error('[CRON] Guideline check failed:', e.message);
  }
});

// Daily Loansifter session health check at 9am PT (17:00 UTC)
cron.schedule('0 17 * * *', async () => {
  console.log('[CRON] Loansifter session health check...');
  try {
    const { runHealthCheck } = await import('./services/sessionHealthCheck.js');
    const status = await runHealthCheck();
    console.log(`[CRON] Session status: ${status.status}`);
  } catch (e) {
    console.error('[CRON] Session health check failed:', e.message);
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
  // Pre-warm news cache in background so first visitor gets a fast response
  import('./api/news.js').then(({ refreshNewsCache }) => {
    console.log('[STARTUP] Pre-warming news cache...');
    refreshNewsCache()
      .then(() => console.log('[STARTUP] News cache ready'))
      .catch(e => console.warn('[STARTUP] News pre-warm failed:', e.message));
  });
});

export default app;
