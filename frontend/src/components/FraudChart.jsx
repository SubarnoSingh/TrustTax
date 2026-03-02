import React, { forwardRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const FraudChart = forwardRef(({ data }, ref) => {
  if (!data || data.length === 0) return (
    <div className="chart-container empty" ref={ref}>
      <p>No data available for distribution chart</p>
    </div>
  );

  // Group data by risk level
  const distribution = data.reduce((acc, item) => {
    acc[item.risk_level] = (acc[item.risk_level] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Safe', value: distribution['Safe'] || 0, color: '#10b981' },
    { name: 'Medium Risk', value: distribution['Medium Risk'] || 0, color: '#f59e0b' },
    { name: 'High Risk', value: distribution['High Risk'] || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="chart-container" ref={ref}>
      <h3>Fraud Risk Distribution</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default FraudChart;
