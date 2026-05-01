import express from 'express';
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createDoc } from '../lib/rag.js';

const router = express.Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = join(__dir, '../../config/chatlogs');
mkdirSync(LOGS_DIR, { recursive: true });

function auth(req, res) {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// Save/update a session — no auth, fire-and-forget from frontend
router.post('/', (req, res) => {
  try {
    const { sessionId, messages, agentId, lang } = req.body;
    if (!sessionId || !Array.isArray(messages) || messages.length < 2) {
      return res.status(400).json({ error: 'Invalid log' });
    }
    const log = { id: sessionId, agentId: agentId || null, lang: lang || 'en', messages, savedAt: new Date().toISOString() };
    writeFileSync(join(LOGS_DIR, `${sessionId}.json`), JSON.stringify(log, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List sessions (admin)
router.get('/', (req, res) => {
  if (!auth(req, res)) return;
  try {
    const files = readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));
    const sessions = files.map(f => {
      try {
        const d = JSON.parse(readFileSync(join(LOGS_DIR, f), 'utf-8'));
        return {
          id: d.id,
          lang: d.lang,
          agentId: d.agentId,
          messageCount: d.messages?.length || 0,
          preview: d.messages?.find(m => m.role === 'user')?.content?.slice(0, 90) || '',
          savedAt: d.savedAt,
        };
      } catch { return null; }
    }).filter(Boolean).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get full session (admin)
router.get('/:id', (req, res) => {
  if (!auth(req, res)) return;
  const p = join(LOGS_DIR, `${req.params.id}.json`);
  if (!existsSync(p)) return res.status(404).json({ error: 'Not found' });
  try {
    res.json(JSON.parse(readFileSync(p, 'utf-8')));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete session (admin)
router.delete('/:id', (req, res) => {
  if (!auth(req, res)) return;
  const p = join(LOGS_DIR, `${req.params.id}.json`);
  if (!existsSync(p)) return res.status(404).json({ error: 'Not found' });
  unlinkSync(p);
  res.json({ ok: true });
});

// Save admin correction as RAG doc (admin)
router.post('/:id/correction', (req, res) => {
  if (!auth(req, res)) return;
  try {
    const p = join(LOGS_DIR, `${req.params.id}.json`);
    if (!existsSync(p)) return res.status(404).json({ error: 'Session not found' });
    const log = JSON.parse(readFileSync(p, 'utf-8'));
    const { title, correction } = req.body;
    if (!correction?.trim()) return res.status(400).json({ error: 'Correction text required' });

    const qa = log.messages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n\n');
    const content = `== Admin Correction ==\n${correction}\n\n== Original Conversation ==\n${qa}`;

    const doc = createDoc({
      title: title || `Correction — ${new Date().toLocaleDateString()}`,
      type: 'correction',
      source: 'admin',
      content,
    });
    res.json({ ok: true, docId: doc.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
