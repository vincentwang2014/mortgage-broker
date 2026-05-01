import express from 'express';
import { Resend } from 'resend';

const router = express.Router();
function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }

function row(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:0.45rem 0.75rem;font-weight:600;width:38%;background:#f8f5f0;vertical-align:top">${label}</td>
    <td style="padding:0.45rem 0.75rem;vertical-align:top">${value}</td>
  </tr>`;
}

router.post('/', async (req, res) => {
  const f = req.body;
  if (!f?.name || !f?.email) {
    return res.status(400).json({ error: 'Name and email required' });
  }

  const isPurchase = !f.purpose?.toLowerCase().includes('refi');
  const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

  if (process.env.RESEND_API_KEY && process.env.BROKER_EMAIL) {
    try {
      await getResend().emails.send({
        from: `ClearPath Website <${process.env.FROM_EMAIL}>`,
        to: process.env.BROKER_EMAIL,
        subject: `Pre-Qual Intake — ${f.name} · ${f.purpose} · ${f.timeline}`,
        html: `<html><body style="font-family:sans-serif;max-width:620px;margin:0 auto;padding:1.5rem;color:#111">
          <h2 style="color:#0a1628;border-bottom:2px solid #c9a96e;padding-bottom:0.5rem;margin-bottom:1.25rem">
            Pre-Qualification Intake — ${f.name}
          </h2>

          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem">Contact</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:1.25rem">
            ${row('Name', f.name)}
            ${row('Email', f.email)}
            ${row('Phone', f.phone)}
            ${row('Preferred Contact', f.contactPref)}
            ${row('Best Time', f.bestTime)}
          </table>

          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem">Purpose & Timeline</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:1.25rem">
            ${row('Loan Purpose', f.purpose)}
            ${row('Timeline', f.timeline)}
          </table>

          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem">Financial Profile</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:1.25rem">
            ${row('Income Type', f.incomeType)}
            ${row('Annual Gross Income', f.annualIncome)}
            ${row('Monthly Debts', f.monthlyDebts)}
            ${row('Credit Score Range', f.creditRange)}
          </table>

          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem">
            ${isPurchase ? 'Purchase Details' : 'Refinance Details'}
          </h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:1.25rem">
            ${isPurchase ? `
              ${row('Target Price Range', f.purchasePrice)}
              ${row('Down Payment', f.downPayment)}
              ${row('State', f.state)}
              ${row('Loan Preference', f.loanPref)}
            ` : `
              ${row('Current Loan Balance', f.currentBalance)}
              ${row('Estimated Home Value', f.homeValue)}
              ${row('Current Rate', f.currentRate)}
              ${row('Years Owned', f.yearsOwned)}
              ${row('Primary Goal', f.refiGoal)}
            `}
          </table>

          ${f.notes ? `
          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.5rem">Notes</h3>
          <div style="background:#f8f5f0;padding:0.875rem;border-radius:6px;font-size:0.875rem;line-height:1.6;margin-bottom:1.25rem">
            ${f.notes.replace(/\n/g, '<br>')}
          </div>` : ''}

          <p style="font-size:0.75rem;color:#9ca3af;margin-top:1rem">Submitted ${submittedAt} PT</p>
        </body></html>`,
      });
    } catch (e) {
      console.error('[PreQual] Email failed:', e.message);
    }
  }

  res.json({ ok: true });
});

export default router;
