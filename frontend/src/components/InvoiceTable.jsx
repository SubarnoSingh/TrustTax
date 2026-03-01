import React from 'react';

const InvoiceTable = ({ invoices }) => {
  if (!invoices || invoices.length === 0) return (
    <div className="table-container empty">
      <p>No invoices detected with risk. Click "Run Fraud Detection" to see results.</p>
    </div>
  );

  const getRiskColor = (score) => {
    if (score <= 30) return '#10b981'; // Green
    if (score <= 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="table-container">
      <h3>Suspicious Invoices</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Seller GSTIN</th>
              <th>Buyer GSTIN</th>
              <th>Invoice Amount</th>
              <th>Risk Score</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={index}>
                <td>{invoice.invoice_id}</td>
                <td>{invoice.seller_gstin}</td>
                <td>{invoice.buyer_gstin}</td>
                <td>₹{invoice.invoice_amount ? invoice.invoice_amount.toLocaleString() : 'N/A'}</td>
                <td>
                  <span 
                    className="risk-badge" 
                    style={{ backgroundColor: getRiskColor(invoice.risk_score) }}
                  >
                    {invoice.risk_score}
                  </span>
                </td>
                <td>
                  <div className="flags">
                    {invoice.flags.map((flag, i) => (
                      <span key={i} className="flag-badge">{flag}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
