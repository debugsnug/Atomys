'use client';

import { useState, useEffect } from 'react';

export default function QuarterlyUpdate({ addToast }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quarter, setQuarter] = useState('Q1');
  const [updates, setUpdates] = useState({});
  const [saving, setSaving] = useState(false);
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/goals?view=my').then(r => r.json()),
      fetch('/api/admin/cycles').then(r => r.json()),
    ]).then(([d, c]) => {
      setSheets(d.sheets?.filter(s => s.status === 'APPROVED') || []);
      setCycles(c.cycles || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sheet = sheets[0];

  useEffect(() => {
    if (!sheet) return;
    const existing = {};
    sheet.goals.forEach(g => {
      const qu = g.quarterlyUpdates?.find(u => u.quarter === quarter);
      existing[g.id] = {
        actualValue: qu?.actualValue || '',
        completionDate: qu?.completionDate || '',
        status: qu?.status || 'NOT_STARTED',
      };
    });
    setUpdates(existing);
  }, [sheet, quarter]);

  const updateField = (goalId, field, value) => {
    setUpdates(prev => ({ ...prev, [goalId]: { ...prev[goalId], [field]: value } }));
  };

  const saveUpdates = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      const payload = Object.entries(updates).map(([goalId, data]) => ({
        goalId: parseInt(goalId), ...data
      }));
      const res = await fetch('/api/goals/quarterly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: sheet.id, quarter, updates: payload }),
      });
      const d = await res.json();
      if (res.ok) {
        if (d.syncedCount && d.syncedCount > 0) {
          addToast(`${quarter} achievement saved! Synced to ${d.syncedCount} linked shared goal(s).`, 'success');
        } else {
          addToast(`${quarter} achievement saved successfully!`, 'success');
        }
        // Refresh
        const r = await fetch('/api/goals?view=my');
        const rd = await r.json();
        setSheets(rd.sheets?.filter(s => s.status === 'APPROVED') || []);
      } else { addToast(d.error, 'error'); }
    } catch { addToast('Failed to save', 'error'); }
    setSaving(false);
  };

  if (loading) return <div><div className="page-header"><h1 className="page-title">Quarterly Update</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  if (!sheet) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Quarterly Update</h1></div>
        <div className="page-body">
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Approved Goal Sheet</h3>
            <p className="text-muted">Your goal sheet needs to be approved before you can log achievements</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Quarterly Achievement Update</h1>
            <p className="page-subtitle">Log your actual achievement against planned targets</p>
          </div>
          <button className="btn btn-primary" onClick={saveUpdates} disabled={saving}>
            {saving ? 'Saving...' : 'Save Achievement'}
          </button>
        </div>
      </div>
      <div className="page-body">
        <div className="tabs">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
            const cycle = cycles.find(c => c.phase === q);
            const now = new Date();
            const isOpen = cycle && new Date(cycle.windowOpen) <= now && now <= new Date(cycle.windowClose);
            return (
              <button key={q} className={`tab ${quarter === q ? 'active' : ''}`} onClick={() => setQuarter(q)}>
                {q} Check-in {isOpen ? '🟢' : ''}
              </button>
            );
          })}
        </div>

        {(() => {
          const cycle = cycles.find(c => c.phase === quarter);
          if (!cycle) return null;
          const now = new Date();
          const windowOpen = new Date(cycle.windowOpen);
          const windowClose = new Date(cycle.windowClose);
          const isOpen = windowOpen <= now && now <= windowClose;
          return (
            <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 'var(--radius-sm)', fontSize: 13,
              background: isOpen ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isOpen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: isOpen ? 'var(--success)' : 'var(--danger)' }}>
              {isOpen
                ? `${quarter} window is OPEN: ${windowOpen.toLocaleDateString()} — ${windowClose.toLocaleDateString()}`
                : `${quarter} window is CLOSED (${windowOpen.toLocaleDateString()} — ${windowClose.toLocaleDateString()}). Updates will be rejected.`}
            </div>
          );
        })()}

        {sheet.goals.map((goal, idx) => {
          const u = updates[goal.id] || {};
          return (
            <div className="checkin-card" key={goal.id}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="goal-number">GOAL {idx + 1}</span>
                  <span style={{ fontWeight: 600, marginLeft: 12 }}>{goal.title}</span>
                </div>
                <span className="badge badge-draft">{goal.uomType.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Planned Target</label>
                  <div style={{ padding: '10px 14px', background: 'var(--card)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                    {goal.uomType === 'TIMELINE' ? goal.targetDate : goal.uomType === 'ZERO' ? '0 (Zero target)' : goal.target}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Actual Achievement</label>
                  {goal.uomType === 'TIMELINE' ? (
                    <input type="date" className="form-input" value={u.completionDate || ''} onChange={e => updateField(goal.id, 'completionDate', e.target.value)} />
                  ) : (
                    <input type="number" className="form-input" value={u.actualValue || ''} onChange={e => updateField(goal.id, 'actualValue', e.target.value)} placeholder="Enter actual value" />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={u.status || 'NOT_STARTED'} onChange={e => updateField(goal.id, 'status', e.target.value)}>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ON_TRACK">On Track</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Weightage: <strong>{goal.weightage}%</strong>
                {goal.isSharedReadonly && <span className="badge badge-submitted" style={{ marginLeft: 8, fontSize: 10 }}>Shared KPI</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
