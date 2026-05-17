'use client';

import { useState, useEffect } from 'react';

export default function AdminPanel({ addToast }) {
  const [tab, setTab] = useState('cycles');
  const [users, setUsers] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [allSheets, setAllSheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/cycles').then(r => r.json()),
      fetch('/api/goals?view=all').then(r => r.json()),
    ]).then(([u, c, g]) => {
      setUsers(u.users || []);
      setCycles(c.cycles || []);
      setAllSheets(g.sheets || []);
      setLoading(false);
    });
  }, []);

  const toggleCycle = async (id, isActive) => {
    await fetch('/api/admin/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    setCycles(prev => prev.map(c => c.id === id ? { ...c, isActive: !isActive } : c));
    addToast('Cycle updated', 'success');
  };

  const unlockSheet = async (sheetId, userName) => {
    const res = await fetch('/api/admin/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId }),
    });
    if (res.ok) {
      addToast(`Goal sheet unlocked for ${userName}`, 'success');
      const g = await fetch('/api/goals?view=all').then(r => r.json());
      setAllSheets(g.sheets || []);
    }
  };

  if (loading) return <div><div className="page-header"><h1 className="page-title">Admin Panel</h1></div><div className="page-body"><div className="spinner" /></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage cycles, users, and goal sheets</p>
      </div>
      <div className="page-body">
        <div className="tabs mb-24">
          {['cycles', 'users', 'sheets'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'cycles' ? 'Cycles' : t === 'users' ? 'Users' : 'All Sheets'}
            </button>
          ))}
        </div>

        {tab === 'cycles' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h3 className="card-title">Cycle Management</h3>
              <p className="text-sm text-muted">Deactivating a cycle strictly enforces hard calendar lock - preventing any goal updates or approvals.</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Phase</th><th>Window</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {cycles.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td><span className="badge badge-submitted">{c.phase}</span></td>
                      <td className="text-sm">{new Date(c.windowOpen).toLocaleDateString()} — {new Date(c.windowClose).toLocaleDateString()}</td>
                      <td>{c.isActive ? <span className="badge badge-approved">Active</span> : <span className="badge badge-draft">Inactive</span>}</td>
                      <td><button className={`btn btn-sm ${c.isActive ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleCycle(c.id, c.isActive)}>{c.isActive ? 'Deactivate' : 'Activate'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Organization Hierarchy</h3></div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Manager</th><th>Goal Sheets</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td className="text-sm text-muted">{u.email}</td>
                      <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-completed' : u.role === 'MANAGER' ? 'badge-submitted' : 'badge-draft'}`}>{u.role}</span></td>
                      <td>{u.department?.name || '—'}</td>
                      <td>{u.manager?.name || '—'}</td>
                      <td>{u._count?.goalSheets || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'sheets' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h3 className="card-title">All Goal Sheets</h3>
              <p className="text-sm text-muted">Admin can force-unlock approved goal sheets to allow emergency edits by employees or managers.</p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>Goals</th><th>Submitted</th><th>Action</th></tr></thead>
                <tbody>
                  {allSheets.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.user?.name}</strong></td>
                      <td>{s.user?.department?.name || '—'}</td>
                      <td><span className={`badge badge-${s.status.toLowerCase()}`}>{s.status}</span></td>
                      <td>{s.goals?.length || 0}</td>
                      <td className="text-sm text-muted">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        {s.status === 'APPROVED' && (
                          <button className="btn btn-warning btn-sm" onClick={() => unlockSheet(s.id, s.user?.name)}>Unlock</button>
                        )}
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
