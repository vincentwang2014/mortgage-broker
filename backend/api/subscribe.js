import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const router = express.Router();
const __dir = dirname(fileURLToPath(import.meta.url));
// DATA_PATH env var lets Railway point this at the mounted volume
const DATA_DIR = process.env.DATA_PATH || join(__dir, '../../data');
const SUBS_FILE = join(DATA_DIR, 'subscribers.json');

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }

function readSubs() {
  try {
    if (!existsSync(SUBS_FILE)) return {};
    return JSON.parse(readFileSync(SUBS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeSubs(data) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(SUBS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.warn('[Subs] File write failed:', e.message); }
}

router.post('/', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

  const normalized = email.toLowerCase().trim();
  const subs = readSubs();
  subs[normalized] = { email: normalized, name: name?.trim() || '', subscribedAt: new Date().toISOString(), active: true };
  writeSubs(subs);

  try {
    if (process.env.RESEND_API_KEY) {
      await getResend().emails.send({
        from: `800 Home Loan <${process.env.FROM_EMAIL || 'newsletter@800homeloan.com'}>`,
        to: normalized,
        subject: 'Welcome to 800 Home Loan Weekly',
        html: `<html><body style="margin:0;background:#0F172A;font-family:'Helvetica Neue',Arial,sans-serif">
          <div style="max-width:560px;margin:0 auto;padding:2rem 1rem">
            <div style="background:linear-gradient(90deg,#1D4ED8,#2EC4B6);border-radius:12px 12px 0 0;padding:2rem;text-align:center">
              <h1 style="color:white;margin:0;font-size:1.5rem">800 Home Loan</h1>
              <p style="color:rgba(255,255,255,0.7);margin:0.25rem 0 0;font-size:0.8rem">Your Smartest Way Home</p>
            </div>
            <div style="background:white;padding:2rem;border-radius:0 0 12px 12px">
              <h2 style="color:#0B1F3A">Welcome, ${name?.trim() || 'there'}!</h2>
              <p style="color:#4a5568">You're subscribed to 800 Home Loan Weekly — every Tuesday morning.</p>
              <ul style="color:#4a5568"><li>Rate movements</li><li>Market trends</li><li>Guideline updates</li></ul>
              <a href="${process.env.FRONTEND_URL || 'https://800homeloan.com'}"
                 style="background:linear-gradient(90deg,#1D4ED8,#2EC4B6);color:white;padding:0.75rem 2rem;border-radius:8px;text-decoration:none;display:inline-block;margin-top:1rem">
                Visit 800 Home Loan
              </a>
            </div>
          </div>
        </body></html>`,
      });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('[Subscribe email]', e.message);
    res.json({ success: true }); // subscriber saved even if welcome email fails
  }
});

router.get('/unsubscribe', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send('Missing email');
  const subs = readSubs();
  const key = email.toLowerCase().trim();
  if (subs[key]) { subs[key].active = false; writeSubs(subs); }
  res.send('<html><body style="font-family:sans-serif;text-align:center;padding:3rem"><h2>Unsubscribed</h2><p>You\'ve been removed from 800 Home Loan Weekly.</p></body></html>');
});

router.get('/count', (_req, res) => {
  const subs = readSubs();
  const count = Object.values(subs).filter(s => s.active).length;
  res.json({ count });
});

export default router;
