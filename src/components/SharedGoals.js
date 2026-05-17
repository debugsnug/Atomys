'use client';

import { useState, useEffect } from 'react';

const UOM_OPTIONS = [
  { value: 'NUMERIC_MIN', label: 'Numeric (Higher is better)' },
  { value: 'NUMERIC_MAX', label: 'Numeric (Lower is better)' },
  { value: 'PERCENT_MIN', label: '% (Higher is better)' },
  { value: 'PERCENT_MAX', label: '% (Lower is better)' },
  { value: 'TIMELINE', label: 'Timeline' },
  { value: 'ZERO', label: 'Zero-based' },
];

export default function SharedGoals({ addToast }) {
  const [sharedGoals, setSharedGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', uomType: 'NUMERIC_MIN', target: '', targetDate: '', departmentId: '', employeeIds: [] });

  useEffect(() => {
    Promise.all([
      fetch('/api/shared-goals').then(r => r.json()),
      fetch('/api/admin/employees').then(r => r.json()),
    ]).then(([sg, emp]) => {
      setSharedGoals(sg.sharedGoals || []);
      setEmployees(emp.employees || []);
      setLoading(false);
    });
  }, []);

  const toggleEmployee = (id) => {
    setForm(prev => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter(e => e !== id)
        : [...prev.employeeIds, id],
    }));
  };

  const createSharedGoal = async () => {
    if (!form.title) { addToast('Title is required', 'error'); return; }
    const res = await fetch('/api/shared-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      addToast('Shared goal created and pushed!', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', uomType: 'NUMERIC_MIN', target: '', targetDate: '', departmentId: '', employeeIds: [] });
      const sg = await fetch('/api/shared-goals').then(r => r.json());
      setSharedGoals(sg.sharedGoals || []);
    } else {
      const d = await res.json();
      addToast(d.error, 'error');
    }
  };

  if (loading) return <div><div className="page-header"><h1 className="page-title">Shared Goals</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Shared Goals / KPIs</h1>
            <p className="page-subtitle">Push department-wide KPIs to team members</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Shared Goal</button>
        </div>
      </div>
      <div className="page-body">
        {sharedGoals.length === 0 && !showCreate && (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Shared Goals</h3>
            <p className="text-muted">Create a shared KPI to push to team members</p>
          </div>
        )}

        {showCreate && (
          <div className="card mb-24">
            <h3 className="card-title mb-16">Create Shared Goal</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">UoM</label><select className="form-select" value={form.uomType} onChange={e => setForm({...form, uomType: e.target.value})}>{UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Target</label><input type="number" className="form-input" value={form.target} onChange={e => setForm({...form, target: e.target.value})} /></div>
              {form.uomType === 'TIMELINE' && <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={form.targetDate} onChange={e => setForm({...form, targetDate: e.target.value})} /></div>}
            </div>
            <div className="form-group">
              <label className="form-label">Push to Employees</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {employees.map(emp => (
                  <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: form.employeeIds.includes(emp.id) ? 'rgba(99,102,241,0.2)' : 'var(--bg)', border: `1px solid ${form.employeeIds.includes(emp.id) ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox" checked={form.employeeIds.includes(emp.id)} onChange={() => toggleEmployee(emp.id)} />
                    {emp.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSharedGoal}>Create & Push</button>
            </div>
          </div>
        )}

        {sharedGoals.map(sg => (
          <div className="card mb-16" key={sg.id}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <div style={{ fontWeight: 700 }}>{sg.title}</div>
                <div className="text-sm text-muted">{sg.description}</div>
              </div>
              <span className="badge badge-submitted">{sg.uomType.replace(/_/g, ' ')}</span>
            </div>
            <div className="text-sm text-muted mb-8">
              Created by {sg.createdBy?.name} • Target: {sg.target} • {sg.goals?.length || 0} linked employees
            </div>
            {sg.goals?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sg.goals.map(g => (
                  <span key={g.id} style={{ padding: '3px 10px', background: 'var(--bg)', borderRadius: 20, fontSize: 12 }}>
                    {g.goalSheet?.user?.name || 'Unknown'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
