import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const __dir = dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = join(__dir, '../config/prompt.md');

function loadSystemPrompt() {
  try {
    if (existsSync(PROMPT_PATH)) return readFileSync(PROMPT_PATH, 'utf-8');
  } catch (e) {
    console.warn('[Chat] Could not read prompt.md, using fallback');
  }
  return `You are an expert mortgage advisor at ClearPath Mortgage, a licensed California mortgage broker.
Answer clearly with concrete numbers. Never ask for SSN or full address. Be warm and helpful.`;
}

const LANG_INSTRUCTION = `

== LANGUAGE ==
Detect the language of the user's most recent message and respond in that same language.
- If the user writes in Chinese (any form), respond entirely in Simplified Chinese (简体中文).
- If the user writes in English, respond in English.
- If unclear, default to English.
Use professional, clear financial language appropriate for homebuyers.`;

router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  const systemPrompt = loadSystemPrompt() + LANG_INSTRUCTION;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages.slice(-20),
    });
    res.json({ content: response.content[0].text });
  } catch (e) {
    console.error('[Chat API]', e);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

export default router;
