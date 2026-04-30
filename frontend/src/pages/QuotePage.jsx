import React, { useState } from 'react';

const PROGRAMS = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'DSCR', 'Non-QM / Bank Statement'];
const TERMS = ['30-Year Fixed', '20-Year Fixed', '15-Year Fixed', '10-Year Fixed', '7/1 ARM', '5/1 ARM'];
const CREDIT_RANGES = ['760+', '740-759', '720-739', '700-719', '680-699', '660-679', '640-659', '620-639', 'Below 620'];
const STATES = ['CA', 'TX', 'FL', 'NY', 'AZ', 'NV', 'WA', 'OR', 'CO', 'Other'];
const OCCUPANCY = ['Primary Residence', 'Second Home', 'Investment Property'];
const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhome', '2-4 Unit', 'Manufactured'];

function formatCurrency(val) {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (!n) return '';
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function calcLTV(propVal, loanAmt) {
  const pv = parseFloat(String(propVal).replace(/[^0-9.]/g, ''));
  const la = parseFloat(String(loanAmt).replace(/[^0-9.]/g, ''));
  if (!pv || !la) return null;
  return Math.round((la / pv) * 100);
}

export default function QuotePage() {
  const [form, setForm] = useState({
    loanProgram: 'Conventional',
    loanTerm: '30-Year Fixed',
    creditScore: '740-759',
    propertyValue: '',
    loanAmount: '',
    state: 'CA',
    occupancy: 'Primary Residence',
    propertyType: 'Single Family',
    contact: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  const ltv = calcLTV(form.propertyValue, form.loanAmount);
  const downPmt = (() => {
    const pv = parseFloat(String(form.propertyValue).replace(/[^0-9.]/g, ''));
    const la = parseFloat(String(form.loanAmount).replace(/[^0-9.]/g, ''));
    if (!pv || !la) return null;
    return pv - la;
  })();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: form, contact: form.contact }),
      });
      if (!res.ok) throw new Error('Failed to submit quote request');
      const data = await res.json();
      setResult(data.summary);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="quote-page">
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.375rem' }}>
        Rate Quote Request
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        No SSN or full address required. We generate Optimal Blue search parameters and notify your broker.
      </p>

      <div className="privacy-notice">
        <p>
          <strong>Privacy first:</strong> This form collects no PII. We only need loan parameters to generate an Optimal Blue search string.
          Your information is sent directly to the broker and not stored.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Loan Parameters */}
        <div className="form-section">
          <div className="form-section-title">Loan Parameters</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Loan Program</label>
              <select className="form-select" value={form.loanProgram} onChange={set('loanProgram')}>
                {PROGRAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Loan Term</label>
              <select className="form-select" value={form.loanTerm} onChange={set('loanTerm')}>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Credit Score Range</label>
              <select className="form-select" value={form.creditScore} onChange={set('creditScore')}>
                {CREDIT_RANGES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <select className="form-select" value={form.state} onChange={set('state')}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Property */}
        <div className="form-section">
          <div className="form-section-title">Property Details</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Property Value</label>
              <input
                className="form-input"
                placeholder="$750,000"
                value={form.propertyValue}
                onChange={e => setForm(prev => ({ ...prev, propertyValue: e.target.value }))}
                onBlur={e => setForm(prev => ({ ...prev, propertyValue: formatCurrency(e.target.value) || e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Loan Amount</label>
              <input
                className="form-input"
                placeholder="$600,000"
                value={form.loanAmount}
                onChange={e => setForm(prev => ({ ...prev, loanAmount: e.target.value }))}
                onBlur={e => setForm(prev => ({ ...prev, loanAmount: formatCurrency(e.target.value) || e.target.value }))}
              />
            </div>
          </div>

          {(ltv !== null) && (
            <div className="ltv-display">
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>LTV</div>
                <div className="ltv-number">{ltv}%</div>
              </div>
              {downPmt !== null && (
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Down Payment</div>
                  <div className="ltv-number" style={{ fontSize: '1.25rem' }}>${downPmt.toLocaleString()}</div>
                </div>
              )}
              {ltv > 80 && form.loanProgram === 'Conventional' && (
                <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '0.375rem 0.625rem', borderRadius: '6px' }}>
                  PMI required above 80% LTV
                </div>
              )}
            </div>
          )}

          <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Occupancy</label>
              <select className="form-select" value={form.occupancy} onChange={set('occupancy')}>
                {OCCUPANCY.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select className="form-select" value={form.propertyType} onChange={set('propertyType')}>
                {PROPERTY_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Contact (optional) */}
        <div className="form-section">
          <div className="form-section-title">Contact (Optional)</div>
          <div className="form-group">
            <label className="form-label">Email or Phone — How should we follow up?</label>
            <input
              className="form-input"
              placeholder="email@example.com or (555) 555-5555"
              value={form.contact}
              onChange={set('contact')}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Generate Quote Parameters'}
        </button>
      </form>

      {result && (
        <div className="result-box">
          <h3>Optimal Blue Search String</h3>
          <div className="ob-string">{result.obSearchString}</div>
          <div className="result-grid">
            <div className="result-item">
              <label>Program</label>
              <span>{result.loanProgram}</span>
            </div>
            <div className="result-item">
              <label>Term</label>
              <span>{result.loanTerm}</span>
            </div>
            <div className="result-item">
              <label>Credit Score</label>
              <span>{result.creditScore}</span>
            </div>
            <div className="result-item">
              <label>LTV</label>
              <span>{result.ltv}</span>
            </div>
            <div className="result-item">
              <label>Down Payment</label>
              <span>{result.downPayment}</span>
            </div>
            <div className="result-item">
              <label>Property Value</label>
              <span>{result.propertyValue}</span>
            </div>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            Your broker has been notified. They will search Optimal Blue for live pricing and follow up with rate options.
            This is not a rate lock or commitment to lend.
          </p>
        </div>
      )}
    </div>
  );
}
