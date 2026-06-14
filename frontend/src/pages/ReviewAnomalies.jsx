import { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import styles from './ReviewAnomalies.module.css';

export default function ReviewAnomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingAnomalies();
  }, []);

  const fetchPendingAnomalies = async () => {
    try {
      const data = await apiCall('/staged-expenses/?status=PENDING');
      setAnomalies(data);
    } catch (error) {
      console.error("Failed to fetch anomalies", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, correctedData) => {
    try {
      // Send the corrected data to our new @action endpoint
      await apiCall(`/staged-expenses/${id}/resolve/`, 'POST', correctedData);
      
      // Remove it from the list locally so the UI feels snappy
      setAnomalies(anomalies.filter(item => item.id !== id));
    } catch (error) {
      alert(error.message || "Failed to resolve anomaly.");
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading flagged data...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>Review Flagged Data</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Fix the anomalies below to import them into the permanent ledger.
          </p>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
          {anomalies.length} Pending
        </div>
      </header>

      {anomalies.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>All caught up!</h3>
          <p>No more flagged rows to review.</p>
        </div>
      ) : (
        anomalies.map((item) => (
          <AnomalyCard 
            key={item.id} 
            item={item} 
            onResolve={handleResolve} 
          />
        ))
      )}
    </div>
  );
}

// Sub-component for individual rows
function AnomalyCard({ item, onResolve }) {
  // Pre-fill the form with the raw data so the user only has to fix what's broken
  const [desc, setDesc] = useState(item.raw_description || '');
  const [amount, setAmount] = useState(item.raw_amount || '');
  const [payerId, setPayerId] = useState(''); // Would ideally be a dropdown of real users

  const submitResolution = () => {
    // Construct the cleaned payload
    const payload = {
      description: desc,
      amount: amount,
      payer_id: payerId, 
      currency: item.raw_currency || 'INR',
      split_type: item.raw_split_type || 'EQUAL',
      date: item.raw_date // Ensure this is formatted as YYYY-MM-DD
    };
    onResolve(item.id, payload);
  };

  return (
    <div className={styles.anomalyCard}>
      <div className={styles.cardHeader}>
        <strong style={{ color: 'var(--accent-coral)' }}>Row flagged during import</strong>
        <div className={styles.errorTags}>
          {item.anomalies?.errors?.map((err, i) => (
            <span key={i} className={styles.tag}>{err.replace(/_/g, ' ')}</span>
          ))}
        </div>
      </div>
      
      <div className={styles.cardBody}>
        {/* Show them the exact raw CSV string for context */}
        <div className={styles.rawRow}>
          CSV: {item.raw_date}, {item.raw_description}, {item.raw_paid_by}, {item.raw_amount}, {item.raw_currency}
        </div>

        <div className={styles.fixGrid}>
          <div className={styles.inputGroup}>
            <label>Description</label>
            <input 
              className={styles.input} 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Amount</label>
            <input 
              className={styles.input} 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Paid By (User ID)</label>
            <input 
              className={styles.input} 
              placeholder="Enter User ID (e.g., 1)"
              value={payerId} 
              onChange={e => setPayerId(e.target.value)} 
            />
          </div>
        </div>

        <button className={styles.resolveBtn} onClick={submitResolution}>
          Approve & Import to Ledger
        </button>
      </div>
    </div>
  );
}