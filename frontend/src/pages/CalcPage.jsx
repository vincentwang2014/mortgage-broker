import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../App.jsx';

const TERM_YEARS = [30, 20, 15, 10];

function calcMonthly(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function buildSnapshots(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const pmt = calcMonthly(principal, annualRate, years);
  let balance = principal;
  let cumInterest = 0;
  const out = [];
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    balance = Math.max(0, balance - (pmt - interest));
    cumInterest += interest;
    const yr = m / 12;
    if (m % 12 === 0 && [1, 5, 10, 15, 20, 25, 30].includes(yr) && yr <= years) {
      out.push({ year: yr, balance, pctPaid: ((principal - balance) / principal) * 100 });
    }
  }
  return out;
}

function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

function Row({ label, value, bold, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--cream-dark)' }}>
      <span style={{ fontSize: '0.85rem', color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? '1rem' : '0.88rem', fontWeight: bold ? 700 : 500, color: gold ? 'var(--gold)' : bold ? 'var(--navy)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function CalcPage() {
  const { T } = useLang();
  const C = T.calc;

  const [purchasePrice, setPurchasePrice] = useState('750000');
  const [downPct, setDownPct] = useState('20');
  const [downAmt, setDownAmt] = useState('');
  const [downMode, setDownMode] = useState('pct');
  const [rate, setRate] = useState('6.75');
  const [termIdx, setTermIdx] = useState(0);

  const years = TERM_YEARS[termIdx];
  const price = parseFloat(purchasePrice.replace(/,/g, '')) || 0;
  const down = downMode === 'pct'
    ? price * (parseFloat(downPct) || 0) / 100
    : parseFloat(downAmt.replace(/,/g, '')) || 0;
  const loan = Math.max(0, price - down);
  const r = parseFloat(rate) || 0;
  const ltv = price ? (loan / price) * 100 : 0;
  const needsPMI = ltv > 80;

  const results = useMemo(() => {
    if (!loan || !r) return null;
    const pi = calcMonthly(loan, r, years);
    const tax = price * 0.0075 / 12;
    const ins = 100;
    const pmi = needsPMI ? loan * 0.007 / 12 : 0;
    const total = pi + tax + ins + pmi;
    const totalInterest = pi * years * 12 - loan;
    const totalCost = pi * years * 12 + down;
    const snapshots = buildSnapshots(loan, r, years);
    const pi15 = calcMonthly(loan, r, 15);
    const pi30 = calcMonthly(loan, r, 30);
    const int15 = pi15 * 180 - loan;
    const int30 = pi30 * 360 - loan;
    return { pi, tax, ins, pmi, total, totalInterest, totalCost, snapshots,
      compare: { pi15, pi30, int15, int30, intSaved: int30 - int15, monthlyDiff: pi15 - pi30 } };
  }, [loan, r, years, price, down, needsPMI]);

  return (
    <div className="page" style={{ padding: '2.5rem 0 3rem' }}>
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: '0.375rem' }}>{C.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>{C.subtitle}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Inputs ── */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="calc-inputs">
                {/* Purchase Price */}
                <div className="form-group">
                  <label className="form-label">{C.purchasePrice}</label>
                  <div className="input-prefix">
                    <span className="pfx">$</span>
                    <input className="form-input" value={purchasePrice}
                      onChange={e => setPurchasePrice(e.target.value)}
                      onBlur={e => { const n = parseFloat(e.target.value.replace(/,/g,'')); if(n) setPurchasePrice(fmt(n)); }}
                      placeholder="750,000" />
                  </div>
                </div>

                {/* Down Payment */}
                <div className="form-group">
                  <label className="form-label">{C.downPayment}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="input-prefix" style={{ flex: 1 }}>
                      <span className="pfx">$</span>
                      <input className="form-input"
                        style={{ borderColor: downMode === 'amt' ? 'var(--navy)' : undefined }}
                        value={downAmt || (downMode === 'pct' && price ? fmt(down) : '')}
                        onChange={e => { setDownMode('amt'); setDownAmt(e.target.value); }}
                        placeholder={price ? fmt(price * 0.2) : '150,000'} />
                    </div>
                    <div className="input-prefix has-sfx" style={{ width: '76px' }}>
                      <input className="form-input"
                        style={{ paddingLeft: '0.625rem', paddingRight: '1.75rem', textAlign: 'right', borderColor: downMode === 'pct' ? 'var(--navy)' : undefined }}
                        value={downPct}
                        onChange={e => { setDownMode('pct'); setDownPct(e.target.value); }}
                        placeholder="20" />
                      <span className="sfx">%</span>
                    </div>
                  </div>
                </div>

                {/* Rate */}
                <div className="form-group">
                  <label className="form-label">{C.interestRate}</label>
                  <div className="input-prefix has-sfx">
                    <input className="form-input" value={rate} onChange={e => setRate(e.target.value)} placeholder="6.75" />
                    <span className="sfx">%</span>
                  </div>
                </div>

                {/* Term */}
                <div className="form-group">
                  <label className="form-label">{C.loanTerm}</label>
                  <div className="term-btns">
                    {C.terms.map((label, i) => (
                      <button key={i} className={`term-btn${termIdx === i ? ' active' : ''}`} onClick={() => setTermIdx(i)}>{label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!results ? (
              <div className="state-box"><p>{C.noCalc}</p></div>
            ) : (
              <>
                {/* ── Monthly Total ── */}
                <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', color: 'white', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem' }}>{C.monthlyPayment}</p>
                  <div style={{ fontSize: 'clamp(2.2rem, 8vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontWeight: 600, lineHeight: 1 }}>
                    ${fmt(results.total)}<span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                  </div>
                  {needsPMI && <p style={{ fontSize: '0.78rem', color: '#fbbf24', marginTop: '0.5rem' }}>⚠ {C.pmiNote}</p>}
                </div>

                {/* ── Breakdown + Summary ── */}
                <div className="calc-pair">
                  <div className="card">
                    <div className="form-section-title" style={{ marginBottom: '0.75rem' }}>{C.breakdown}</div>
                    <Row label={C.principal}  value={`$${fmt(results.pi)}/mo`} />
                    <Row label={C.tax}        value={`$${fmt(results.tax)}/mo`} />
                    <Row label={C.insurance}  value={`$${fmt(results.ins)}/mo`} />
                    {needsPMI && <Row label={C.pmi} value={`$${fmt(results.pmi)}/mo`} />}
                    <Row label={C.total}      value={`$${fmt(results.total)}/mo`} bold gold />
                  </div>
                  <div className="card">
                    <div className="form-section-title" style={{ marginBottom: '0.75rem' }}>{C.loanSummary}</div>
                    <Row label={C.loanAmount}    value={`$${fmt(loan)}`} />
                    <Row label={C.ltv}           value={`${ltv.toFixed(1)}%`} />
                    <Row label={C.totalInterest} value={`$${fmt(results.totalInterest)}`} />
                    <Row label={C.totalCost}     value={`$${fmt(results.totalCost)}`} bold />
                  </div>
                </div>

                {/* ── 15yr vs 30yr ── */}
                <div className="card">
                  <div className="form-section-title" style={{ marginBottom: '1rem' }}>{C.compare}</div>
                  <div style={{ overflowX: 'auto' }}>
                    <div className="calc-compare" style={{ minWidth: '280px' }}>
                      <div />
                      <div className="calc-compare-cell" style={{ fontWeight: 700, color: 'var(--navy)', background: 'var(--cream)', borderRadius: '6px', textAlign: 'center' }}>{C.yr15}</div>
                      <div className="calc-compare-cell" style={{ fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--cream)', borderRadius: '6px', textAlign: 'center' }}>{C.yr30}</div>

                      <div className="calc-compare-cell" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{C.principal}</div>
                      <div className="calc-compare-cell" style={{ fontWeight: 700, color: 'var(--navy)', textAlign: 'center' }}>${fmt(results.compare.pi15)}/mo</div>
                      <div className="calc-compare-cell" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>${fmt(results.compare.pi30)}/mo</div>

                      <div className="calc-compare-cell" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{C.totalInterest}</div>
                      <div className="calc-compare-cell" style={{ fontWeight: 700, color: 'var(--navy)', textAlign: 'center' }}>${fmt(results.compare.int15)}</div>
                      <div className="calc-compare-cell" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>${fmt(results.compare.int30)}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.875rem', padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#166534' }}><strong>{C.interestSaving}:</strong> ${fmt(results.compare.intSaved)}</span>
                    <span style={{ fontSize: '0.82rem', color: '#166534' }}><strong>{C.monthlySaving}:</strong> ${fmt(results.compare.monthlyDiff)}/mo</span>
                  </div>
                </div>

                {/* ── Amortization ── */}
                <div className="card">
                  <div className="form-section-title" style={{ marginBottom: '1rem' }}>{C.amortTitle}</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="amort-table">
                      <thead>
                        <tr>
                          <th>{C.year}</th>
                          <th>{C.balance}</th>
                          <th>{C.paid}</th>
                          <th style={{ minWidth: '100px' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.snapshots.map(s => (
                          <tr key={s.year}>
                            <td style={{ fontWeight: 700, color: 'var(--navy)' }}>{s.year}</td>
                            <td>${fmt(s.balance)}</td>
                            <td>${fmt(loan - s.balance)}</td>
                            <td>
                              <div className="amort-bar">
                                <div className="amort-bar-track"><div className="amort-bar-fill" style={{ width: `${s.pctPaid}%` }} /></div>
                                <span style={{ minWidth: '34px', fontSize: '0.82rem' }}>{s.pctPaid.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── CTA ── */}
                <div style={{ textAlign: 'center' }}>
                  <Link to="/quote" className="btn btn-gold btn-lg">{C.cta} →</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
