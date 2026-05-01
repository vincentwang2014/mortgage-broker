import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
export const DOCS_DIR = join(__dir, '../config/documents');
mkdirSync(DOCS_DIR, { recursive: true });

// ── Text chunking ─────────────────────────────────────────────────────────────
// Target ~400 words per chunk with one-paragraph overlap for context continuity

export function chunkText(text, targetWords = 400) {
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const paras = clean.split(/\n\n+/).filter(p => p.trim().length > 30);
  const chunks = [];
  let cur = [], curLen = 0;

  for (const para of paras) {
    const wc = para.split(/\s+/).length;
    if (curLen + wc > targetWords && cur.length) {
      chunks.push(cur.join('\n\n'));
      cur = cur.slice(-1);                              // keep last para as overlap
      curLen = cur[0]?.split(/\s+/).length || 0;
    }
    cur.push(para.trim());
    curLen += wc;
  }
  if (cur.length) chunks.push(cur.join('\n\n'));
  return chunks.filter(c => c.trim().split(/\s+/).length > 15);
}

// ── BM25 retrieval ────────────────────────────────────────────────────────────
// k1=1.5, b=0.75 are standard BM25 parameters

const K1 = 1.5;
const B  = 0.75;

function tok(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

export function bm25(query, corpus) {
  const qTerms = tok(query);
  if (!qTerms.length || !corpus.length) return [];

  const tokenized = corpus.map(c => tok(c.text));
  const avgLen = tokenized.reduce((s, t) => s + t.length, 0) / tokenized.length;

  // Document frequency: how many chunks contain each term
  const df = {};
  for (const tokens of tokenized) {
    for (const t of new Set(tokens)) df[t] = (df[t] || 0) + 1;
  }
  const N = corpus.length;

  return corpus
    .map((doc, i) => {
      const tokens = tokenized[i];
      const tf = {};
      for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
      const len = tokens.length;

      let score = 0;
      for (const term of qTerms) {
        if (!tf[term]) continue;
        const idf = Math.log((N - (df[term] || 0) + 0.5) / ((df[term] || 0) + 0.5) + 1);
        score += idf * (tf[term] * (K1 + 1)) / (tf[term] + K1 * (1 - B + B * len / avgLen));
      }
      return { ...doc, score };
    })
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ── Document storage ──────────────────────────────────────────────────────────

export function listDocs() {
  try {
    return readdirSync(DOCS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const d = JSON.parse(readFileSync(join(DOCS_DIR, f), 'utf-8'));
        return {
          id: d.id, title: d.title, type: d.type, lender: d.lender,
          date: d.date, source: d.source, createdAt: d.createdAt,
          chunkCount: d.chunks?.length || 0,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch { return []; }
}

export function getDoc(id) {
  const p = join(DOCS_DIR, `${id}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf-8')) : null;
}

export function deleteDoc(id) {
  const p = join(DOCS_DIR, `${id}.json`);
  if (!existsSync(p)) return false;
  unlinkSync(p);
  return true;
}

export function createDoc({ title, type, lender, date, source, content }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const chunks = chunkText(content).map((text, i) => ({ i, text }));
  const doc = {
    id,
    title: title || 'Untitled',
    type: type || 'general',
    lender: lender || '',
    date: date || new Date().toISOString().slice(0, 10),
    source: source || 'manual',
    content,
    chunks,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(join(DOCS_DIR, `${id}.json`), JSON.stringify(doc, null, 2), 'utf-8');
  return doc;
}

// ── Context retrieval for chat ────────────────────────────────────────────────

export function retrieveContext(query, topN = 6) {
  let files;
  try { files = readdirSync(DOCS_DIR).filter(f => f.endsWith('.json')); }
  catch { return ''; }
  if (!files.length) return '';

  // Build flat corpus of all chunks across all documents
  const corpus = [];
  for (const f of files) {
    try {
      const doc = JSON.parse(readFileSync(join(DOCS_DIR, f), 'utf-8'));
      const meta = [doc.title, doc.lender, doc.date].filter(Boolean).join(' · ');
      for (const chunk of (doc.chunks || [])) {
        corpus.push({ docMeta: meta, text: chunk.text });
      }
    } catch { /* skip corrupt files */ }
  }
  if (!corpus.length) return '';

  const hits = bm25(query, corpus).slice(0, topN);
  if (!hits.length) return '';

  const blocks = hits.map(h => `[${h.docMeta}]\n${h.text}`);
  return `== RETRIEVED KNOWLEDGE ==\n${blocks.join('\n\n---\n\n')}`;
}
