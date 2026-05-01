import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const AGENTS_PATH = join(__dir, '../config/agents.json');

function readAgents() {
  try {
    if (!existsSync(AGENTS_PATH)) return { agents: [] };
    return JSON.parse(readFileSync(AGENTS_PATH, 'utf-8'));
  } catch { return { agents: [] }; }
}

function writeAgents(data) {
  writeFileSync(AGENTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function auth(req, res, next) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(503).json({ error: 'ADMIN_PASSWORD not configured' });
  const provided = req.headers['x-admin-password'] || req.body?.password;
  if (provided !== password) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// GET /api/agents
// Public → enabled agents (id, name, description, tasks, isDefault)
// Admin (x-admin-password) → all agents with full config
router.get('/', (req, res) => {
  const { agents } = readAgents();
  const password = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'];
  const isAdmin = password && provided === password;

  if (isAdmin) {
    return res.json(agents);
  }
  res.json(
    agents
      .filter(a => a.enabled)
      .map(({ id, name, description, tasks, isDefault }) => ({ id, name, description, tasks, isDefault }))
  );
});

// GET /api/agents/:id — full config, admin only
router.get('/:id', auth, (req, res) => {
  const { agents } = readAgents();
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Not found' });
  res.json(agent);
});

// POST /api/agents — create agent
router.post('/', auth, (req, res) => {
  const data = readAgents();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const isFirst = data.agents.length === 0;

  const agent = {
    id,
    name: req.body.name || 'New Agent',
    description: req.body.description || '',
    provider: req.body.provider || 'anthropic',
    model: req.body.model || 'claude-sonnet-4-6',
    baseUrl: req.body.baseUrl || '',
    temperature: typeof req.body.temperature === 'number' ? req.body.temperature : 0.7,
    maxTokens: req.body.maxTokens || 1000,
    systemPrompt: req.body.systemPrompt || '',
    knowledgeBase: req.body.knowledgeBase || '',
    tasks: Array.isArray(req.body.tasks) ? req.body.tasks : [],
    enabled: req.body.enabled !== false,
    isDefault: isFirst ? true : (req.body.isDefault === true),
  };

  if (agent.isDefault) {
    data.agents.forEach(a => { a.isDefault = false; });
  }

  data.agents.push(agent);
  writeAgents(data);
  res.json(agent);
});

// PUT /api/agents/:id — update agent
router.put('/:id', auth, (req, res) => {
  const data = readAgents();
  const idx = data.agents.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  if (req.body.isDefault === true) {
    data.agents.forEach(a => { a.isDefault = false; });
  }

  data.agents[idx] = { ...data.agents[idx], ...req.body, id: req.params.id };
  writeAgents(data);
  res.json(data.agents[idx]);
});

// DELETE /api/agents/:id — delete agent
router.delete('/:id', auth, (req, res) => {
  const data = readAgents();
  const before = data.agents.length;
  data.agents = data.agents.filter(a => a.id !== req.params.id);
  if (data.agents.length === before) return res.status(404).json({ error: 'Not found' });
  writeAgents(data);
  res.json({ ok: true });
});

export default router;
