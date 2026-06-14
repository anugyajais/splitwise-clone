import styles from './Dashboard.module.css';

export default function Dashboard() {
  // Hardcoded mock data for now. We will wire this to our Django API later.
  const totalOwedToYou = 465.40;
  const totalYouOwe = 120.50;
  
  return (
    <div>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome back! Here is your current financial summary.</p>
      </header>

      <div className={styles.grid}>
        {/* Total Balance Chart Card */}
        <div className={styles.card} style={{ gridColumn: 'span 2' }}>
          <div className={styles.cardTitle}>Total Balance Overview</div>
          <div className={styles.chartWrapper}>
            <div className={styles.doughnut}></div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={styles.dot} style={{ background: 'var(--accent-mint)' }}></span>
                You are owed: <strong style={{ color: 'var(--text-main)' }}>${totalOwedToYou}</strong>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.dot} style={{ background: 'var(--accent-coral)' }}></span>
                You owe: <strong style={{ color: 'var(--text-main)' }}>${totalYouOwe}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Action Card / Quick Stats */}
        <div className={styles.card} style={{ background: 'var(--accent-pastel-blue)' }}>
          <div className={styles.cardTitle} style={{ color: 'var(--text-main)' }}>Quick Actions</div>
          <button style={{
             width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', 
             border: 'none', background: 'var(--text-main)', color: 'white', 
             fontWeight: '600', cursor: 'pointer', marginBottom: '0.75rem'
          }}>
            + Add an Expense
          </button>
          <button style={{
             width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', 
             border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)', 
             fontWeight: '600', cursor: 'pointer'
          }}>
            Settle Up
          </button>
        </div>
      </div>
    </div>
  );
}