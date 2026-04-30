import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = join(__dir, '../config/prompt.md');
const KNOWLEDGE_PATH = join(__dir, '../config/knowledge.md');

function auth(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(503).json({ error: 'ADMIN_PASSWORD not configured' });
  const provided = req.headers['x-admin-password'] || req.body?.password;
  if (provided !== password) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

router.post('/login', (req, res) => {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(503).json({ error: 'ADMIN_PASSWORD not configured' });
  if (req.body?.password !== password) return res.status(401).json({ error: 'Wrong password' });
  res.json({ success: true });
});

router.get('/prompt', auth, (req, res) => {
  try {
    res.json({ content: readFileSync(PROMPT_PATH, 'utf-8') });
  } catch (e) {
    res.status(500).json({ error: 'Could not read prompt file' });
  }
});

router.post('/prompt', auth, (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'content is required' });
  try {
    writeFileSync(PROMPT_PATH, content, 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not save prompt file' });
  }
});

router.get('/knowledge', auth, (req, res) => {
  try {
    res.json({ content: readFileSync(KNOWLEDGE_PATH, 'utf-8') });
  } catch (e) {
    res.status(500).json({ error: 'Could not read knowledge file' });
  }
});

router.post('/knowledge', auth, (req, res) => {
  const { content } = req.body;
  if (typeof content !== 'string') return res.status(400).json({ error: 'content is required' });
  try {
    writeFileSync(KNOWLEDGE_PATH, content, 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not save knowledge file' });
  }
});

export default router;
