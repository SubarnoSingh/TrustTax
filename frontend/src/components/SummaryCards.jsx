import React from 'react';

const SummaryCards = ({ summary }) => {
  if (!summary) return null;

  const cards = [
    { label: 'Total Invoices', value: summary.total_invoices, color: '#3b82f6' },
    { label: 'Suspicious Invoices', value: summary.suspicious_invoices, color: '#ef4444' },
    { label: 'Fraud Percentage', value: summary.fraud_percentage, color: '#f59e0b' },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card, index) => (
        <div key={index} className="summary-card">
          <div className="card-label">{card.label}</div>
          <div className="card-value" style={{ color: card.color }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
