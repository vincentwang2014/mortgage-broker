import express from 'express';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

  const subscriber = {
    email: email.toLowerCase().trim(),
    name: name?.trim() || '',
    subscribedAt: new Date().toISOString(),
    active: true,
  };

  try {
    const key = `subscribers:${subscriber.email.replace('@', '_at_')}`;
    await kv.set(key, JSON.stringify(subscriber));
    await kv.sadd('subscribers:list', subscriber.email);

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: `ClearPath Mortgage <${process.env.FROM_EMAIL || 'newsletter@clearpathmortgage.com'}>`,
        to: subscriber.email,
        subject: 'Welcome to ClearPath Mortgage Weekly',
        html: `<html><body style="margin:0;background:#f8f5f0;font-family:'Helvetica Neue',Arial,sans-serif">
          <div style="max-width:560px;margin:0 auto;padding:2rem 1rem">
            <div style="background:#0a1628;border-radius:12px 12px 0 0;padding:2rem;text-align:center">
              <h1 style="color:#c9a96e;margin:0;font-size:1.5rem">ClearPath Mortgage</h1>
            </div>
            <div style="background:white;padding:2rem;border-radius:0 0 12px 12px;border:1px solid #e2ddd6;border-top:none">
              <h2>Welcome, ${subscriber.name || 'there'}!</h2>
              <p>You're subscribed to ClearPath Mortgage Weekly — every Tuesday morning.</p>
              <ul><li>Rate movements</li><li>Market trends</li><li>Guideline updates</li></ul>
              <a href="${process.env.FRONTEND_URL || 'https://clearpathmortgage.com'}"
                 style="background:#0a1628;color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;display:inline-block;margin-top:1rem">
                Visit Our Site
              </a>
            </div>
          </div>
        </body></html>`,
      });
    }
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (e) {
    console.error('[Subscribe]', e);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

router.get('/unsubscribe', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send('Missing email');
  try {
    const key = `subscribers:${email.replace('@', '_at_')}`;
    const data = await kv.get(key);
    if (data) {
      const sub = typeof data === 'string' ? JSON.parse(data) : data;
      sub.active = false;
      await kv.set(key, JSON.stringify(sub));
      await kv.srem('subscribers:list', email);
    }
    res.send('<html><body style="font-family:sans-serif;text-align:center;padding:3rem"><h2>Unsubscribed</h2><p>You\'ve been removed from ClearPath Mortgage Weekly.</p></body></html>');
  } catch (e) {
    res.status(500).send('Error processing unsubscribe');
  }
});

router.get('/count', async (req, res) => {
  try {
    const count = await kv.scard('subscribers:list');
    res.json({ count });
  } catch { res.json({ count: 0 }); }
});

export default router;
