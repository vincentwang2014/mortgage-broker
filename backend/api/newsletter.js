import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import Anthropic from '@anthropic-ai/sdk';

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function sendWeeklyNewsletter() {
  let articles = [];
  try {
    const cached = await kv.get('news:articles');
    articles = cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : [];
  } catch (e) { console.warn('Could not fetch cached news'); }

  let subscribers = [];
  try {
    subscribers = await kv.smembers('subscribers:list');
  } catch (e) {
    return { sent: 0, error: e.message };
  }

  if (!subscribers.length) return { sent: 0 };

  let commentary = 'The mortgage market continues to evolve. Check this week\'s top stories below.';
  try {
    const headlines = articles.slice(0, 5).map(a => a.headline || a.title).join('\n');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: `Write a 3-4 sentence mortgage market commentary for homebuyers based on these headlines. Be warm, clear, actionable. No jargon.\n\n${headlines}\n\nWrite commentary only.` }]
    });
    commentary = response.content[0].text;
  } catch { /* use default */ }

  const subject = articles.length
    ? `ClearPath Weekly: ${(articles.find(a => a.category === 'rates')?.headline || articles[0]?.headline || 'Your Weekly Update').slice(0, 50)}`
    : 'ClearPath Mortgage Weekly';

  const articleCards = articles.slice(0, 5).map(a => `
    <div style="border:1px solid #e2ddd6;border-radius:10px;padding:1.25rem;margin-bottom:1rem;background:white">
      <p style="margin:0 0 0.5rem;font-size:0.7rem;color:#9ca3af;text-transform:uppercase">${a.category} · ${a.date} · ${a.source}</p>
      <h3 style="margin:0 0 0.5rem;font-size:0.95rem;color:#1a2332">${a.headline || a.title}</h3>
      <p style="margin:0;color:#4a5568;font-size:0.85rem;line-height:1.6">${a.summary || ''}</p>
      ${a.link ? `<a href="${a.link}" style="color:#c9a96e;font-size:0.8rem;margin-top:0.5rem;display:inline-block">Read more</a>` : ''}
    </div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f8f5f0;font-family:'Helvetica Neue',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:1.5rem 1rem">
  <div style="background:#0a1628;border-radius:12px 12px 0 0;padding:1.75rem 2rem">
    <h1 style="color:#c9a96e;margin:0;font-size:1.3rem">ClearPath Mortgage</h1>
    <p style="color:rgba(255,255,255,0.5);margin:0.25rem 0 0;font-size:0.78rem;text-transform:uppercase">Weekly Intelligence · ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
  </div>
  <div style="background:white;padding:2rem;border:1px solid #e2ddd6;border-top:none;border-radius:0 0 12px 12px">
    <div style="background:#f8f5f0;border-left:3px solid #c9a96e;padding:1rem 1.25rem;border-radius:0 8px 8px 0;margin-bottom:2rem">
      <p style="margin:0 0 0.25rem;font-size:0.75rem;text-transform:uppercase;color:#c9a96e;font-weight:600">This Week's Commentary</p>
      <p style="margin:0;color:#1a2332;line-height:1.7;font-size:0.9rem">${commentary}</p>
    </div>
    <h2 style="font-size:0.8rem;text-transform:uppercase;color:#9ca3af;margin:0 0 1rem">Top Stories</h2>
    ${articleCards}
    <div style="text-align:center;margin:2rem 0;padding:1.5rem;background:#f8f5f0;border-radius:10px">
      <a href="${process.env.FRONTEND_URL || 'https://clearpathmortgage.com'}/chat" style="background:#0a1628;color:white;padding:0.7rem 1.5rem;border-radius:8px;text-decoration:none;font-size:0.88rem;display:inline-block;margin:0.25rem">Ask AI Advisor</a>
      <a href="${process.env.FRONTEND_URL || 'https://clearpathmortgage.com'}/quote" style="background:#c9a96e;color:#0a1628;padding:0.7rem 1.5rem;border-radius:8px;text-decoration:none;font-size:0.88rem;display:inline-block;margin:0.25rem">Get a Rate Quote</a>
    </div>
    <p style="color:#9ca3af;font-size:0.72rem;text-align:center;margin:1rem 0 0">
      ClearPath Mortgage · Licensed California Mortgage Broker<br>
      <a href="${process.env.FRONTEND_URL || 'https://clearpathmortgage.com'}/api/subscribe/unsubscribe?email={{UNSUBSCRIBE_EMAIL}}" style="color:#9ca3af">Unsubscribe</a>
    </p>
  </div>
</div></body></html>`;

  let sent = 0;
  for (const email of subscribers) {
    try {
      await getResend().emails.send({
        from: `ClearPath Mortgage <${process.env.FROM_EMAIL}>`,
        to: email, subject,
        html: html.replace('{{UNSUBSCRIBE_EMAIL}}', encodeURIComponent(email)),
      });
      sent++;
      await new Promise(r => setTimeout(r, 100));
    } catch (e) { console.error(`Failed to send to ${email}:`, e.message); }
  }
  return { sent, total: subscribers.length };
}

export default { sendWeeklyNewsletter };
