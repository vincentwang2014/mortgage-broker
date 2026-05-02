import express from 'express';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import PDFDocument from 'pdfkit';

const router = express.Router();
const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_PATH || join(__dir, '../../data');
const PREQUAL_DIR = join(DATA_DIR, 'prequal');

function getResend() { return new Resend(process.env.RESEND_API_KEY || 'placeholder'); }

// ── HTML email helpers ────────────────────────────────────────────────────────
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

// ── Save submission to disk ───────────────────────────────────────────────────
function saveToDisk(f, submittedAt) {
  try {
    if (!existsSync(PREQUAL_DIR)) mkdirSync(PREQUAL_DIR, { recursive: true });
    const slug = (f.lastName || 'unknown').toLowerCase().replace(/\s+/g, '-');
    const ts = new Date(submittedAt).toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const file = join(PREQUAL_DIR, `${ts}-${slug}.json`);
    writeFileSync(file, JSON.stringify({ ...f, submittedAt }, null, 2), 'utf8');
  } catch (e) {
    console.warn('[PreQual] File save failed:', e.message);
  }
}

// ── PDF generation ────────────────────────────────────────────────────────────
function generatePDF(f, fullName, submittedAt) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const isPurchase = !f.purpose?.toLowerCase().includes('refi');
    const NAVY = '#0B1F3A';
    const GOLD = '#c9a96e';
    const GREY = '#4a5568';
    const LIGHT = '#f8f5f0';

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 72).fill(NAVY);
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
      .text('800 Home Loan', 50, 20);
    doc.fontSize(10).font('Helvetica')
      .text('Pre-Approval Information Request', 50, 44);
    doc.fillColor(GOLD).fontSize(9)
      .text(`Submitted: ${new Date(submittedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT`, 50, 58);

    doc.moveDown(3);

    function pdfSection(title, fields) {
      const validFields = fields.filter(([, v]) => v);
      if (!validFields.length) return;

      doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold')
        .text(title.toUpperCase(), { characterSpacing: 1 });
      doc.moveDown(0.3);

      const startX = 50;
      const colW = 180;
      const rowH = 18;

      validFields.forEach(([label, value]) => {
        const y = doc.y;
        // Label cell background
        doc.rect(startX, y, colW, rowH).fill(LIGHT);
        doc.fillColor(NAVY).fontSize(8.5).font('Helvetica-Bold')
          .text(label, startX + 6, y + 4, { width: colW - 10, lineBreak: false });
        // Value
        doc.fillColor(GREY).font('Helvetica')
          .text(String(value), startX + colW + 8, y + 4, { width: doc.page.width - startX - colW - 60, lineBreak: false });
        doc.moveDown(0.05);
        doc.y = y + rowH + 1;
      });

      doc.moveDown(0.8);
    }

    const tenure = [f.jobYears && `${f.jobYears} yr`, f.jobMonths && `${f.jobMonths} mo`].filter(Boolean).join(' ');
    const usTime = [f.usYears && `${f.usYears} yr`, f.usMonths && `${f.usMonths} mo`].filter(Boolean).join(' ');

    pdfSection('Loan Purpose & Timeline', [
      ['Loan Purpose', f.purpose],
      ['Timeline', f.timeline],
    ]);

    pdfSection('Borrower', [
      ['Full Name', fullName],
      ['Phone', f.phone],
      ['Email', f.email],
      ['Preferred Contact', f.contactPref],
      ['Best Time to Reach', f.bestTime],
    ]);

    if (f.hasCoborr) {
      pdfSection('Co-Borrower', [
        ['Full Name', [f.cobFirstName, f.cobLastName].filter(Boolean).join(' ')],
        ['Phone', f.cobPhone],
        ['Email', f.cobEmail],
      ]);
    }

    if (isPurchase) {
      pdfSection('Purchase Details', [
        ['Estimated Purchase Price', f.purchasePrice],
        ['Property Type', f.propType],
        ['Down Payment', f.downPayment],
        ['Credit Score', f.creditScore],
      ]);
    } else {
      pdfSection('Refinance Details', [
        ['Current Loan Balance', f.currentBalance],
        ['Estimated Home Value', f.homeValue],
        ['Current Rate', f.currentRate],
        ['Primary Goal', f.refiGoal],
        ['Credit Score', f.creditScore],
      ]);
    }

    pdfSection('Employment & Income', [
      ['Annual Salary', f.annualSalary],
      ['Annual Bonus', f.annualBonus],
      ['Job Tenure', tenure],
      ['Self-Employed', f.selfEmployed],
      ['Time in US', usTime],
      ['Residency Status', f.residency],
    ]);

    if (f.propCount && f.propCount !== '0') {
      const propFields = [['Properties Owned', f.propCount]];
      if (Array.isArray(f.properties)) {
        f.properties.forEach((p, i) => {
          if (p.address) propFields.push([`Property ${i + 1} Address`, p.address]);
          if (p.mortgage) propFields.push([`Property ${i + 1} Mortgage`, p.mortgage]);
          if (p.rental) propFields.push([`Property ${i + 1} Rental Income`, p.rental]);
        });
      }
      pdfSection('Existing Properties', propFields);
    }

    const debtFields = [];
    if (f.carLoan) debtFields.push(['Car Loan', f.carLoan === 'Yes' || f.carLoan === '是' ? `Yes — ${f.carLoanAmt}/mo` : 'No']);
    if (f.studentLoan) debtFields.push(['Student Loan', f.studentLoan === 'Yes' || f.studentLoan === '是' ? `Yes — ${f.studentLoanAmt}/mo` : 'No']);
    if (f.otherDebts) debtFields.push(['Other Monthly Debts', f.otherDebts]);
    if (debtFields.length) pdfSection('Monthly Debts', debtFields);

    if (f.notes) pdfSection('Additional Notes', [['Notes', f.notes]]);

    // ── Footer ──
    doc.fontSize(7.5).fillColor('#9ca3af').font('Helvetica')
      .text('800 Home Loan — Licensed California Mortgage Broker — Not a commitment to lend. Equal Housing Lender.',
        50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const f = req.body;
  if (!f?.firstName || !f?.email) {
    return res.status(400).json({ error: 'First name and email required' });
  }

  const fullName = [f.firstName, f.lastName].filter(Boolean).join(' ');
  const isPurchase = !f.purpose?.toLowerCase().includes('refi');
  const submittedAt = new Date().toISOString();
  const submittedAtPT = new Date(submittedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

  const tenure = [f.jobYears && `${f.jobYears} yr`, f.jobMonths && `${f.jobMonths} mo`].filter(Boolean).join(' ') || '';
  const usTime = [f.usYears && `${f.usYears} yr`, f.usMonths && `${f.usMonths} mo`].filter(Boolean).join(' ') || '';

  // Always save to disk first so no lead is lost
  saveToDisk(f, submittedAt);

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

  const fromEmail = process.env.NOTIFY_EMAIL || process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const brokerEmail = process.env.BROKER_EMAIL;

  console.log(`[PreQual] Submission from ${fullName} <${f.email}> — RESEND_API_KEY: ${!!process.env.RESEND_API_KEY}, BROKER_EMAIL: ${brokerEmail || '(not set)'}, FROM_EMAIL: ${fromEmail}`);

  if (process.env.RESEND_API_KEY && brokerEmail) {
    try {
      const pdfBuffer = await generatePDF(f, fullName, submittedAt);
      const pdfFilename = `prequal-${fullName.replace(/\s+/g, '-')}-${new Date(submittedAt).toISOString().slice(0, 10)}.pdf`;

      const result = await getResend().emails.send({
        from: `800 Home Loan <${fromEmail}>`,
        to: brokerEmail,
        subject: `Pre-Approval Request — ${fullName} · ${f.purpose} · ${f.timeline}`,
        attachments: [{
          filename: pdfFilename,
          content: pdfBuffer,
        }],
        html: `<html><body style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:1.5rem;color:#111">
          <h2 style="color:#0a1628;border-bottom:2px solid #c9a96e;padding-bottom:0.5rem;margin-bottom:1rem">
            Pre-Approval Request — ${fullName}
          </h2>
          <p style="font-size:0.82rem;color:#6b7a90;margin-bottom:1.25rem">
            PDF copy attached — save or forward as needed.
          </p>

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

          <p style="font-size:0.75rem;color:#9ca3af;margin-top:1.5rem">Submitted ${submittedAtPT} PT</p>
        </body></html>`,
      });

      if (result?.error) {
        console.error('[PreQual] Resend rejected email:', JSON.stringify(result.error));
      } else {
        console.log(`[PreQual] Email sent OK → ${brokerEmail} (id: ${result?.data?.id})`);
      }
    } catch (e) {
      console.error('[PreQual] Email exception:', e.message, e?.response?.data || '');
    }
  } else {
    console.warn(`[PreQual] Email skipped — RESEND_API_KEY: ${!!process.env.RESEND_API_KEY}, BROKER_EMAIL: ${brokerEmail || '(not set)'}`);
  }

  res.json({ ok: true });
});

export default router;
