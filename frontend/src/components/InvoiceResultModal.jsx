import React from 'react';

const InvoiceResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const getRiskColor = (score) => {
    if (score <= 30) return '#10b981';
    if (score <= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Analysis Result: {result.invoice_id}</h4>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
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
            <h5 style={{marginBottom: '1rem'}}>Extracted Invoice Details</h5>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><strong>Seller GSTIN:</strong> {result.extracted_data.seller_gstin}</div>
                <div><strong>Buyer GSTIN:</strong> {result.extracted_data.buyer_gstin}</div>
                <div><strong>Amount:</strong> ₹{result.extracted_data.invoice_amount.toLocaleString()}</div>
                <div><strong>GST Rate:</strong> {(result.extracted_data.gst_rate * 100).toFixed(0)}%</div>
                <div><strong>GST Amount:</strong> ₹{result.extracted_data.gst_amount.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceResultModal;
