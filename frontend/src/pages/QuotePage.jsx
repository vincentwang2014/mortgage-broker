import React, { useState } from 'react';
import { useLang } from '../App.jsx';

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

export default function QuotePage() {
  const { T } = useLang();
  const Q = T.quote;
  const [form, setForm] = useState({
    loanProgram: 'Conventional', loanTerm: '30-Year Fixed', creditScore: '740-759',
    propertyValue: '', loanAmount: '', state: 'CA',
    occupancy: 'Primary Residence', propertyType: 'Single Family', contact: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(field) { return e => setForm(prev => ({ ...prev, [field]: e.target.value })); }

  const pv = parseFloat(String(form.propertyValue).replace(/[^0-9.]/g, ''));
  const la = parseFloat(String(form.loanAmount).replace(/[^0-9.]/g, ''));
  const ltv = pv && la ? Math.round((la / pv) * 100) : null;
  const downPmt = pv && la ? pv - la : null;

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
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="quote-page">
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.375rem' }}>{Q.title}</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{Q.subtitle}</p>

      <div className="privacy-notice">
        <p>{Q.privacy}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-title">{Q.sec1}</div>
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
              <label className="form-label">{Q.state}</label>
              <select className="form-select" value={form.state} onChange={set('state')}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">{Q.sec2}</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{Q.propValue}</label>
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
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{Q.downPmt}</div>
                  <div className="ltv-number" style={{ fontSize: '1.25rem' }}>${downPmt.toLocaleString()}</div>
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

        <div className="form-section">
          <div className="form-section-title">{Q.sec3}</div>
          <div className="form-group">
            <label className="form-label">{Q.contactLabel}</label>
            <input className="form-input" placeholder={Q.contactPlaceholder} value={form.contact} onChange={set('contact')} />
          </div>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? Q.submitting : Q.submit}
        </button>
      </form>

      {result && (
        <div className="result-box">
          <h3>{Q.obTitle}</h3>
          <div className="ob-string">{result.obSearchString}</div>
          <div className="result-grid">
            <div className="result-item"><label>{Q.loanProgram}</label><span>{result.loanProgram}</span></div>
            <div className="result-item"><label>{Q.loanTerm}</label><span>{result.loanTerm}</span></div>
            <div className="result-item"><label>{Q.creditScore}</label><span>{result.creditScore}</span></div>
            <div className="result-item"><label>{Q.ltv}</label><span>{result.ltv}</span></div>
            <div className="result-item"><label>{Q.downPmt}</label><span>{result.downPayment}</span></div>
            <div className="result-item"><label>{Q.propValue}</label><span>{result.propertyValue}</span></div>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            {Q.resultNote}
          </p>
        </div>
      )}
    </div>
  );
}
