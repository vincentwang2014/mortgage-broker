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
  const downPmt = propVal && loanAmt ? Math.abs(propVal - loanAmt) : null;

  // Compact string for pasting directly into Optimal Blue
  const obParams = [
    params.purpose,
    params.loanProgram,
    params.loanTerm,
    `FICO ${params.creditScore}`,
    ltv ? `LTV ${ltv}%` : null,
    params.state,
    params.lockPeriod,
    params.occupancy,
    params.propertyType,
  ].filter(Boolean).join(' · ');

  const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

  if (process.env.RESEND_API_KEY && process.env.BROKER_EMAIL) {
    try {
      await getResend().emails.send({
        from: `ClearPath Website <${process.env.FROM_EMAIL}>`,
        to: process.env.BROKER_EMAIL,
        subject: `Rate Quote — ${params.purpose} · ${params.loanProgram} · FICO ${params.creditScore}`,
        html: `<html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:1.5rem;color:#111">
          <h2 style="color:#0a1628;border-bottom:2px solid #c9a96e;padding-bottom:0.5rem;margin-bottom:1rem">
            New Rate Quote Request
          </h2>

          <div style="background:#f8f5f0;border-radius:8px;padding:1rem;margin-bottom:1.25rem">
            <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#c9a96e;margin:0 0 0.5rem">
              Optimal Blue Search String — copy &amp; paste
            </p>
            <p style="font-family:monospace;font-size:0.95rem;background:#0a1628;color:#c9a96e;padding:0.875rem 1rem;border-radius:6px;margin:0;word-break:break-all">
              ${obParams}
            </p>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:0.875rem">
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600;width:40%">Loan Purpose</td>
              <td style="padding:0.5rem 0.75rem">${params.purpose}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0.75rem;font-weight:600">Loan Program</td>
              <td style="padding:0.5rem 0.75rem">${params.loanProgram}</td>
            </tr>
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600">Loan Term</td>
              <td style="padding:0.5rem 0.75rem">${params.loanTerm}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0.75rem;font-weight:600">Lock Period</td>
              <td style="padding:0.5rem 0.75rem">${params.lockPeriod}</td>
            </tr>
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600">Credit Score</td>
              <td style="padding:0.5rem 0.75rem">${params.creditScore}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0.75rem;font-weight:600">Property Value</td>
              <td style="padding:0.5rem 0.75rem">${params.propertyValue}</td>
            </tr>
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600">Loan Amount</td>
              <td style="padding:0.5rem 0.75rem">${params.loanAmount}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0.75rem;font-weight:600">LTV</td>
              <td style="padding:0.5rem 0.75rem">${ltv ? ltv + '%' : 'N/A'}</td>
            </tr>
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600">Down / Equity</td>
              <td style="padding:0.5rem 0.75rem">${downPmt ? '$' + downPmt.toLocaleString() : 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0.75rem;font-weight:600">State</td>
              <td style="padding:0.5rem 0.75rem">${params.state}</td>
            </tr>
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600">Occupancy</td>
              <td style="padding:0.5rem 0.75rem">${params.occupancy}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem 0.75rem;font-weight:600">Property Type</td>
              <td style="padding:0.5rem 0.75rem">${params.propertyType}</td>
            </tr>
            <tr style="background:#f8f5f0">
              <td style="padding:0.5rem 0.75rem;font-weight:600">Contact</td>
              <td style="padding:0.5rem 0.75rem">${contact || '—'}</td>
            </tr>
          </table>

          <p style="margin-top:1.25rem;font-size:0.75rem;color:#9ca3af">Submitted ${submittedAt} PT</p>
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
    },
  });
});

export default router;
