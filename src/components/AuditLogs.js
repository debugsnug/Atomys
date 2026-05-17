'use client';

import { useState, useEffect } from 'react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/audit').then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Trail</h1>
        <p className="page-subtitle">Complete log of all system changes</p>
      </div>
      <div className="page-body">
        {loading ? <div className="spinner" /> : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Audit Logs</h3>
            <p className="text-muted">System activity will appear here</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>Old Value</th><th>New Value</th></tr></thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                      <td><strong>{log.user?.name}</strong><div className="text-sm text-muted">{log.user?.email}</div></td>
                      <td><span className="badge badge-submitted">{log.action.replace(/_/g, ' ')}</span></td>
                      <td className="text-sm">{log.details || '—'}</td>
                      <td className="text-sm">{log.oldValue || '—'}</td>
                      <td className="text-sm">{log.newValue || '—'}</td>
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
