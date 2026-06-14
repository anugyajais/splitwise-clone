import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import styles from './Balances.module.css';
import { useNavigate } from 'react-router-dom';

export default function Balances() {
  const navigate = useNavigate();
  const [data, setData] = useState({ user_summaries: [], detailed_debts: [] });
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const response = await apiCall('/balances/');
      setData(response);
    } catch (err) {
      console.error("Error fetching balances", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (idx) => {
    setExpandedRow(expandedRow === idx ? null : idx);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Crunching numbers...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Group Balances</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Unified summary with real-time USD/INR conversion.
          </p>
        </div>
        
        {/* New Upload Button */}
        <button 
          onClick={() => navigate('/import')}
          style={{
            background: 'var(--text-main)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          + Upload CSV
        </button>
      </header>

      {/* Aisha's View: "Just one number per person" */}
      <div className={styles.summaryGrid}>
        {data.user_summaries.map((u, i) => (
          <div key={i} className={styles.userCard}>
            <div className={styles.avatar}>{u.user.charAt(0)}</div>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{u.user}</div>
            <div className={u.net_balance_inr < 0 ? styles.amountOwed : styles.amountOwes}>
              {u.net_balance_inr < 0 ? '-' : '+'}₹{Math.abs(u.net_balance_inr).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {u.net_balance_inr < 0 ? 'Total Owed' : 'Gets Back'}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', marginTop: '2rem' }}>
        Debt Breakdown (Audit Trail)
      </h2>

      {/* Rohan's View: "No magic numbers" */}
      <div>
        {data.detailed_debts.map((debt, idx) => (
          <div key={idx} className={styles.debtRow}>
            <div className={styles.debtHeader} onClick={() => toggleRow(idx)}>
              <strong style={{ fontSize: '1.1rem' }}>
                {debt.debtor} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>owes</span> {debt.creditor}
              </strong>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                ₹{debt.net_amount_inr.toLocaleString()}
              </div>
            </div>

            {expandedRow === idx && (
              <div className={styles.traceContainer}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Calculation Breakdown
                </div>
                
                {debt.trace_debtor.map((trace, i) => (
                  <div key={i} className={styles.traceItem}>
                    <span className={styles.traceDate}>{trace.date}</span>
                    <span className={styles.traceDesc}>
                      {trace.description} 
                      {trace.original_currency === 'USD' && 
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>
                          (Original: ${trace.original_amount})
                        </span>
                      }
                    </span>
                    <span className={styles.traceAmount} style={{ color: 'var(--accent-coral)' }}>
                      +₹{parseFloat(trace.inr_value).toLocaleString()}
                    </span>
                  </div>
                ))}

                {debt.trace_creditor.map((trace, i) => (
                  <div key={i} className={styles.traceItem}>
                    <span className={styles.traceDate}>{trace.date}</span>
                    <span className={styles.traceDesc}>
                      Offset: {trace.description}
                    </span>
                    <span className={styles.traceAmount} style={{ color: 'var(--accent-mint)' }}>
                      -₹{parseFloat(trace.inr_value).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}