'use client';

import { useState, useEffect } from 'react';

export default function Reports({ addToast }) {
  const [quarter, setQuarter] = useState('Q1');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/achievement?quarter=${quarter}`).then(r => r.json()).then(d => {
      setData(d.reportData || []);
      setLoading(false);
    });
  }, [quarter]);

  const exportCSV = () => {
    if (!data.length) return;
    const headers = ['Employee', 'Email', 'Department', 'Goal', 'Thrust Area', 'UoM', 'Target', 'Weightage%', 'Actual', 'Status', 'Score%'];
    const rows = data.map(r => [r.employeeName, r.employeeEmail, r.department, r.goalTitle, r.thrustArea, r.uomType, r.target, r.weightage, r.actualValue, r.status, r.score]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achievement_report_${quarter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Report exported as CSV', 'success');
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Achievement Report</h1>
            <p className="page-subtitle">Planned Target vs. Actual Achievement</p>
          </div>
          <button className="btn btn-primary" onClick={exportCSV} disabled={!data.length}>Export CSV</button>
        </div>
      </div>
      <div className="page-body">
        <div className="tabs mb-16">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <button key={q} className={`tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>{q}</button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Data Available</h3>
            <p className="text-muted">No achievement data found for {quarter}</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Goal</th>
                    <th>Thrust Area</th>
                    <th>Target</th>
                    <th>Wt%</th>
                    <th>Actual</th>
                    <th>Status</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.employeeName}</strong></td>
                      <td className="text-sm">{r.department}</td>
                      <td>{r.goalTitle}</td>
                      <td className="text-sm">{r.thrustArea}</td>
                      <td>{r.uomType === 'TIMELINE' ? r.targetDate : r.target}</td>
                      <td>{r.weightage}%</td>
                      <td>{r.uomType === 'TIMELINE' ? r.completionDate || '—' : r.actualValue}</td>
                      <td><span className={`badge badge-${r.status.toLowerCase().replace(/_/g, '-')}`}>{r.status.replace(/_/g, ' ')}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: r.score >= 80 ? 'var(--success)' : r.score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                          {r.score}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
