import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { retrieveContext } from '../lib/rag.js';

const router = express.Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const AGENTS_PATH = join(__dir, '../config/agents.json');
const PROMPT_PATH = join(__dir, '../config/prompt.md');
const KNOWLEDGE_PATH = join(__dir, '../config/knowledge.md');

let _anthropic = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

function loadAgents() {
  try {
    if (!existsSync(AGENTS_PATH)) return [];
    return JSON.parse(readFileSync(AGENTS_PATH, 'utf-8')).agents || [];
  } catch { return []; }
}

function getAgent(agentId) {
  const agents = loadAgents();
  if (agentId) return agents.find(a => a.id === agentId && a.enabled) || null;
  return agents.find(a => a.isDefault && a.enabled) || agents.find(a => a.enabled) || null;
}

function buildSystemPrompt(agent) {
  let prompt = agent?.systemPrompt || '';
  let knowledge = agent?.knowledgeBase || '';

  if (!prompt) {
    try {
      if (existsSync(PROMPT_PATH)) prompt = readFileSync(PROMPT_PATH, 'utf-8');
    } catch {
      prompt = `You are an expert mortgage advisor at ClearPath Mortgage, a licensed California mortgage broker.
Answer clearly with concrete numbers. Never ask for SSN or full address. Be warm and helpful.`;
    }
  }

  if (!knowledge) {
    try {
      if (existsSync(KNOWLEDGE_PATH)) {
        const k = readFileSync(KNOWLEDGE_PATH, 'utf-8');
        if (k.trim()) knowledge = k;
      }
    } catch { /* ignore */ }
  }

  const parts = [prompt.trim()];
  if (knowledge.trim()) parts.push(`== BROKER KNOWLEDGE BASE ==\n${knowledge.trim()}`);
  return parts.join('\n\n');
}

function buildFullPrompt(agent, ragContext) {
  const base = buildSystemPrompt(agent);
  return ragContext ? `${base}\n\n${ragContext}` : base;
}

const LANG_INSTRUCTION = `

== LANGUAGE ==
Detect the language of the user's most recent message and respond in that same language.
- If the user writes in Chinese (any form), respond entirely in Simplified Chinese (简体中文).
- If the user writes in English, respond in English.
- If unclear, default to English.
Use professional, clear financial language appropriate for homebuyers.`;

// ── SSE helper: forward OpenAI-compatible stream (OpenAI + Ollama) ────────────
async function pipeOAIStream(response, res) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      } catch { /* skip malformed chunks */ }
    }
  }
}

// ── Streaming provider functions ──────────────────────────────────────────────
async function streamAnthropic(agent, messages, ragContext, res) {
  const model = agent?.model || 'claude-sonnet-4-6';
  const maxTokens = agent?.maxTokens || 1000;
  const systemPrompt = buildFullPrompt(agent, ragContext) + LANG_INSTRUCTION;

  const stream = getAnthropic().messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt || undefined,
    messages: messages.slice(-20),
  });

  stream.on('text', text => {
    res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
  });

  await stream.finalMessage();
}

async function streamOllama(agent, messages, ragContext, res) {
  const baseUrl = (agent.baseUrl || 'http://localhost:11434').replace(/\/$/, '');
  const systemPrompt = buildFullPrompt(agent, ragContext) + LANG_INSTRUCTION;

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: agent.model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages.slice(-20),
      ],
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.maxTokens ?? 1000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Ollama error ${response.status}: ${text}`);
  }
  await pipeOAIStream(response, res);
}

async function streamOpenAI(agent, messages, ragContext, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const base = (agent.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const systemPrompt = buildFullPrompt(agent, ragContext) + LANG_INSTRUCTION;

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: agent.model || 'gpt-4o',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages.slice(-20),
      ],
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.maxTokens ?? 1000,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }
  await pipeOAIStream(response, res);
}

async function streamGemini(agent, messages, ragContext, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const model = agent.model || 'gemini-2.0-flash';
  const systemPrompt = buildFullPrompt(agent, ragContext) + LANG_INSTRUCTION;

  const contents = messages.slice(-20).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
        generationConfig: {
          temperature: agent.temperature ?? 0.7,
          maxOutputTokens: agent.maxTokens ?? 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(line.slice(6).trim());
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
      } catch { /* skip */ }
    }
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { messages, agentId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const agent = getAgent(agentId);
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const ragContext = lastUser ? retrieveContext(lastUser.content) : '';

    const providers = { ollama: streamOllama, openai: streamOpenAI, gemini: streamGemini };
    const fn = providers[agent?.provider] || streamAnthropic;
    await fn(agent, messages, ragContext, res);
  } catch (e) {
    console.error('[Chat API]', e);
    res.write(`data: ${JSON.stringify({ error: 'AI service unavailable' })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

export default router;
