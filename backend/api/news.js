import express from 'express';
import Parser from 'rss-parser';
import Anthropic from '@anthropic-ai/sdk';
import { createDoc, pruneDocsByType } from '../lib/rag.js';

const router = express.Router();
const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'ClearPathMortgage/1.0' } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
let _cache = null;
let _cacheAt = 0;

const RSS_SOURCES = [
  { url: 'https://www.housingwire.com/feed/', name: 'HousingWire', category: 'market' },
  { url: 'https://www.mortgagenewsdaily.com/feeds/fnm.rss', name: 'Mortgage News Daily', category: 'rates' },
  { url: 'https://www.consumerfinance.gov/about-us/newsroom/feed/', name: 'CFPB', category: 'regulatory' },
  { url: 'https://www.freddiemac.com/research/rss', name: 'Freddie Mac', category: 'market' },
  { url: 'https://mba.org/news-research-and-resources/rss', name: 'MBA', category: 'market' },
];

async function fetchRSSFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.slice(0, 4).map(item => ({
      title: item.title?.trim() || '',
      link: item.link || '',
      content: item.contentSnippet || item.summary || item.content || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      source: source.name,
      category: source.category,
    }));
  } catch (e) {
    console.warn(`[RSS] Failed ${source.name}: ${e.message}`);
    return [];
  }
}

async function summarizeArticles(articles) {
  if (!articles.length) return [];
  const articlesText = articles.map((a, i) =>
    `[${i}] TITLE: ${a.title}\nSOURCE: ${a.source}\nDATE: ${a.pubDate}\nCONTENT: ${a.content.slice(0, 400)}`
  ).join('\n\n---\n\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Summarize these mortgage industry articles for professionals and homebuyers.
Return ONLY a JSON array, no markdown:
[{"index":0,"summary":"2-sentence summary","category":"rates|market|regulatory|other","headline":"Under 12 word headline"}]

Articles:\n${articlesText}`
      }]
    });
    const text = response.content[0].text;
    const summaries = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
    return articles.map((article, i) => {
      const s = summaries.find(x => x.index === i);
      return {
        ...article,
        summary: s?.summary || article.content.slice(0, 200),
        headline: s?.headline || article.title,
        category: s?.category || article.category,
        date: new Date(article.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    });
  } catch (e) {
    console.error('[AI] Summarization failed:', e.message);
    return articles.map(a => ({ ...a, summary: a.content.slice(0, 200), headline: a.title,
      date: new Date(a.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }));
  }
}

export async function refreshNewsCache() {
  const rawArticles = (await Promise.all(RSS_SOURCES.map(fetchRSSFeed))).flat();
  const seen = new Set();
  const unique = rawArticles.filter(a => {
    const key = a.title.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sorted = unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 12);
  const summarized = await summarizeArticles(sorted);
  _cache = summarized;
  _cacheAt = Date.now();
  try {
    pruneDocsByType('news');
    for (const article of summarized) {
      createDoc({
        title: article.headline,
        type: 'news',
        date: article.date,
        source: article.source,
        content: `Source: ${article.source} | Date: ${article.date}\n\n${article.summary}`,
      });
    }
  } catch (e) { console.warn('[RAG] News ingestion failed:', e.message); }
  return summarized;
}

router.get('/', async (req, res) => {
  try {
    if (!_cache || Date.now() - _cacheAt > CACHE_TTL_MS) {
      await refreshNewsCache();
    }
    let articles = _cache || [];
    const { category } = req.query;
    if (category && category !== 'all') articles = articles.filter(a => a.category === category);
    res.json({ articles, cached: _cacheAt > 0, updatedAt: new Date(_cacheAt).toISOString() });
  } catch (e) {
    console.error('[News API]', e);
    res.status(500).json({ error: 'Failed to fetch news', articles: [] });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const articles = await refreshNewsCache();
    res.json({ success: true, count: articles.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
