import React, { useState } from 'react';
import { useLang } from '../App.jsx';

function emptyProp() {
  return { address: '', isPrimary: '', mortgage: '', rental: '', insurance: '', tax: '', hoa: '' };
}

function YesNo({ value, onChange, labels }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {[labels.yes, labels.no].map(opt => (
        <label key={opt} style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.35rem 0.75rem', borderRadius: '100px', cursor: 'pointer',
          fontSize: '0.85rem', fontWeight: value === opt ? 600 : 400,
          border: `1.5px solid ${value === opt ? 'var(--navy)' : 'var(--border)'}`,
          background: value === opt ? 'rgba(10,22,40,0.06)' : 'transparent',
          transition: 'all 0.15s',
        }}>
          <input type="radio" value={opt} checked={value === opt} onChange={() => onChange(opt)}
            style={{ display: 'none' }} />
          {opt}
        </label>
      ))}
    </div>
  );
}

function PillGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {options.map(opt => (
        <label key={opt} style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.4rem 0.85rem', borderRadius: '100px', cursor: 'pointer',
          fontSize: '0.82rem', fontWeight: value === opt ? 600 : 400,
          border: `1.5px solid ${value === opt ? 'var(--navy)' : 'var(--border)'}`,
          background: value === opt ? 'rgba(10,22,40,0.06)' : 'transparent',
          transition: 'all 0.15s',
        }}>
          <input type="radio" value={opt} checked={value === opt} onChange={() => onChange(opt)}
            style={{ display: 'none' }} />
          {opt}
        </label>
      ))}
    </div>
  );
}

