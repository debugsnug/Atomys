'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CountUp from './CountUp';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/dashboard').then(r => r.json()).then(data => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div><div className="page-header"><h1 className="page-title">Dashboard</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  const s = stats?.stats || {};
  const cs = stats?.checkinStats || {};
  const ds = stats?.deptStats || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}</h1>
        <p className="page-subtitle">Here&apos;s your organization&apos;s goal tracking overview</p>
      </div>
      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-label">Total Employees</div>
            <div className="stat-value"><CountUp end={s.totalEmployees || 0} /></div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Approved Goal Sheets</div>
            <div className="stat-value"><CountUp end={s.approvedSheets || 0} /></div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">Pending Approval</div>
            <div className="stat-value"><CountUp end={s.submittedSheets || 0} /></div>
          </div>
          <div className="stat-card danger">
            <div className="stat-label">Returned</div>
            <div className="stat-value"><CountUp end={s.returnedSheets || 0} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Check-in Completion</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Quarter</th><th>Employee Updates</th><th>Manager Check-ins</th></tr></thead>
                <tbody>
                  {['Q1','Q2','Q3','Q4'].map(q => (
                    <tr key={q}>
                      <td><strong>{q}</strong></td>
                      <td>{cs[q]?.employeeUpdates || 0} / {cs[q]?.totalApproved || 0}</td>
                      <td>{cs[q]?.managerCheckins || 0} / {cs[q]?.totalApproved || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Department Overview</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Department</th><th>Employees</th><th>Goals</th><th>Avg Score</th></tr></thead>
                <tbody>
                  {ds.map(d => (
                    <tr key={d.name}>
                      <td><strong>{d.name}</strong></td>
                      <td>{d.employees}</td>
                      <td>{d.totalGoals}</td>
                      <td>
                        <span style={{ color: d.totalGoals > 0 && d.avgScore > 0 ? (d.avgScore >= 80 ? 'var(--success)' : d.avgScore >= 50 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)' }}>
                          {d.totalGoals > 0 ? `${d.avgScore}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Goal Sheet Status Distribution</h3>
          </div>
          <div style={{ display: 'flex', gap: 24, padding: '12px 0' }}>
            {[
              { label: 'Draft', value: s.draftSheets, color: '#94a3b8' },
              { label: 'Submitted', value: s.submittedSheets, color: '#fbbf24' },
              { label: 'Approved', value: s.approvedSheets, color: '#34d399' },
              { label: 'Returned', value: s.returnedSheets, color: '#f87171' },
            ].map(item => (
              <div key={item.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: item.color }}><CountUp end={item.value || 0} /></div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{
                    width: `${s.totalSheets ? (item.value / s.totalSheets) * 100 : 0}%`,
                    background: item.color
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
