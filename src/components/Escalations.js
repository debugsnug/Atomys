'use client';

import { useState, useEffect } from 'react';

const TRIGGER_OPTIONS = [
  { value: 'NO_SUBMISSION', label: 'Employee has not submitted goals', icon: '' },
  { value: 'NO_APPROVAL', label: 'Manager has not approved goals', icon: '' },
  { value: 'NO_CHECKIN', label: 'Quarterly check-in not completed', icon: '' },
];

export default function Escalations({ addToast }) {
  const [rules, setRules] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState(false);
  const [form, setForm] = useState({ name: '', trigger: 'NO_SUBMISSION', thresholdDays: 7 });
  const [activeTab, setActiveTab] = useState('rules');

  const fetchData = () => {
    fetch('/api/escalations').then(r => r.json()).then(d => {
      setRules(d.rules || []);
      setEscalations(d.escalations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createRule = async () => {
    if (!form.name) { addToast('Rule name is required', 'error'); return; }
    const res = await fetch('/api/escalations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_RULE', ...form }),
    });
    if (res.ok) {
      addToast('Escalation rule created', 'success');
      setShowCreate(false);
      setForm({ name: '', trigger: 'NO_SUBMISSION', thresholdDays: 7 });
      fetchData();
    }
  };

  const toggleRule = async (ruleId, isActive) => {
    await fetch('/api/escalations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_RULE', ruleId, isActive }),
    });
    fetchData();
  };

  const runEngine = async () => {
    setRunning(true);
    const res = await fetch('/api/escalations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RUN_ENGINE' }),
    });
    const d = await res.json();
    if (res.ok) {
      addToast(d.message || 'Escalation engine completed', 'success');
      fetchData();
    } else { addToast(d.error, 'error'); }
    setRunning(false);
  };

  const resolveEscalation = async (id) => {
    await fetch('/api/escalations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESOLVE', escalationId: id }),
    });
    addToast('Escalation resolved', 'success');
    fetchData();
  };

  const getLevelLabel = (level) => level === 1 ? 'L1 — Employee' : level === 2 ? 'L2 — Manager' : 'L3 — HR / Skip-Level';
  const getLevelColor = (level) => level === 1 ? '#f59e0b' : level === 2 ? '#f97316' : '#ef4444';

  if (loading) return <div><div className="page-header"><h1 className="page-title">Escalations</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  const openEscalations = escalations.filter(e => e.status === 'OPEN');
  const resolvedEscalations = escalations.filter(e => e.status === 'RESOLVED');

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Escalation Module</h1>
            <p className="page-subtitle">{openEscalations.length} open • {rules.length} rules configured</p>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-outline" onClick={() => setShowCreate(true)}>+ New Rule</button>
            <button className="btn btn-primary" onClick={runEngine} disabled={running}>
              {running ? 'Running...' : 'Run Engine'}
            </button>
          </div>
        </div>
      </div>
      <div className="page-body">
        <div className="tabs mb-16">
          <button className={`tab ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>Rules ({rules.length})</button>
          <button className={`tab ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')}>Open ({openEscalations.length})</button>
          <button className={`tab ${activeTab === 'resolved' ? 'active' : ''}`} onClick={() => setActiveTab('resolved')}>Resolved ({resolvedEscalations.length})</button>
        </div>

        {showCreate && (
          <div className="card mb-20" style={{ border: '1px solid var(--primary)', background: 'rgba(99,102,241,0.05)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Create Escalation Rule</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Rule Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Late Goal Submission" /></div>
              <div className="form-group"><label className="form-label">Trigger</label><select className="form-select" value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}>{TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.icon} {o.label}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Threshold (days)</label><input type="number" className="form-input" value={form.thresholdDays} onChange={e => setForm({ ...form, thresholdDays: parseInt(e.target.value) || 7 })} min={1} /></div>
            </div>
            <div className="modal-actions" style={{ marginTop: 12 }}>
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createRule}>Create Rule</button>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Rule Name</th><th>Trigger</th><th>Threshold</th><th>Status</th><th>Escalations</th><th>Action</th></tr></thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No rules configured. Click "+ New Rule" to create one.</td></tr>
                  ) : rules.map(rule => (
                    <tr key={rule.id}>
                      <td><strong>{rule.name}</strong></td>
                      <td>{TRIGGER_OPTIONS.find(t => t.value === rule.trigger)?.icon} {rule.trigger.replace(/_/g, ' ')}</td>
                      <td>{rule.thresholdDays} days</td>
                      <td><span className={`badge ${rule.isActive ? 'badge-approved' : 'badge-draft'}`}>{rule.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>{rule._count?.escalations || 0}</td>
                      <td><button className={`btn btn-sm ${rule.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleRule(rule.id, !rule.isActive)}>{rule.isActive ? 'Disable' : 'Enable'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'open' && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Created</th><th>User</th><th>Rule</th><th>Level</th><th>Details</th><th>Action</th></tr></thead>
                <tbody>
                  {openEscalations.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No open escalations</td></tr>
                  ) : openEscalations.map(esc => (
                    <tr key={esc.id}>
                      <td className="text-sm">{new Date(esc.createdAt).toLocaleDateString()}</td>
                      <td><strong>{esc.targetUser?.name}</strong><div className="text-sm text-muted">{esc.targetUser?.role} • {esc.targetUser?.department?.name}</div></td>
                      <td><span className="badge badge-submitted">{esc.rule?.name}</span></td>
                      <td><span style={{ color: getLevelColor(esc.level), fontWeight: 700 }}>{getLevelLabel(esc.level)}</span></td>
                      <td className="text-sm">{esc.details}</td>
                      <td><button className="btn btn-success btn-sm" onClick={() => resolveEscalation(esc.id)}>✓ Resolve</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'resolved' && (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Created</th><th>Resolved</th><th>User</th><th>Rule</th><th>Level</th><th>Details</th></tr></thead>
                <tbody>
                  {resolvedEscalations.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No resolved escalations</td></tr>
                  ) : resolvedEscalations.map(esc => (
                    <tr key={esc.id}>
                      <td className="text-sm">{new Date(esc.createdAt).toLocaleDateString()}</td>
                      <td className="text-sm">{esc.resolvedAt ? new Date(esc.resolvedAt).toLocaleDateString() : '—'}</td>
                      <td><strong>{esc.targetUser?.name}</strong></td>
                      <td><span className="badge badge-approved">{esc.rule?.name}</span></td>
                      <td>{getLevelLabel(esc.level)}</td>
                      <td className="text-sm">{esc.details}</td>
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
