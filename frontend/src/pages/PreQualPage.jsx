import React, { useState } from 'react';
import { useLang } from '../App.jsx';

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
];

export default function PreQualPage() {
  const { T } = useLang();
  const P = T.prequal;

  const [form, setForm] = useState({
    name: '', email: '', phone: '', contactPref: P.contactOpts[0], bestTime: '',
    purpose: P.purposeOpts[0], timeline: P.timelineOpts[2],
    incomeType: P.incomeOpts[0], annualIncome: '', monthlyDebts: '', creditRange: P.creditOpts[0],
    // purchase
    purchasePrice: '', downPayment: '', state: 'CA', loanPref: P.loanPrefOpts[0],
    // refi
    currentBalance: '', homeValue: '', currentRate: '', refiGoal: P.refiGoalOpts[0], yearsOwned: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isPurchase = form.purpose === P.purposeOpts[0];

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/prequal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(P.error);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: '560px', margin: '5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
          {P.successTitle}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {P.successBody}
        </p>
      </div>
    );
  }

  return (
    <div className="quote-page">
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.375rem' }}>
        {P.title}
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{P.subtitle}</p>

      <div className="privacy-notice" style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '1rem' }}>
        <p>{P.disclaimer}</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Section 1: Contact ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec1}</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{P.name} *</label>
              <input className="form-input" value={form.name} onChange={set('name')} placeholder={P.namePH} required />
            </div>
            <div className="form-group">
              <label className="form-label">{P.email} *</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder={P.emailPH} required />
            </div>
          </div>
          <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{P.phone}</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} placeholder={P.phonePH} />
            </div>
            <div className="form-group">
              <label className="form-label">{P.contactPref}</label>
              <select className="form-select" value={form.contactPref} onChange={set('contactPref')}>
                {P.contactOpts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">{P.bestTime}</label>
            <input className="form-input" value={form.bestTime} onChange={set('bestTime')} placeholder={P.bestTimePH} />
          </div>
        </div>

        {/* ── Section 2: Purpose & Timeline ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec2}</div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">{P.purpose}</label>
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
              {P.purposeOpts.map(opt => (
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
                  <input type="radio" name="purpose" value={opt} checked={form.purpose === opt}
                    onChange={set('purpose')} style={{ display: 'none' }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{P.timeline}</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {P.timelineOpts.map(opt => (
                <label
                  key={opt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 0.75rem', borderRadius: '100px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: form.timeline === opt ? 600 : 400,
                    border: `1.5px solid ${form.timeline === opt ? 'var(--navy)' : 'var(--border)'}`,
                    background: form.timeline === opt ? 'rgba(10,22,40,0.06)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="timeline" value={opt} checked={form.timeline === opt}
                    onChange={set('timeline')} style={{ display: 'none' }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 3: Financial Profile ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec3}</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{P.incomeType}</label>
              <select className="form-select" value={form.incomeType} onChange={set('incomeType')}>
                {P.incomeOpts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{P.annualIncome}</label>
              <input className="form-input" value={form.annualIncome} onChange={set('annualIncome')} placeholder={P.annualIncomePH} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">{P.monthlyDebts}</label>
            <input className="form-input" value={form.monthlyDebts} onChange={set('monthlyDebts')} placeholder={P.monthlyDebtsPH} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{P.monthlyDebtsHint}</p>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">{P.creditRange}</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {P.creditOpts.map(opt => (
                <label
                  key={opt}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 0.75rem', borderRadius: '100px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: form.creditRange === opt ? 600 : 400,
                    border: `1.5px solid ${form.creditRange === opt ? 'var(--navy)' : 'var(--border)'}`,
                    background: form.creditRange === opt ? 'rgba(10,22,40,0.06)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="creditRange" value={opt} checked={form.creditRange === opt}
                    onChange={set('creditRange')} style={{ display: 'none' }} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 4: Property Details ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec4}</div>

          {isPurchase ? (
            <>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">{P.purchasePrice}</label>
                  <input className="form-input" value={form.purchasePrice} onChange={set('purchasePrice')} placeholder={P.purchasePricePH} />
                </div>
                <div className="form-group">
                  <label className="form-label">{P.downPayment}</label>
                  <input className="form-input" value={form.downPayment} onChange={set('downPayment')} placeholder={P.downPaymentPH} />
                </div>
              </div>
              <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{P.state}</label>
                  <select className="form-select" value={form.state} onChange={set('state')}>
                    {ALL_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{P.loanPref}</label>
                  <select className="form-select" value={form.loanPref} onChange={set('loanPref')}>
                    {P.loanPrefOpts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">{P.currentBalance}</label>
                  <input className="form-input" value={form.currentBalance} onChange={set('currentBalance')} placeholder={P.currentBalancePH} />
                </div>
                <div className="form-group">
                  <label className="form-label">{P.homeValue}</label>
                  <input className="form-input" value={form.homeValue} onChange={set('homeValue')} placeholder={P.homeValuePH} />
                </div>
              </div>
              <div className="form-row form-row-2" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{P.currentRate}</label>
                  <input className="form-input" value={form.currentRate} onChange={set('currentRate')} placeholder={P.currentRatePH} />
                </div>
                <div className="form-group">
                  <label className="form-label">{P.yearsOwned}</label>
                  <input className="form-input" value={form.yearsOwned} onChange={set('yearsOwned')} placeholder={P.yearsOwnedPH} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">{P.refiGoal}</label>
                <select className="form-select" value={form.refiGoal} onChange={set('refiGoal')}>
                  {P.refiGoalOpts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* ── Section 5: Notes ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec5}</div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={set('notes')}
              placeholder={P.notesPH}
              style={{ minHeight: '120px', resize: 'vertical' }}
            />
          </div>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        <button
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading || !form.name.trim() || !form.email.trim()}
        >
          {loading ? P.submitting : P.submit}
        </button>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem', lineHeight: 1.5 }}>
          {P.disclaimer}
        </p>
      </form>
    </div>
  );
}
