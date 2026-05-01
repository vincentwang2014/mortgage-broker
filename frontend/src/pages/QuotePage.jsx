import React, { useState } from 'react';
import { useLang } from '../App.jsx';

const PROGRAMS = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'DSCR', 'Non-QM / Bank Statement'];
const TERMS = ['30-Year Fixed', '20-Year Fixed', '15-Year Fixed', '10-Year Fixed', '7/1 ARM', '5/1 ARM'];
const CREDIT_RANGES = ['780+', '760-779', '740-759', '720-739', '700-719', '680-699', '660-679', '640-659', '620-639', 'Below 620'];
const OCCUPANCY = ['Primary Residence', 'Second Home', 'Investment Property'];
const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhome', '2-4 Unit', 'Manufactured'];

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
];

function formatCurrency(val) {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (!n) return '';
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function parseDollar(val) {
  return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
}

export default function QuotePage() {
  const { T } = useLang();
  const Q = T.quote;

  const [form, setForm] = useState({
    purpose: Q.purposeOptions[0],
    loanProgram: 'Conventional',
    loanTerm: '30-Year Fixed',
    lockPeriod: Q.lockOptions[1],
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
  const [copied, setCopied] = useState(false);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  const pv = parseDollar(form.propertyValue);
  const la = parseDollar(form.loanAmount);
  const ltv = pv && la ? Math.round((la / pv) * 100) : null;
  const downPmt = pv && la ? pv - la : null;
  const isPurchase = form.purpose === Q.purposeOptions[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: form, contact: form.contact }),
      });
      if (!res.ok) throw new Error(Q.error);
      const data = await res.json();
      setResult(data.summary);
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function handleCopy() {
    if (!result?.obSearchString) return;
    navigator.clipboard.writeText(result.obSearchString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="quote-page">
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.375rem' }}>{Q.title}</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{Q.subtitle}</p>

      <div className="privacy-notice">
        <p>{Q.privacy}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Section 1: Loan Parameters ── */}
        <div className="form-section">
          <div className="form-section-title">{Q.sec1}</div>

          {/* Loan Purpose */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">{Q.purpose}</label>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {Q.purposeOptions.map(opt => (
                <label
                  key={opt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.875rem', borderRadius: '100px', cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: form.purpose === opt ? 600 : 400,
                    border: `1.5px solid ${form.purpose === opt ? 'var(--navy)' : 'var(--border)'}`,
                    background: form.purpose === opt ? 'rgba(10,22,40,0.06)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio" name="purpose" value={opt}
                    checked={form.purpose === opt}
                    onChange={set('purpose')}
                    style={{ display: 'none' }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{Q.loanProgram}</label>
              <select className="form-select" value={form.loanProgram} onChange={set('loanProgram')}>
                {PROGRAMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{Q.loanTerm}</label>
              <select className="form-select" value={form.loanTerm} onChange={set('loanTerm')}>
                {TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{Q.creditScore}</label>
              <select className="form-select" value={form.creditScore} onChange={set('creditScore')}>
                {CREDIT_RANGES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{Q.lockPeriod}</label>
              <select className="form-select" value={form.lockPeriod} onChange={set('lockPeriod')}>
                {Q.lockOptions.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">{Q.state}</label>
            <select className="form-select" style={{ maxWidth: '160px' }} value={form.state} onChange={set('state')}>
              {ALL_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* ── Section 2: Property Details ── */}
        <div className="form-section">
          <div className="form-section-title">{Q.sec2}</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{isPurchase ? Q.propValuePurchase : Q.propValue}</label>
              <input
                className="form-input" placeholder="$750,000"
                value={form.propertyValue}
                onChange={e => setForm(p => ({ ...p, propertyValue: e.target.value }))}
                onBlur={e => setForm(p => ({ ...p, propertyValue: formatCurrency(e.target.value) || e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{Q.loanAmount}</label>
              <input
                className="form-input" placeholder="$600,000"
                value={form.loanAmount}
                onChange={e => setForm(p => ({ ...p, loanAmount: e.target.value }))}
                onBlur={e => setForm(p => ({ ...p, loanAmount: formatCurrency(e.target.value) || e.target.value }))}
              />
            </div>
          </div>

          {ltv !== null && (
            <div className="ltv-display">
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{Q.ltv}</div>
                <div className="ltv-number">{ltv}%</div>
              </div>
              {downPmt !== null && (
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                    {isPurchase ? Q.downPmt : Q.equity}
                  </div>
                  <div className="ltv-number" style={{ fontSize: '1.25rem' }}>
                    ${Math.abs(downPmt).toLocaleString()}
                  </div>
                </div>
              )}
              {ltv > 80 && form.loanProgram === 'Conventional' && (
                <div style={{ fontSize: '0.78rem', color: '#92400e', background: '#fef3c7', padding: '0.375rem 0.625rem', borderRadius: '6px' }}>
                  {Q.pmi}
                </div>
              )}
            </div>
          )}

          <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{Q.occupancy}</label>
              <select className="form-select" value={form.occupancy} onChange={set('occupancy')}>
                {OCCUPANCY.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{Q.propType}</label>
              <select className="form-select" value={form.propertyType} onChange={set('propertyType')}>
                {PROPERTY_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 3: Contact ── */}
        <div className="form-section">
          <div className="form-section-title">{Q.sec3}</div>
          <div className="form-group">
            <label className="form-label">{Q.contactLabel}</label>
            <input className="form-input" placeholder={Q.contactPlaceholder} value={form.contact} onChange={set('contact')} />
          </div>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || !form.propertyValue || !form.loanAmount}>
          {loading ? Q.submitting : Q.submit}
        </button>
      </form>

      {result && (
        <div className="result-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>{Q.obTitle}</h3>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.35rem 0.875rem', fontSize: '0.8rem', fontWeight: 600,
                background: copied ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                color: 'white', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {copied ? Q.obCopied : Q.obCopy}
            </button>
          </div>
          <div className="ob-string">{result.obSearchString}</div>
          <div className="result-grid">
            <div className="result-item"><label>{Q.purpose}</label><span>{result.purpose}</span></div>
            <div className="result-item"><label>{Q.loanProgram}</label><span>{result.loanProgram}</span></div>
            <div className="result-item"><label>{Q.loanTerm}</label><span>{result.loanTerm}</span></div>
            <div className="result-item"><label>{Q.lockPeriod}</label><span>{result.lockPeriod}</span></div>
            <div className="result-item"><label>{Q.creditScore}</label><span>{result.creditScore}</span></div>
            <div className="result-item"><label>{Q.ltv}</label><span>{result.ltv}</span></div>
            <div className="result-item"><label>{isPurchase ? Q.downPmt : Q.equity}</label><span>{result.downPayment}</span></div>
            <div className="result-item"><label>{Q.state}</label><span>{result.state}</span></div>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {Q.resultNote}
          </p>
        </div>
      )}
    </div>
  );
}
