import express from 'express';
import { Resend } from 'resend';

const router = express.Router();
function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }

function row(label, value) {
  if (!value && value !== 0) return '';
  return `<tr>
    <td style="padding:0.45rem 0.75rem;font-weight:600;width:38%;background:#f8f5f0;vertical-align:top">${label}</td>
    <td style="padding:0.45rem 0.75rem;vertical-align:top">${value}</td>
  </tr>`;
}

function section(title, rows) {
  const body = rows.filter(Boolean).join('');
  if (!body) return '';
  return `
    <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:1.25rem 0 0.5rem">${title}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:0.5rem">${body}</table>`;
}

router.post('/', async (req, res) => {
  const f = req.body;
  if (!f?.firstName || !f?.email) {
    return res.status(400).json({ error: 'First name and email required' });
  }

  const fullName = [f.firstName, f.lastName].filter(Boolean).join(' ');
  const isPurchase = !f.purpose?.toLowerCase().includes('refi');
  const submittedAt = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

  const tenure = [f.jobYears && `${f.jobYears} yr`, f.jobMonths && `${f.jobMonths} mo`].filter(Boolean).join(' ') || '';
  const usTime = [f.usYears && `${f.usYears} yr`, f.usMonths && `${f.usMonths} mo`].filter(Boolean).join(' ') || '';

  let propRows = '';
  if (Array.isArray(f.properties) && f.properties.length > 0) {
    propRows = f.properties.map((p, i) => `
      <tr><td colspan="2" style="padding:0.375rem 0.75rem;font-weight:700;font-size:0.8rem;background:#f0ece4">Property ${i + 1}</td></tr>
      ${row('Address', p.address)}
      ${row('Primary Residence', p.isPrimary)}
      ${row('Monthly Mortgage', p.mortgage)}
      ${row('Monthly Rental Income', p.rental)}
      ${row('Monthly Insurance', p.insurance)}
      ${row('Monthly Tax', p.tax)}
      ${row('Monthly HOA', p.hoa)}
    `).join('');
  }

  if (process.env.RESEND_API_KEY && process.env.BROKER_EMAIL) {
    try {
      await getResend().emails.send({
        from: `ClearPath Website <${process.env.FROM_EMAIL}>`,
        to: process.env.BROKER_EMAIL,
        subject: `Pre-Approval Request — ${fullName} · ${f.purpose} · ${f.timeline}`,
        html: `<html><body style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:1.5rem;color:#111">
          <h2 style="color:#0a1628;border-bottom:2px solid #c9a96e;padding-bottom:0.5rem;margin-bottom:1rem">
            Pre-Approval Request — ${fullName}
          </h2>

          ${section('Loan Purpose & Timeline', [
            row('Loan Purpose', f.purpose),
            row('Timeline', f.timeline),
          ])}

          ${section('Borrower', [
            row('Name', fullName),
            row('Phone', f.phone),
            row('Email', f.email),
            row('Preferred Contact', f.contactPref),
            row('Best Time', f.bestTime),
          ])}

          ${f.hasCoborr ? section('Co-Borrower', [
            row('Name', [f.cobFirstName, f.cobLastName].filter(Boolean).join(' ')),
            row('Phone', f.cobPhone),
            row('Email', f.cobEmail),
          ]) : ''}

          ${section(isPurchase ? 'Purchase Details' : 'Refinance Details', isPurchase ? [
            row('Estimated Purchase Price', f.purchasePrice),
            row('Property Type', f.propType),
            row('Down Payment', f.downPayment),
            row('Credit Score', f.creditScore),
          ] : [
            row('Current Loan Balance', f.currentBalance),
            row('Estimated Home Value', f.homeValue),
            row('Current Rate', f.currentRate),
            row('Primary Goal', f.refiGoal),
            row('Credit Score', f.creditScore),
          ])}

          ${section('Employment & Income', [
            row('Annual Salary', f.annualSalary),
            row('Annual Bonus', f.annualBonus),
            row('Job Tenure', tenure),
            row('Self-Employed', f.selfEmployed),
            row('Time in US', usTime),
            row('Residency Status', f.residency),
          ])}

          ${f.propCount && f.propCount !== '0' ? `
          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:1.25rem 0 0.5rem">Existing Properties</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:0.5rem">
            ${row('Properties Owned', f.propCount)}
            ${propRows}
          </table>` : ''}

          ${section('Monthly Debts', [
            f.carLoan ? row('Car Loan', f.carLoan === 'Yes' || f.carLoan === '是' ? `Yes — ${f.carLoanAmt}/mo` : 'No') : '',
            f.studentLoan ? row('Student Loan', f.studentLoan === 'Yes' || f.studentLoan === '是' ? `Yes — ${f.studentLoanAmt}/mo` : 'No') : '',
            row('Other Monthly Debts', f.otherDebts),
          ])}

          ${f.notes ? `
          <h3 style="color:#c9a96e;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;margin:1.25rem 0 0.5rem">Additional Notes</h3>
          <div style="background:#f8f5f0;padding:0.875rem;border-radius:6px;font-size:0.875rem;line-height:1.6">
            ${f.notes.replace(/\n/g, '<br>')}
          </div>` : ''}

          <p style="font-size:0.75rem;color:#9ca3af;margin-top:1.5rem">Submitted ${submittedAt} PT</p>
        </body></html>`,
      });
    } catch (e) {
      console.error('[PreQual] Email failed:', e.message);
    }
  }

  res.json({ ok: true });
});

export default router;
