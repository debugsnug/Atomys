'use client';

import { useState, useEffect, useRef } from 'react';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'approval', title: 'Goal Sheet Approved', message: 'Your FY 2025 goal sheet has been approved by Vikram Patel.', time: '2 min ago', unread: true },
  { id: 2, type: 'reminder', title: 'Q1 Check-in Due', message: 'Quarterly check-in window closes in 3 days. Update your achievements now.', time: '1 hr ago', unread: true },
  { id: 3, type: 'sync', title: 'Shared Goal Updated', message: 'BLDC Motor Defect Rate goal was synced to 4 linked sheets.', time: '3 hrs ago', unread: true },
  { id: 4, type: 'escalation', title: 'Escalation Resolved', message: 'Your escalation regarding Q2 targets has been resolved by HR.', time: '1 day ago', unread: false },
  { id: 5, type: 'return', title: 'Goal Sheet Returned', message: 'Vikram Patel returned your sheet with feedback: "Add IoT latency metric."', time: '2 days ago', unread: false },
];

const TYPE_COLORS = {
  approval: 'var(--success)',
  reminder: 'var(--warning)',
  sync: 'var(--primary)',
  escalation: 'var(--danger)',
  return: 'var(--warning)',
};

const TYPE_SVGS = {
  approval: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  reminder: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  sync: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  escalation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  return: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>,
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="notif-bell" onClick={() => setOpen(!open)} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown" style={{ left: 0, right: 'auto', width: 340 }}>
          <div className="notif-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: `color-mix(in srgb, ${TYPE_COLORS[n.type]} 12%, transparent)`,
                  color: TYPE_COLORS[n.type],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2,
                }}>
                  {TYPE_SVGS[n.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

