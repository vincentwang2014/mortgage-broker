import express from 'express';
import Parser from 'rss-parser';
import Anthropic from '@anthropic-ai/sdk';
import { createDoc, listDocs } from '../lib/rag.js';

const router = express.Router();
const parser = new Parser({ timeout: 10000, headers: { 'User-Agent': '800HomeLoan/1.0' } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GUIDELINE_SOURCES = [
  { url: 'https://singlefamily.fanniemae.com/rss.xml', name: 'Fannie Mae', agency: 'FNMA' },
  { url: 'https://www.freddiemac.com/research/rss', name: 'Freddie Mac', agency: 'FHLMC' },
  { url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', name: 'CFPB', agency: 'regulatory' },
  { url: 'https://www.hud.gov/press/press_releases_media_advisories/rss.xml', name: 'HUD/FHA', agency: 'FHA' },
];

export async function checkGuidelineUpdates() {
  const existingDocs = listDocs();
  const existingTitles = new Set(existingDocs.map(d => d.title.slice(0, 60).toLowerCase()));
  const added = [];

  for (const src of GUIDELINE_SOURCES) {
    let items;
    try {
      const feed = await parser.parseURL(src.url);
      items = feed.items.slice(0, 5);
    } catch (e) {
      console.warn(`[Guidelines] Feed failed ${src.name}: ${e.message}`);
      continue;
    }

    for (const item of items) {
      const title = item.title?.trim() || '';
      if (!title || existingTitles.has(title.slice(0, 60).toLowerCase())) continue;
      const rawContent = item.contentSnippet || item.summary || item.content || '';
      if (rawContent.length < 60) continue;

      try {
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Summarize this mortgage guideline update in under 250 words for a licensed California mortgage broker. Focus on: what changed, effective date, impact on borrowers or underwriting criteria.\n\nTitle: ${title}\nSource: ${src.name} (${src.agency})\nContent: ${rawContent.slice(0, 1500)}`,
          }],
        });
        const summary = response.content[0].text;
        const date = item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        createDoc({
          title,
          type: 'guideline',
          lender: src.name,
          date,
          source: 'auto-guideline',
          content: `Source: ${src.name} (${src.agency}) | Date: ${date}\nLink: ${item.link || ''}\n\n${summary}`,
        });
        existingTitles.add(title.slice(0, 60).toLowerCase());
        added.push({ title, source: src.name });
      } catch (e) {
        console.warn(`[Guidelines] AI summary failed for "${title}": ${e.message}`);
      }
    }
  }

  console.log(`[Guidelines] Added ${added.length} new guideline docs`);
  return added;
}

// Manual trigger (admin only)
router.post('/refresh', async (req, res) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const results = await checkGuidelineUpdates();
    res.json({ ok: true, added: results.length, docs: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
