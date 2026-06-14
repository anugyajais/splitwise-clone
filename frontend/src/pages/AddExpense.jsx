import { useState } from 'react';
import styles from './AddExpense.module.css';

export default function AddExpense() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');

  // Mock participants (We will fetch these from Django /api/groups/ later)
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', isIncluded: true, splitValue: '' },
    { id: 2, name: 'Alex', isIncluded: true, splitValue: '' },
    { id: 3, name: 'Sam', isIncluded: true, splitValue: '' }
  ]);

  const handleSplitValueChange = (id, value) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, splitValue: value } : p
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here we will format the payload to match the backend expectation
    const payload = {
      description,
      amount,
      split_type: splitType,
      splits: participants.filter(p => p.isIncluded).map(p => ({
        user_id: p.id,
        owed_amount: splitType === 'UNEQUAL' ? p.splitValue : undefined,
        percentage: splitType === 'PERCENTAGE' ? p.splitValue : undefined,
        share: splitType === 'SHARE' ? p.splitValue : undefined,
      }))
    };
    console.log("Submitting to Django:", payload);
    // TODO: POST request to /api/expenses/
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Add an Expense</h1>
      </header>

      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Description</label>
          <input 
            type="text" 
            className={styles.input} 
            placeholder="e.g., Dinner at Mario's"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>Total Amount ($)</label>
          <input 
            type="number" 
            step="0.01"
            className={styles.input} 
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <label className={styles.label} style={{ marginTop: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>
          Split Method
        </label>
        <div className={styles.splitTypes}>
          {['EQUAL', 'UNEQUAL', 'PERCENTAGE', 'SHARE'].map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.typeBtn} ${splitType === type ? styles.active : ''}`}
              onClick={() => setSplitType(type)}
            >
              {type === 'PERCENTAGE' ? '%' : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className={styles.participantsList}>
          {participants.map((p) => (
            <div key={p.id} className={styles.participantRow}>
              <div className={styles.participantInfo}>
                <input 
                  type="checkbox" 
                  checked={p.isIncluded}
                  onChange={() => setParticipants(participants.map(part => 
                    part.id === p.id ? { ...part, isIncluded: !part.isIncluded } : part
                  ))}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-mint)' }}
                />
                <span>{p.name}</span>
              </div>

              {/* Dynamic Input based on Split Type */}
              {p.isIncluded && splitType !== 'EQUAL' && (
                <div className={styles.splitInputWrapper}>
                  <input 
                    type="number" 
                    className={styles.smallInput}
                    placeholder="0"
                    value={p.splitValue}
                    onChange={(e) => handleSplitValueChange(p.id, e.target.value)}
                    required
                  />
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
                    {splitType === 'UNEQUAL' && '$'}
                    {splitType === 'PERCENTAGE' && '%'}
                    {splitType === 'SHARE' && 'shares'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className={styles.submitBtn}>Save Expense</button>
      </form>
    </div>
  );
}