export default function PreQualPage() {
  const { T } = useLang();
  const P = T.prequal;

  const isPurchaseOpt = opt => opt === P.purposeOpts[0];

  const [form, setForm] = useState({
    // Purpose
    purpose: P.purposeOpts[0],
    timeline: P.timelineOpts[2],
    // Borrower
    firstName: '', lastName: '', phone: '', email: '',
    contactPref: P.contactOpts[0], bestTime: '',
    // Co-Borrower
    hasCoborr: false,
    cobFirstName: '', cobLastName: '', cobPhone: '', cobEmail: '',
    // Purchase
    purchasePrice: '', propType: P.propTypeOpts[0], downPayment: '',
    creditScore: '',
    // Refi
    currentBalance: '', homeValue: '', currentRate: '', refiGoal: P.refiGoalOpts[0],
    // Employment
    annualSalary: '', annualBonus: '',
    jobYears: '', jobMonths: '',
    selfEmployed: '',
    usYears: '', usMonths: '',
    residency: P.residencyOpts[0],
    // Properties
    propCount: '0',
    properties: [],
    // Debts
    carLoan: '', carLoanAmt: '',
    studentLoan: '', studentLoanAmt: '',
    otherDebts: '',
    // Notes
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isPurchase = isPurchaseOpt(form.purpose);

  function set(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }
  function setVal(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  function addProp() {
    setForm(prev => ({ ...prev, properties: [...prev.properties, emptyProp()] }));
  }
  function removeProp(i) {
    setForm(prev => ({ ...prev, properties: prev.properties.filter((_, idx) => idx !== i) }));
  }
  function setProp(i, field, val) {
    setForm(prev => {
      const props = [...prev.properties];
      props[i] = { ...props[i], [field]: val };
      return { ...prev, properties: props };
    });
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
      <div className="page">
        <div className="page-header">
          <div className="container">
            <h1>{P.title}</h1>
          </div>
        </div>
        <div style={{ maxWidth: '520px', margin: '4.5rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem', color: 'white', boxShadow: '0 8px 24px rgba(29,78,216,0.3)',
          }}>✓</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            {P.successTitle}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
            {P.successBody}
          </p>
          <a href="/" className="btn btn-gold btn-lg">Back to Home</a>
        </div>
      </div>
    );
  }

  const inputSm = { padding: '0.45rem 0.625rem', fontSize: '0.82rem' };

  return (
    <div className="page">
      <div className="page-header">
        <div className="container">
          <h1>{P.title}</h1>
          <p>{P.subtitle}</p>
        </div>
      </div>
    <div className="quote-page">
      <div className="privacy-notice" style={{ marginTop: 0 }}>
        <p>{P.disclaimer}</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── 1. Purpose & Timeline ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec1}</div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">{P.purpose}</label>
            <PillGroup options={P.purposeOpts} value={form.purpose} onChange={v => setVal('purpose', v)} />
          </div>
          <div className="form-group">
            <label className="form-label">{P.timeline}</label>
            <PillGroup options={P.timelineOpts} value={form.timeline} onChange={v => setVal('timeline', v)} />
          </div>
        </div>

        {/* ── 2. Borrower / Co-Borrower ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec2}</div>

          {/* Borrower */}
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{P.borrower}</p>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{P.firstName} *</label>
              <input className="form-input" value={form.firstName} onChange={set('firstName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">{P.lastName} *</label>
              <input className="form-input" value={form.lastName} onChange={set('lastName')} required />
            </div>
          </div>
          <div className="form-row form-row-2" style={{ marginTop: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{P.phone}</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} placeholder={P.phonePH} />
            </div>
            <div className="form-group">
              <label className="form-label">{P.email} *</label>
              <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder={P.emailPH} required />
            </div>
          </div>
          <div className="form-row form-row-2" style={{ marginTop: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{P.contactPref}</label>
              <select className="form-select" value={form.contactPref} onChange={set('contactPref')}>
                {P.contactOpts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{P.bestTime}</label>
              <input className="form-input" value={form.bestTime} onChange={set('bestTime')} placeholder={P.bestTimePH} />
            </div>
          </div>

          {/* Co-Borrower toggle */}
          <div style={{ marginTop: '1.25rem' }}>
            {!form.hasCoborr ? (
              <button type="button" className="btn btn-outline btn-sm"
                onClick={() => setVal('hasCoborr', true)}>
                {P.addCoborrower}
              </button>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{P.coborrower}</p>
                  <button type="button" className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', color: '#dc2626', borderColor: '#dc2626' }}
                    onClick={() => setVal('hasCoborr', false)}>
                    {P.removeCoborrower}
                  </button>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="form-label">{P.firstName}</label>
                    <input className="form-input" value={form.cobFirstName} onChange={set('cobFirstName')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{P.lastName}</label>
                    <input className="form-input" value={form.cobLastName} onChange={set('cobLastName')} />
                  </div>
                </div>
                <div className="form-row form-row-2" style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{P.phone}</label>
                    <input className="form-input" value={form.cobPhone} onChange={set('cobPhone')} placeholder={P.phonePH} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{P.email}</label>
                    <input className="form-input" type="email" value={form.cobEmail} onChange={set('cobEmail')} placeholder={P.emailPH} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Purchase / Refi Details ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec3}</div>
          {isPurchase ? (
            <>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">{P.purchasePrice}</label>
                  <input className="form-input" value={form.purchasePrice} onChange={set('purchasePrice')} placeholder={P.purchasePricePH} />
                </div>
                <div className="form-group">
                  <label className="form-label">{P.propType}</label>
                  <select className="form-select" value={form.propType} onChange={set('propType')}>
                    {P.propTypeOpts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row form-row-2" style={{ marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{P.downPayment}</label>
                  <input className="form-input" value={form.downPayment} onChange={set('downPayment')} placeholder={P.downPaymentPH} />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{P.downPaymentHint}</p>
                </div>
                <div className="form-group">
                  <label className="form-label">{P.creditScore}</label>
                  <input className="form-input" value={form.creditScore} onChange={set('creditScore')} placeholder={P.creditScorePH} />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{P.creditUnknown}</p>
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
              <div className="form-row form-row-2" style={{ marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">{P.currentRate}</label>
                  <input className="form-input" value={form.currentRate} onChange={set('currentRate')} placeholder={P.currentRatePH} />
                </div>
                <div className="form-group">
                  <label className="form-label">{P.creditScore}</label>
                  <input className="form-input" value={form.creditScore} onChange={set('creditScore')} placeholder={P.creditScorePH} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">{P.refiGoal}</label>
                <select className="form-select" value={form.refiGoal} onChange={set('refiGoal')}>
                  {P.refiGoalOpts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* ── 4. Employment & Income ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec4}</div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">{P.annualSalary}</label>
              <input className="form-input" value={form.annualSalary} onChange={set('annualSalary')} placeholder={P.annualSalaryPH} />
            </div>
            <div className="form-group">
              <label className="form-label">{P.annualBonus}</label>
              <input className="form-input" value={form.annualBonus} onChange={set('annualBonus')} placeholder={P.annualBonusPH} />
            </div>
          </div>

          {/* Job tenure */}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">{P.jobTenure}</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input className="form-input" style={{ width: '80px' }} value={form.jobYears} onChange={set('jobYears')} placeholder={P.jobYearsPH} />
              <input className="form-input" style={{ width: '80px' }} value={form.jobMonths} onChange={set('jobMonths')} placeholder={P.jobMonthsPH} />
            </div>
          </div>

          {/* Self-employed */}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label" style={{ marginBottom: '0.375rem', display: 'block' }}>{P.selfEmployed}</label>
            <YesNo value={form.selfEmployed} onChange={v => setVal('selfEmployed', v)} labels={P} />
            {form.selfEmployed === P.yes && (
              <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.375rem' }}>{P.selfEmployedHint}</p>
            )}
          </div>

          {/* Time in US + Residency */}
          <div className="form-row form-row-2" style={{ marginTop: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">{P.usTime}</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input className="form-input" style={{ width: '80px' }} value={form.usYears} onChange={set('usYears')} placeholder={P.jobYearsPH} />
                <input className="form-input" style={{ width: '80px' }} value={form.usMonths} onChange={set('usMonths')} placeholder={P.jobMonthsPH} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{P.residency}</label>
              <select className="form-select" value={form.residency} onChange={set('residency')}>
                {P.residencyOpts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── 5. Existing Properties ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec5}</div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">{P.propCount}</label>
            <input className="form-input" style={{ width: '80px' }} value={form.propCount}
              onChange={set('propCount')} placeholder={P.propCountPH} />
          </div>

          {form.properties.length > 0 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{P.propTableHint}</p>
          )}

          {form.properties.map((prop, i) => (
            <div key={i} className="card" style={{ padding: '1rem', marginBottom: '0.75rem', background: 'var(--cream)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)' }}>Property {i + 1}</span>
                <button type="button" className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.72rem', color: '#dc2626', borderColor: '#dc2626' }}
                  onClick={() => removeProp(i)}>{P.removeProp}</button>
              </div>

              <div className="form-group" style={{ marginBottom: '0.625rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>{P.propAddress}</label>
                <input className="form-input" style={inputSm} value={prop.address}
                  onChange={e => setProp(i, 'address', e.target.value)}
                  placeholder="123 Main St, City, State" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {[
                  { field: 'isPrimary', label: P.propPrimary, ph: 'Y / N' },
                  { field: 'mortgage',  label: P.propMortgage,  ph: '$2,500' },
                  { field: 'rental',    label: P.propRental,    ph: '$0' },
                  { field: 'insurance', label: P.propInsurance, ph: '$150' },
                  { field: 'tax',       label: P.propTax,       ph: '$400' },
                  { field: 'hoa',       label: P.propHOA,       ph: '$0' },
                ].map(({ field, label, ph }) => (
                  <div className="form-group" key={field}>
                    <label className="form-label" style={{ fontSize: '0.72rem' }}>{label}</label>
                    <input className="form-input" style={inputSm} value={prop[field]}
                      onChange={e => setProp(i, field, e.target.value)} placeholder={ph} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-outline btn-sm" onClick={addProp}>
            {P.addProp}
          </button>
          {form.properties.some(p => p.rental) && (
            <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.5rem' }}>{P.propRentalHint}</p>
          )}
        </div>

        {/* ── 6. Monthly Debts ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec6}</div>

          {/* Car loan */}
          <div className="form-group" style={{ marginBottom: '0.875rem' }}>
            <label className="form-label" style={{ marginBottom: '0.375rem', display: 'block' }}>{P.carLoan}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <YesNo value={form.carLoan} onChange={v => setVal('carLoan', v)} labels={P} />
              {form.carLoan === P.yes && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{P.carLoanAmt}:</span>
                  <input className="form-input" style={{ width: '110px', ...inputSm }}
                    value={form.carLoanAmt} onChange={set('carLoanAmt')} placeholder={P.carLoanPH} />
                </div>
              )}
            </div>
          </div>

          {/* Student loan */}
          <div className="form-group" style={{ marginBottom: '0.875rem' }}>
            <label className="form-label" style={{ marginBottom: '0.375rem', display: 'block' }}>{P.studentLoan}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <YesNo value={form.studentLoan} onChange={v => setVal('studentLoan', v)} labels={P} />
              {form.studentLoan === P.yes && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{P.studentLoanAmt}:</span>
                  <input className="form-input" style={{ width: '110px', ...inputSm }}
                    value={form.studentLoanAmt} onChange={set('studentLoanAmt')} placeholder={P.studentLoanPH} />
                </div>
              )}
            </div>
          </div>

          {/* Other debts */}
          <div className="form-group">
            <label className="form-label">{P.otherDebts}</label>
            <input className="form-input" value={form.otherDebts} onChange={set('otherDebts')} placeholder={P.otherDebtsPH} />
          </div>
        </div>

        {/* ── Documents reminder ── */}
        <div className="form-section" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
          <div className="form-section-title" style={{ color: 'var(--gold)' }}>{P.docsTitle}</div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {P.docs.map((d, i) => (
              <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{d}</li>
            ))}
          </ul>
        </div>

        {/* ── 7. Notes ── */}
        <div className="form-section">
          <div className="form-section-title">{P.sec7}</div>
          <div className="form-group">
            <textarea className="form-textarea" value={form.notes} onChange={set('notes')}
              placeholder={P.notesPH} style={{ minHeight: '100px', resize: 'vertical' }} />
          </div>
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        <button className="btn btn-gold btn-lg" style={{ width: '100%' }}
          disabled={loading || !form.firstName.trim() || !form.email.trim()}>
          {loading ? P.submitting : P.submit}
        </button>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
          {P.disclaimer}
        </p>
      </form>
    </div>
    </div>
  );
}
