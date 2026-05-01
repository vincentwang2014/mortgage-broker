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

function buildAmortSnapshots(principal, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const pmt = calcMonthly(principal, annualRate, years);
  let balance = principal;
  let totalInterest = 0;
  const snapshots = [];

  for (let month = 1; month <= n; month++) {
    const interest = balance * r;
    const prinPaid = pmt - interest;
    balance = Math.max(0, balance - prinPaid);
    totalInterest += interest;

    const yr = Math.round(month / 12);
    if (month % 12 === 0 && [1, 5, 10, 15, 20, 25, 30].includes(yr) && yr <= years) {
      snapshots.push({ year: yr, balance, totalInterest, pctPaid: ((principal - balance) / principal) * 100 });
    }
  }
  return snapshots;
}

function fmt(n) { return n.toLocaleString('en-US', { maximumFractionDigits: 0 }); }
function fmtRate(n) { return n.toFixed(2) + '%'; }

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
  const [downMode, setDownMode] = useState('pct'); // 'pct' | 'amt'
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
    const totalPayments = pi * years * 12;
    const totalInterest = totalPayments - loan;
    const snapshots = buildAmortSnapshots(loan, r, years);

    // 15yr vs 30yr comparison
    let compare = null;
    if (years !== 15 && years !== 30) {
      const pi15 = calcMonthly(loan, r, 15);
      const pi30 = calcMonthly(loan, r, 30);
      const int15 = pi15 * 180 - loan;
      const int30 = pi30 * 360 - loan;
      compare = { pi15, pi30, int15, int30, intSaved: int30 - int15, monthlyDiff: pi15 - pi30 };
    } else if (years === 30) {
      const pi15 = calcMonthly(loan, r, 15);
      const int15 = pi15 * 180 - loan;
      const int30 = totalInterest;
      compare = { pi15, pi30: pi, int15, int30, intSaved: int30 - int15, monthlyDiff: pi15 - pi };
    } else {
      const pi30 = calcMonthly(loan, r, 30);
      const int30 = pi30 * 360 - loan;
      compare = { pi15: pi, pi30, int15: totalInterest, int30, intSaved: int30 - totalInterest, monthlyDiff: pi - pi30 };
    }

    return { pi, tax, ins, pmi, total, totalInterest, totalCost: totalPayments + down, snapshots, compare };
  }, [loan, r, years, price, down, needsPMI]);

  function handlePriceBlur() {
    const n = parseFloat(purchasePrice.replace(/,/g, ''));
    if (n) setPurchasePrice(fmt(n));
  }

  function handleDownPctChange(v) {
    setDownMode('pct');
    setDownPct(v);
  }

  function handleDownAmtChange(v) {
    setDownMode('amt');
    setDownAmt(v);
  }

  return (
    <div className="page" style={{ padding: '2.5rem 0 3rem' }}>
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: '0.375rem' }}>{C.title}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>{C.subtitle}</p>

          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }}>

            {/* ── Inputs ── */}
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>

                <div className="form-group">
                  <label className="form-label">{C.purchasePrice}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
                    <input
                      className="form-input"
                      style={{ paddingLeft: '1.5rem' }}
                      value={purchasePrice}
                      onChange={e => setPurchasePrice(e.target.value)}
                      onBlur={handlePriceBlur}
                      placeholder="750,000"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{C.downPayment}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
                      <input
                        className="form-input"
                        style={{ paddingLeft: '1.5rem', borderColor: downMode === 'amt' ? 'var(--navy)' : undefined }}
                        value={downAmt || (downMode === 'pct' && price ? fmt(down) : '')}
                        onChange={e => handleDownAmtChange(e.target.value)}
                        placeholder={price ? fmt(price * 0.2) : '150,000'}
                      />
                    </div>
                    <div style={{ position: 'relative', width: '80px' }}>
                      <input
                        className="form-input"
                        style={{ paddingRight: '1.5rem', textAlign: 'right', borderColor: downMode === 'pct' ? 'var(--navy)' : undefined }}
                        value={downPct}
                        onChange={e => handleDownPctChange(e.target.value)}
                        placeholder="20"
                      />
                      <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{C.interestRate}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      style={{ paddingRight: '2rem' }}
                      value={rate}
                      onChange={e => setRate(e.target.value)}
                      placeholder="6.75"
                    />
                    <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{C.loanTerm}</label>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {C.terms.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setTermIdx(i)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          border: `1.5px solid ${termIdx === i ? 'var(--navy)' : 'var(--border)'}`,
                          background: termIdx === i ? 'var(--navy)' : 'var(--white)',
                          color: termIdx === i ? 'var(--white)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!results ? (
              <div className="state-box"><p>{C.noCalc}</p></div>
            ) : (
              <>
                {/* ── Monthly Payment Hero ── */}
                <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem', color: 'white', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>{C.monthlyPayment}</p>
                  <div style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontFamily: 'var(--font-heading)', color: 'var(--gold)', fontWeight: 600, lineHeight: 1 }}>
                    ${fmt(results.total)}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                    {needsPMI && <span style={{ color: '#fbbf24', marginRight: '0.5rem' }}>⚠ {C.pmiNote}</span>}
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  {/* ── Breakdown ── */}
                  <div className="card">
                    <div className="form-section-title" style={{ marginBottom: '0.75rem' }}>{C.breakdown}</div>
                    <Row label={C.principal} value={`$${fmt(results.pi)}/mo`} />
                    <Row label={C.tax} value={`$${fmt(results.tax)}/mo`} />
                    <Row label={C.insurance} value={`$${fmt(results.ins)}/mo`} />
                    {needsPMI && <Row label={C.pmi} value={`$${fmt(results.pmi)}/mo`} />}
                    <Row label={C.total} value={`$${fmt(results.total)}/mo`} bold gold />
                  </div>

                  {/* ── Summary ── */}
                  <div className="card">
                    <div className="form-section-title" style={{ marginBottom: '0.75rem' }}>{C.loanSummary}</div>
                    <Row label={C.loanAmount} value={`$${fmt(loan)}`} />
                    <Row label={C.ltv} value={fmtRate(ltv)} />
                    <Row label={C.totalInterest} value={`$${fmt(results.totalInterest)}`} />
                    <Row label={C.totalCost} value={`$${fmt(results.totalCost)}`} bold />
                  </div>
                </div>

                {/* ── 15yr vs 30yr ── */}
                {results.compare && (
                  <div className="card">
                    <div className="form-section-title" style={{ marginBottom: '1rem' }}>{C.compare}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                      <div />
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)', padding: '0.5rem', background: 'var(--cream)', borderRadius: '6px' }}>{C.yr15}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem', background: 'var(--cream)', borderRadius: '6px' }}>{C.yr30}</div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{C.principal}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>${fmt(results.compare.pi15)}/mo</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>${fmt(results.compare.pi30)}/mo</div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{C.totalInterest}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>${fmt(results.compare.int15)}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>${fmt(results.compare.int30)}</div>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.875rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                        <strong>{C.interestSaving}:</strong> ${fmt(results.compare.intSaved)}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                        <strong>{C.monthlySaving}:</strong> ${fmt(results.compare.monthlyDiff)}/mo
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Amortization ── */}
                <div className="card">
                  <div className="form-section-title" style={{ marginBottom: '1rem' }}>{C.amortTitle}</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border)' }}>
                          {[C.year, C.balance, C.paid, '%'].map(h => (
                            <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.snapshots.map(s => (
                          <tr key={s.year} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--navy)' }}>{s.year}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>${fmt(s.balance)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>${fmt(loan - s.balance)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <div style={{ width: '60px', height: '6px', background: 'var(--cream-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${s.pctPaid}%`, height: '100%', background: 'var(--gold)', borderRadius: '3px' }} />
                                </div>
                                <span style={{ minWidth: '36px' }}>{s.pctPaid.toFixed(0)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── CTA ── */}
                <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
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
