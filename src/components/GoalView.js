'use client';

import { useState, useEffect } from 'react';

export default function GoalView({ onNavigate }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/goals?view=my').then(r => r.json()).then(d => {
      setSheets(d.sheets || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div><div className="page-header"><h1 className="page-title">My Goal Sheet</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  const sheet = sheets[0];

  if (!sheet) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">My Goal Sheet</h1></div>
        <div className="page-body">
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Goal Sheet Yet</h3>
            <p className="text-muted">Create your goals for the current cycle</p>
            <button className="btn btn-primary" onClick={() => onNavigate('create-goals')} style={{ marginTop: 16 }}>
              Create Goals
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0);

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">My Goal Sheet</h1>
            <p className="page-subtitle">Cycle {sheet.cycle} • <span className={`badge badge-${sheet.status.toLowerCase()}`}>{sheet.status}</span></p>
          </div>
          {['DRAFT', 'RETURNED'].includes(sheet.status) && (
            <button className="btn btn-primary" onClick={() => onNavigate('create-goals')}>Edit Goals</button>
          )}
        </div>
      </div>
      <div className="page-body">
        {sheet.status === 'RETURNED' && sheet.returnNote && (
          <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
            <strong style={{ color: 'var(--danger)' }}>! Manager Feedback:</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{sheet.returnNote}</span>
          </div>
        )}

        <div className="table-wrapper" style={{ marginBottom: 20 }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Goal Title</th>
                <th>Thrust Area</th>
                <th>UoM</th>
                <th>Target</th>
                <th>Weightage</th>
                <th>Latest Score</th>
              </tr>
            </thead>
            <tbody>
              {sheet.goals.map((goal, idx) => {
                const latestUpdate = goal.quarterlyUpdates?.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
                return (
                  <tr key={goal.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{goal.title}</div>
                      {goal.description && <div className="text-sm text-muted">{goal.description}</div>}
                      {goal.isSharedReadonly && <span className="badge badge-submitted" style={{ fontSize: 10 }}>Shared KPI</span>}
                    </td>
                    <td>{goal.thrustArea?.name || '—'}</td>
                    <td><span className="text-sm">{goal.uomType.replace(/_/g, ' ')}</span></td>
                    <td>{goal.uomType === 'TIMELINE' ? goal.targetDate : goal.uomType === 'ZERO' ? '0' : goal.target}</td>
                    <td><strong>{goal.weightage}%</strong></td>
                    <td>
                      {latestUpdate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className={`progress-fill ${latestUpdate.computedScore >= 80 ? 'success' : latestUpdate.computedScore >= 50 ? 'warning' : 'danger'}`}
                              style={{ width: `${Math.min(latestUpdate.computedScore, 100)}%` }} />
                          </div>
                          <span className="text-sm">{latestUpdate.computedScore}%</span>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr><td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>Total Weightage</td><td><strong>{totalWeightage}%</strong></td><td /></tr>
            </tfoot>
          </table>
        </div>

        {sheet.checkinComments?.length > 0 && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">💬 Manager Check-in Comments</h3></div>
            {sheet.checkinComments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-meta">{c.manager?.name} • {c.quarter} • {new Date(c.createdAt).toLocaleDateString()}</div>
                <div className="comment-text">{c.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
