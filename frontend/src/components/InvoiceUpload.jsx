import React, { useState, useRef } from 'react';
import { uploadInvoice } from '../api';

const InvoiceUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Only PDF files are supported.');
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await uploadInvoice(file);
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to analyze invoice. Is the backend server online?');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 30) return '#10b981';
    if (score <= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="invoice-upload-section chart-container">
      <h3>Upload GST Invoice (PDF)</h3>
      
      <div 
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <div className="upload-icon">📄</div>
        <div className="upload-text">
          {file ? 'Change selected file' : 'Drag & Drop PDF here'}
        </div>
        <div className="upload-hint">or</div>
        <button className="file-select-btn" type="button">
          Select File
        </button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept=".pdf" 
          style={{ display: 'none' }}
        />
      </div>

      {file && (
        <div className="selected-file-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div className="selected-file">
            <span className="pdf-icon">📕</span>
            <span className="file-name">{file.name}</span>
          </div>
          <button 
            className="btn-primary" 
            onClick={(e) => { e.stopPropagation(); handleUpload(); }} 
            disabled={loading}
            style={{ marginTop: '1.5rem', width: '200px' }}
          >
            {loading ? 'Analyzing...' : 'Analyze Invoice'}
          </button>
        </div>
      )}

      {error && <p className="error-text" style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem' }}>{error}</p>}

      {result && (
        <div className="upload-result-card" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Analysis Result: {result.invoice_id}</h4>
          </div>
          
          <div className="result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="result-item">
              <strong>Risk Score:</strong>
              <span 
                className="risk-badge" 
                style={{ 
                  backgroundColor: getRiskColor(result.risk_score),
                  marginLeft: '10px',
                  display: 'inline-block'
                }}
              >
                {result.risk_score}
              </span>
            </div>
            <div className="result-item">
              <strong>Extraction Mode:</strong>
              <span 
                style={{ 
                  marginLeft: '10px',
                  padding: '0.25rem 0.75rem',
                  background: '#f1f5f9',
                  borderRadius: '50px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
              >
                {result.extraction_mode}
              </span>
            </div>
          </div>
          
          <div className="result-flags" style={{ marginTop: '1.5rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Fraud Indicators:</strong>
            {result.flags.length > 0 ? (
              <div className="flags">
                {result.flags.map((flag, i) => (
                  <span key={i} className="flag-badge" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}>
                    {flag}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ No fraud patterns detected. Invoice appears safe.
              </p>
            )}
          </div>

          <div className="extracted-data" style={{ marginTop: '2rem' }}>
            <details>
              <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
                View Extracted Invoice Details
              </summary>
              <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                  <div><strong>Seller GSTIN:</strong> {result.extracted_data.seller_gstin}</div>
                  <div><strong>Buyer GSTIN:</strong> {result.extracted_data.buyer_gstin}</div>
                  <div><strong>Amount:</strong> ₹{result.extracted_data.invoice_amount.toLocaleString()}</div>
                  <div><strong>GST Rate:</strong> {(result.extracted_data.gst_rate * 100).toFixed(0)}%</div>
                  <div><strong>GST Amount:</strong> ₹{result.extracted_data.gst_amount.toLocaleString()}</div>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceUpload;
