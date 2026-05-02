import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import Anthropic from '@anthropic-ai/sdk';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_PATH || join(__dir, '../../data');
const SUBS_FILE = join(DATA_DIR, 'subscribers.json');

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function readActiveSubscribers() {
  try {
    if (!existsSync(SUBS_FILE)) return [];
    const subs = JSON.parse(readFileSync(SUBS_FILE, 'utf8'));
    return Object.values(subs).filter(s => s.active).map(s => s.email);
  } catch { return []; }
}

export async function sendWeeklyNewsletter() {
  // Import news module to access its in-memory cache
  const { refreshNewsCache } = await import('./news.js');
  let articles = [];
  try {
    articles = await refreshNewsCache();
  } catch { /* send with empty articles */ }

  const subscribers = readActiveSubscribers();
  if (!subscribers.length) return { sent: 0 };

  let commentary = 'The mortgage market continues to evolve. Check this week\'s top stories below.';
  try {
    const headlines = articles.slice(0, 5).map(a => a.headline || a.title).join('\n');
    if (headlines) {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: `Write a 3-4 sentence mortgage market commentary for homebuyers based on these headlines. Be warm, clear, actionable. No jargon.\n\n${headlines}\n\nWrite commentary only.` }]
      });
      commentary = response.content[0].text;
    }
  } catch { /* use default */ }

  const subject = articles.length
    ? `800 Home Loan Weekly: ${(articles.find(a => a.category === 'rates')?.headline || articles[0]?.headline || 'Your Weekly Update').slice(0, 50)}`
    : '800 Home Loan Weekly';

  const articleCards = articles.slice(0, 5).map(a => `
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;margin-bottom:1rem;background:white">
      <p style="margin:0 0 0.5rem;font-size:0.7rem;color:#94a3b8;text-transform:uppercase">${a.category} · ${a.date} · ${a.source}</p>
      <h3 style="margin:0 0 0.5rem;font-size:0.95rem;color:#0B1F3A">${a.headline || a.title}</h3>
      <p style="margin:0;color:#4a5568;font-size:0.85rem;line-height:1.6">${a.summary || ''}</p>
      ${a.link ? `<a href="${a.link}" style="color:#2563EB;font-size:0.8rem;margin-top:0.5rem;display:inline-block">Read more →</a>` : ''}
    </div>`).join('');

  const siteUrl = process.env.FRONTEND_URL || 'https://800homeloan.com';
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:1.5rem 1rem">
  <div style="background:linear-gradient(90deg,#1D4ED8,#2EC4B6);border-radius:12px 12px 0 0;padding:1.75rem 2rem">
    <h1 style="color:white;margin:0;font-size:1.3rem">800 Home Loan</h1>
    <p style="color:rgba(255,255,255,0.7);margin:0.25rem 0 0;font-size:0.78rem;text-transform:uppercase">Weekly Intelligence · ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
  </div>
  <div style="background:white;padding:2rem;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
    <div style="background:#eff6ff;border-left:3px solid #2563EB;padding:1rem 1.25rem;border-radius:0 8px 8px 0;margin-bottom:2rem">
      <p style="margin:0 0 0.25rem;font-size:0.75rem;text-transform:uppercase;color:#2563EB;font-weight:600">This Week's Commentary</p>
      <p style="margin:0;color:#0B1F3A;line-height:1.7;font-size:0.9rem">${commentary}</p>
    </div>
    <h2 style="font-size:0.8rem;text-transform:uppercase;color:#94a3b8;margin:0 0 1rem">Top Stories</h2>
    ${articleCards}
    <div style="text-align:center;margin:2rem 0;padding:1.5rem;background:#f8fafc;border-radius:10px">
      <a href="${siteUrl}/chat" style="background:#0B1F3A;color:white;padding:0.7rem 1.5rem;border-radius:8px;text-decoration:none;font-size:0.88rem;display:inline-block;margin:0.25rem">Ask AI Advisor</a>
      <a href="${siteUrl}/quote" style="background:linear-gradient(90deg,#1D4ED8,#2EC4B6);color:white;padding:0.7rem 1.5rem;border-radius:8px;text-decoration:none;font-size:0.88rem;display:inline-block;margin:0.25rem">Get My Rate</a>
    </div>
    <p style="color:#94a3b8;font-size:0.72rem;text-align:center;margin:1rem 0 0">
      800 Home Loan · Licensed California Mortgage Broker<br>
      <a href="${siteUrl}/api/subscribe/unsubscribe?email={{EMAIL}}" style="color:#94a3b8">Unsubscribe</a>
    </p>
  </div>
</div></body></html>`;

  let sent = 0;
  for (const email of subscribers) {
    try {
      await getResend().emails.send({
        from: `800 Home Loan <${process.env.FROM_EMAIL}>`,
        to: email, subject,
        html: html.replace('{{EMAIL}}', encodeURIComponent(email)),
      });
      sent++;
      await new Promise(r => setTimeout(r, 100));
    } catch (e) { console.error(`[Newsletter] Failed to send to ${email}:`, e.message); }
  }
  return { sent, total: subscribers.length };
}

export default { sendWeeklyNewsletter };
