import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import FraudChart from './components/FraudChart';
import InvoiceTable from './components/InvoiceTable';
import InvoiceUpload from './components/InvoiceUpload';
import { getFraudSummary, detectFraud } from './api';
import './styles.css';

function App() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial summary data
  const fetchSummary = async () => {
    try {
      const data = await getFraudSummary();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError('Failed to fetch summary. Make sure the backend is running at http://127.0.0.1:8000');
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDetectFraud = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await detectFraud();
      setInvoices(data);
      // Update summary as well in case it changed
      fetchSummary();
    } catch (err) {
      console.error('Error detecting fraud:', err);
      setError('Detection failed. Is the backend server online?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Header />
      
      <main className="main-container">
        {error && <div className="error-message" style={{ color: 'red', padding: '1rem', border: '1px solid red', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}
        
        <SummaryCards summary={summary} />
        
        <section className="actions">
          <button 
            className="btn-primary" 
            onClick={handleDetectFraud}
            disabled={loading}
          >
            {loading ? 'Analyzing Data...' : 'Run Fraud Detection'}
          </button>
        </section>

        <InvoiceUpload />
        
        <FraudChart data={invoices} />
        
        <InvoiceTable invoices={invoices} />
      </main>
    </div>
  );
}

export default App;
