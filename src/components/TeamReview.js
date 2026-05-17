'use client';

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import ExportButton from './ExportButton';

export default function TeamReview({ addToast }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [returnNote, setReturnNote] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editedGoals, setEditedGoals] = useState({});
  const [checkinQuarter, setCheckinQuarter] = useState('Q1');
  const [checkinComment, setCheckinComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchSheets = () => {
    fetch('/api/goals?view=team').then(r => r.json()).then(d => {
      setSheets(d.sheets || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchSheets(); }, []);

  const handleApprove = async (sheet) => {
    setProcessing(true);
    const edits = Object.entries(editedGoals).map(([id, data]) => ({ id: parseInt(id), ...data }));
    const res = await fetch('/api/goals/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: sheet.id, action: 'APPROVE', editedGoals: edits }),
    });
    if (res.ok) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4a017', '#e8b930', '#b8860b', '#f5d060']
      });
      addToast(`Goal sheet approved for ${sheet.user.name}`, 'success');
      setSelectedSheet(null);
      setEditedGoals({});
      fetchSheets();
    } else {
      const d = await res.json();
      addToast(d.error, 'error');
    }
    setProcessing(false);
  };

  const handleReturn = async () => {
    if (!selectedSheet) return;
    setProcessing(true);
    const res = await fetch('/api/goals/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: selectedSheet.id, action: 'RETURN', returnNote }),
    });
    if (res.ok) {
      addToast('Goal sheet returned for rework', 'warning');
      setShowReturnModal(false);
      setSelectedSheet(null);
      setReturnNote('');
      fetchSheets();
    } else {
      const d = await res.json();
      addToast(d.error, 'error');
    }
    setProcessing(false);
  };

  const handleCheckin = async (sheetId) => {
    if (!checkinComment.trim()) { addToast('Please enter a comment', 'error'); return; }
    const res = await fetch('/api/goals/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId, quarter: checkinQuarter, comment: checkinComment }),
    });
    if (res.ok) {
      addToast('Check-in comment saved', 'success');
      setCheckinComment('');
      fetchSheets();
    } else {
      const d = await res.json();
      addToast(d.error, 'error');
    }
  };

  const editGoalField = (goalId, field, value) => {
    setEditedGoals(prev => ({ ...prev, [goalId]: { ...prev[goalId], [field]: parseFloat(value) || 0 } }));
  };

  if (loading) return <div><div className="page-header"><h1 className="page-title">Team Review</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  const submitted = sheets.filter(s => s.status === 'SUBMITTED');
  const approved = sheets.filter(s => s.status === 'APPROVED');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Team Review</h1>
        <p className="page-subtitle">{sheets.length} team member(s) • {submitted.length} pending approval</p>
      </div>
      <div className="page-body">
        {submitted.length > 0 && (
          <div className="mb-24">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Pending Approval ({submitted.length})</h2>
            {submitted.map(sheet => (
              <div className="card mb-16" key={sheet.id}>
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{sheet.user.name}</div>
                    <div className="text-sm text-muted">{sheet.user.email} • {sheet.user.department?.name}</div>
                  </div>
                  <div className="flex gap-8 items-center">
                    <span className="text-sm text-muted" style={{ marginRight: 8 }}>Inline edit Target/Weightage before approving</span>
                    <button className="btn btn-danger btn-sm" onClick={() => { setSelectedSheet(sheet); setShowReturnModal(true); }}>↩ Return</button>
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(sheet)} disabled={processing}>✓ Approve</button>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>#</th><th>Goal</th><th>UoM</th><th>Target</th><th>Weightage</th></tr></thead>
                    <tbody>
                      {sheet.goals.map((g, i) => (
                        <tr key={g.id}>
                          <td>{i + 1}</td>
                          <td><strong>{g.title}</strong>{g.description && <div className="text-sm text-muted">{g.description}</div>}</td>
                          <td>{g.uomType.replace(/_/g, ' ')}</td>
                          <td>
                            <input type="number" className="form-input brand-border" style={{ width: 100, padding: '4px 8px', background: 'rgba(212,160,23,0.05)' }}
                              defaultValue={g.target} onChange={e => editGoalField(g.id, 'target', e.target.value)} title="Manager can edit target" />
                          </td>
                          <td>
                            <input type="number" className="form-input brand-border" style={{ width: 80, padding: '4px 8px', background: 'rgba(212,160,23,0.05)' }}
                              defaultValue={g.weightage} onChange={e => editGoalField(g.id, 'weightage', e.target.value)} title="Manager can edit weightage" />%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr><td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Updated Total Weightage</td><td><strong style={{ color: sheet.goals.reduce((s, g) => s + (editedGoals[g.id]?.weightage !== undefined ? editedGoals[g.id].weightage : g.weightage), 0) === 100 ? 'var(--success)' : 'var(--danger)' }}>{sheet.goals.reduce((s, g) => s + (editedGoals[g.id]?.weightage !== undefined ? editedGoals[g.id].weightage : g.weightage), 0)}%</strong></td></tr></tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {approved.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Approved Goal Sheets ({approved.length})</h2>
              <ExportButton 
                filename={`team_achievements_${checkinQuarter}`}
                data={approved.map(s => ({
                  employee: s.user?.name,
                  department: s.user?.department?.name || 'N/A',
                  goals: s.goals.length,
                  score: s.quarterlyCheckins?.find(c => c.quarter === checkinQuarter)?.managerScore || 'Not Scored'
                }))}
                columns={[
                  { key: 'employee', label: 'Employee Name' },
                  { key: 'department', label: 'Department' },
                  { key: 'goals', label: 'Total Goals' },
                  { key: 'score', label: `${checkinQuarter} Score (%)` }
                ]}
              />
            </div>
            <div className="tabs mb-16">
              {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                <button key={q} className={`tab ${checkinQuarter === q ? 'active' : ''}`} onClick={() => setCheckinQuarter(q)}>{q}</button>
              ))}
            </div>

            {approved.map(sheet => (
              <div className="card mb-16" key={sheet.id}>
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <div style={{ fontWeight: 700 }}>{sheet.user.name}</div>
                    <div className="text-sm text-muted">{sheet.user.department?.name}</div>
                  </div>
                  <span className="badge badge-approved">Approved</span>
                </div>
                <div className="table-wrapper mb-16">
                  <table>
                    <thead><tr><th>Goal</th><th>Target</th><th>Actual ({checkinQuarter})</th><th>Status</th><th>Score</th></tr></thead>
                    <tbody>
                      {sheet.goals.map(g => {
                        const qu = g.quarterlyUpdates?.find(u => u.quarter === checkinQuarter);
                        return (
                          <tr key={g.id}>
                            <td><strong>{g.title}</strong> <span className="text-sm text-muted">({g.weightage}%)</span></td>
                            <td>{g.uomType === 'TIMELINE' ? g.targetDate : g.target}</td>
                            <td>{qu ? (g.uomType === 'TIMELINE' ? qu.completionDate || '—' : qu.actualValue) : '—'}</td>
                            <td>{qu ? <span className={`badge badge-${qu.status.toLowerCase().replace(/_/g, '-')}`}>{qu.status.replace(/_/g, ' ')}</span> : '—'}</td>
                            <td>
                              {qu ? (
                                <span style={{ fontWeight: 700, color: qu.computedScore >= 80 ? 'var(--success)' : qu.computedScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                                  {qu.computedScore}%
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label className="form-label">Check-in Comment ({checkinQuarter})</label>
                    <textarea className="form-textarea" value={checkinComment} onChange={e => setCheckinComment(e.target.value)}
                      placeholder="Document your discussion and feedback..." rows={2} />
                  </div>
                  <button className="btn btn-primary" onClick={() => handleCheckin(sheet.id)} style={{ marginBottom: 0 }}>
                    💬 Add Comment
                  </button>
                </div>

                {sheet.checkinComments?.filter(c => c.quarter === checkinQuarter).length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {sheet.checkinComments.filter(c => c.quarter === checkinQuarter).map(c => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-meta">{c.manager?.name} • {new Date(c.createdAt).toLocaleDateString()}</div>
                        <div className="comment-text">{c.comment}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {sheets.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Team Members</h3>
            <p className="text-muted">No employees are assigned to you yet</p>
          </div>
        )}

        {/* Return Modal */}
        {showReturnModal && (
          <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Return Goal Sheet</h2>
              <p className="text-muted mb-16">Returning goal sheet for <strong>{selectedSheet?.user?.name}</strong></p>
              <div className="form-group">
                <label className="form-label">Feedback / Reason for Return</label>
                <textarea className="form-textarea" value={returnNote} onChange={e => setReturnNote(e.target.value)}
                  placeholder="Provide specific feedback on what needs to change..." rows={4} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleReturn} disabled={processing}>Return for Rework</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
