import { useState, useRef } from 'react';
import { apiUpload } from '../utils/api';
import styles from './ImportWizard.module.css';
import { useNavigate } from 'react-router-dom';

export default function ImportWizard() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.name.endsWith('.csv')) {
      setFile(selected);
      setError('');
    } else {
      setFile(null);
      setError('Please select a valid .csv file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    try {
      const result = await apiUpload('/upload-csv/', file);
      setReport(result);
    } catch (err) {
      setError(err.message || 'Failed to upload CSV.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Data Import Wizard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Upload your historical spreadsheet to reconcile balances.</p>
      </header>

      {!report ? (
        <div className={styles.card}>
          <div className={styles.uploadArea}>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              {file ? file.name : "Select expenses_export.csv"}
            </p>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileSelect} 
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <button 
              className={styles.uploadBtn} 
              style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
              onClick={() => fileInputRef.current.click()}
            >
              Browse Files
            </button>
          </div>

          {error && <p style={{ color: 'var(--accent-coral)', fontWeight: 'bold' }}>{error}</p>}

          <button 
            className={styles.uploadBtn} 
            style={{ width: '100%', background: file ? 'var(--accent-mint)' : 'var(--text-muted)' }}
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? 'Ingesting Data...' : 'Run Import Engine'}
          </button>
        </div>
      ) : (
        <div className={styles.card}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-mint)' }}>Import Report Generated</h2>
          
          <div className={styles.reportGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{report.total_rows}</div>
              <div className={styles.statLabel}>Total Rows</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{report.staged}</div>
              <div className={styles.statLabel}>Safely Staged</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber} style={{ color: 'var(--accent-coral)' }}>
                {report.anomalies_detected}
              </div>
              <div className={styles.statLabel}>Anomalies Found</div>
            </div>
          </div>

          <div className={styles.logContainer}>
            <h3 className={styles.logTitle}>Action Log & Flagged Anomalies</h3>
            {report.actions_taken.length > 0 ? (
              report.actions_taken.map((log, idx) => (
                <div key={idx} className={styles.logItem}>{log}</div>
              ))
            ) : (
              <div className={styles.logItem} style={{ color: 'var(--accent-mint)' }}>No anomalies detected. Clean import.</div>
            )}
          </div>
          <button 
            className={styles.uploadBtn} 
            style={{ marginTop: '2rem', width: '100%' }}
            onClick={() => navigate('/import/review')} 
          >
            Review Flagged Data
          </button>
        </div>
      )}
    </div>
  );
}