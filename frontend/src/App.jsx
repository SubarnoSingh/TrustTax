import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import FraudChart from './components/FraudChart';
import InvoiceTable from './components/InvoiceTable';
import InvoiceUpload from './components/InvoiceUpload';
import InvoiceResultModal from './components/InvoiceResultModal';
import { getFraudSummary, detectFraud } from './api';
import './styles.css';

function App() {
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fraudChartRef = useRef(null);

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
      // Scroll to the fraud chart
      fraudChartRef.current.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Error detecting fraud:', err);
      setError('Detection failed. Is the backend server online?');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAnalysisResult(null);
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
            {loading ? 'Analyzing Dataset...' : 'Analyze from Dataset'}
          </button>
        </section>
        
        <InvoiceUpload onAnalysisComplete={handleAnalysisComplete} />
        
        <FraudChart ref={fraudChartRef} data={invoices} />
        
        <InvoiceTable invoices={invoices} />

        {isModalOpen && <InvoiceResultModal result={analysisResult} onClose={closeModal} />}
      </main>
    </div>
  );
}

export default App;
