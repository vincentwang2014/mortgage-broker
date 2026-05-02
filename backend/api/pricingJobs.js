import { Router } from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { normalizeScenario } from '../services/scenarioNormalizer.js';
import { getSessionStatus, setSessionStatus } from '../services/sessionHealthCheck.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

function getJobsDir() {
  const base = process.env.DATA_PATH || join(__dirname, '../../data');
  const dir = join(base, 'pricing-jobs');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function readJob(id) {
  const path = join(getJobsDir(), `${id}.json`);
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function writeJob(job) {
  writeFileSync(join(getJobsDir(), `${job.id}.json`), JSON.stringify(job, null, 2));
  return job;
}

function listJobs(limit = 100) {
  const dir = getJobsDir();
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => { try { return JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { return null; } })
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET /api/pricing-jobs/session — session health status
router.get('/session', requireAdmin, (req, res) => {
  res.json(getSessionStatus());
});

// POST /api/pricing-jobs/session — update session status (called by Playwright worker)
router.post('/session', requireAdmin, (req, res) => {
  const updated = setSessionStatus(req.body);
  res.json(updated);
});

// GET /api/pricing-jobs — list recent jobs
router.get('/', requireAdmin, (req, res) => {
  res.json(listJobs());
});

// POST /api/pricing-jobs — create and queue a new pricing job
router.post('/', requireAdmin, (req, res) => {
  const { scenario: rawScenario } = req.body;
  if (!rawScenario) return res.status(400).json({ error: 'scenario object is required' });

  const { scenario, errors, valid } = normalizeScenario(rawScenario);
  if (!valid) return res.status(400).json({ error: 'Invalid scenario', details: errors });

  const session = getSessionStatus();
  if (session.status === 'login_required' || session.status === 'expired') {
    return res.status(503).json({
      error: 'Loansifter session unavailable — admin login required',
      session_status: session.status,
    });
  }

  const job = writeJob({
    id: randomUUID(),
    status: 'pending',
    scenario,
    result: null,
    error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  res.status(201).json(job);
});

// GET /api/pricing-jobs/:id — get single job
router.get('/:id', requireAdmin, (req, res) => {
  const job = readJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// PATCH /api/pricing-jobs/:id — update job (called by Playwright worker to write results)
router.patch('/:id', requireAdmin, (req, res) => {
  const job = readJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { status, result, error } = req.body;
  const updated = writeJob({
    ...job,
    ...(status !== undefined && { status }),
    ...(result !== undefined && { result }),
    ...(error  !== undefined && { error }),
    updated_at: new Date().toISOString(),
  });
  res.json(updated);
});

// POST /api/pricing-jobs/:id/normalize — validate/preview scenario normalization
router.post('/normalize', requireAdmin, (req, res) => {
  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ error: 'scenario is required' });
  res.json(normalizeScenario(scenario));
});

export default router;
