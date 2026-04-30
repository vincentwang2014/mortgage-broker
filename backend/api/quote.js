import express from 'express';
import { Resend } from 'resend';

const router = express.Router();
function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }

router.post('/', async (req, res) => {
  const { params, contact } = req.body;
  if (!params) return res.status(400).json({ error: 'Quote params required' });

  const propVal = parseFloat(String(params.propertyValue).replace(/[$,]/g, '')) || 0;
  const loanAmt = parseFloat(String(params.loanAmount).replace(/[$,]/g, '')) || 0;
  const ltv = propVal && loanAmt ? Math.round((loanAmt / propVal) * 100) : null;
  const downPmt = propVal && loanAmt ? propVal - loanAmt : null;

  const obParams = [
    params.loanProgram, params.loanTerm, `FICO ${params.creditScore}`,
    ltv ? `LTV ${ltv}%` : '', params.state, params.occupancy, params.propertyType,
  ].filter(Boolean).join(' · ');

  if (process.env.RESEND_API_KEY && process.env.BROKER_EMAIL) {
    try {
      await getResend().emails.send({
        from: `ClearPath Website <${process.env.FROM_EMAIL}>`,
        to: process.env.BROKER_EMAIL,
        subject: `New Quote Request — ${params.loanProgram} ${params.loanTerm}`,
        html: `<html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:1rem">
          <h2 style="color:#0a1628;border-bottom:2px solid #c9a96e;padding-bottom:0.5rem">New Quote Request</h2>
          <div style="background:#f8f5f0;border-radius:8px;padding:1rem;margin:1rem 0">
            <strong style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase">Optimal Blue Search Parameters</strong>
            <p style="font-family:monospace;background:#0a1628;color:#c9a96e;padding:0.75rem;border-radius:6px;margin:0.5rem 0 0">${obParams}</p>
          </div>
          <p><strong>Contact:</strong> ${contact || 'Not provided'}</p>
          <p><strong>Program:</strong> ${params.loanProgram} | <strong>Term:</strong> ${params.loanTerm}</p>
          <p><strong>Value:</strong> ${params.propertyValue} | <strong>Loan:</strong> ${params.loanAmount} | <strong>LTV:</strong> ${ltv ? ltv + '%' : 'N/A'}</p>
          <p><strong>Credit:</strong> ${params.creditScore} | <strong>State:</strong> ${params.state}</p>
          <p style="color:#9ca3af;font-size:0.75rem">Submitted ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT</p>
        </body></html>`,
      });
    } catch (e) {
      console.error('[Quote] Email failed:', e.message);
    }
  }

  res.json({
    success: true,
    summary: {
      ...params,
      ltv: ltv ? `${ltv}%` : 'N/A',
      downPayment: downPmt ? `$${downPmt.toLocaleString()}` : 'N/A',
      obSearchString: obParams,
    }
  });
});

export default router;
