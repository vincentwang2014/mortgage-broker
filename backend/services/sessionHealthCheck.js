import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATUS_FILE = join(__dirname, '../config/loansifter-session-status.json');

const DEFAULT_STATUS = {
  status: 'login_required',      // valid | expired | login_required | unknown
  last_checked_at: null,
  last_successful_login_at: null,
  error: 'Session not yet initialized — manual login required',
};

export function getSessionStatus() {
  if (!existsSync(STATUS_FILE)) return { ...DEFAULT_STATUS };
  try {
    return JSON.parse(readFileSync(STATUS_FILE, 'utf8'));
  } catch {
    return { ...DEFAULT_STATUS };
  }
}

export function setSessionStatus(updates) {
  const current = getSessionStatus();
  const updated = {
    ...current,
    ...updates,
    last_checked_at: new Date().toISOString(),
  };
  writeFileSync(STATUS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

export function markLoginRequired(error = null) {
  return setSessionStatus({ status: 'login_required', error });
}

export function markSessionValid() {
  return setSessionStatus({
    status: 'valid',
    error: null,
    last_successful_login_at: new Date().toISOString(),
  });
}

export function markSessionExpired() {
  return setSessionStatus({ status: 'expired', error: 'Session expired — re-login required' });
}

// Placeholder health check — Playwright integration wired in Phase 1
export async function runHealthCheck() {
  console.log('[SESSION] Health check triggered');
  const status = getSessionStatus();

  if (status.status === 'unknown') {
    return setSessionStatus({
      status: 'login_required',
      error: 'Session not yet initialized',
    });
  }

  // TODO Phase 1: launch Playwright, attempt to load Loansifter dashboard,
  // check if still logged in, call markSessionValid() or markSessionExpired()
  console.log(`[SESSION] Current status: ${status.status}`);
  return getSessionStatus();
}
