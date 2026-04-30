import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const __dir = dirname(fileURLToPath(import.meta.url));

function loadUWGuidelines() {
  const docsDir = join(__dir, '../uw-docs');
  if (!existsSync(docsDir)) return '';
  const files = readdirSync(docsDir).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
  return files.map(f => {
    const content = readFileSync(join(docsDir, f), 'utf-8');
    return `\n\n=== ${f.replace(/\.[^.]+$/, '').toUpperCase()} ===\n${content}`;
  }).join('\n');
}

const UW_DOCS = loadUWGuidelines();

const SYSTEM_PROMPT = `You are an expert mortgage advisor at ClearPath Mortgage, a licensed California mortgage broker.

== UNDERWRITING KNOWLEDGE ==

CONVENTIONAL LOANS (Fannie Mae / Freddie Mac):
- Min credit score: 620 (740+ for best pricing)
- Max DTI: 45% standard; up to 50% with strong compensating factors
- LTV: 97% primary, 85% second home, 85% investment
- PMI required when LTV > 80%; removable at 80% LTV
- 2025 Conforming Limits: $806,500 baseline; $1,209,750 high-cost CA areas

FHA LOANS:
- Min credit: 580 = 3.5% down; 500-579 = 10% down
- Max DTI: 43% standard; up to 57% with AUS approval
- MIP: Upfront 1.75% + Annual 0.55% (life of loan if <10% down)

VA LOANS:
- No min credit score (lender overlays 580-620)
- No down payment, no PMI
- VA Funding Fee: 2.15% first use, 3.3% subsequent
- Requires COE; available to veterans/active duty/surviving spouses

JUMBO (above conforming):
- 680+ credit; 720+ for better pricing
- Max DTI 43%; 10-20% down; 6-12mo reserves

DSCR (Investment, no income verification):
- DSCR = Monthly Rent / PITIA; min 1.0-1.25
- Min credit 660-700; LTV up to 80%

NON-QM / BANK STATEMENT:
- 12 or 24 months bank statements for income
- Min credit 620+; LTV up to 90%

${UW_DOCS ? `== UPLOADED GUIDELINES ==\n${UW_DOCS}` : ''}

== RULES ==
1. Answer clearly with concrete numbers and examples.
2. NEVER ask for SSN, date of birth, bank accounts, or full address.
3. Always recommend formal application for precise numbers.
4. Flag tax/legal questions to CPA/attorney.
5. Be warm and non-condescending.
6. Never fabricate guidelines. Say "I'm not certain" when unsure.`;

router.post('/', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-20),
    });
    res.json({ content: response.content[0].text });
  } catch (e) {
    console.error('[Chat API]', e);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

export default router;
