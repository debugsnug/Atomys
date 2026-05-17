'use client';

import { useAuth } from '@/context/AuthContext';
import NotificationCenter from './NotificationCenter';

// SVG Icons as components
const icons = {
  dashboard: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  create: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  target: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  trending: <svg viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  team: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  link: <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  settings: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  alert: <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  scroll: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  clipboard: <svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  chart: <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  user: <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout: <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function Sidebar({ currentPage, onNavigate }) {
  const { user, logout, switchRole } = useAuth();

  const navItems = {
    EMPLOYEE: [
      { section: 'Goals', items: [
        { id: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
        { id: 'create-goals', icon: icons.create, label: 'Create Goals' },
        { id: 'my-goals', icon: icons.target, label: 'My Goal Sheet' },
        { id: 'quarterly-update', icon: icons.trending, label: 'Quarterly Update' },
      ]},
      { section: 'Reports', items: [
        { id: 'reports', icon: icons.clipboard, label: 'Reports' },
        { id: 'analytics', icon: icons.chart, label: 'Analytics' },
      ]},
    ],
    MANAGER: [
      { section: 'Goals', items: [
        { id: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
        { id: 'team-review', icon: icons.team, label: 'Team Review' },
        { id: 'shared-goals', icon: icons.link, label: 'Shared Goals' },
      ]},
      { section: 'Reports', items: [
        { id: 'reports', icon: icons.clipboard, label: 'Reports' },
        { id: 'analytics', icon: icons.chart, label: 'Analytics' },
      ]},
    ],
    ADMIN: [
      { section: 'Overview', items: [
        { id: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
      ]},
      { section: 'Management', items: [
        { id: 'admin', icon: icons.settings, label: 'Admin Panel' },
        { id: 'shared-goals', icon: icons.link, label: 'Shared Goals' },
        { id: 'escalations', icon: icons.alert, label: 'Escalations' },
        { id: 'audit-logs', icon: icons.scroll, label: 'Audit Trail' },
      ]},
      { section: 'Reports', items: [
        { id: 'reports', icon: icons.clipboard, label: 'Reports' },
        { id: 'analytics', icon: icons.chart, label: 'Analytics' },
      ]},
    ],
  };

  const sections = navItems[user?.role] || navItems.EMPLOYEE;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon">
              <img src="/atomys-logo.png" alt="ATOMYS" />
            </div>
            ATOMYS
          </div>
          <NotificationCenter />
        </div>
        <button
          onClick={() => { const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }); window.dispatchEvent(e); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', marginTop: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'inherit', transition: 'all 0.15s ease' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
          <span className="cmd-kbd">⌘K</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        {sections.map(sec => (
          <div className="nav-section" key={sec.section}>
            <div className="nav-section-title">{sec.section}</div>
            {sec.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0)}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm w-full" style={{ justifyContent: 'center', gap: 6 }}>
          <span className="nav-icon">{icons.logout}</span>
          Sign Out
        </button>
      </div>

      <div className="role-switcher">
        {['EMPLOYEE', 'MANAGER', 'ADMIN'].map(role => (
          <button
            key={role}
            className={`role-btn ${user?.role === role ? 'active' : ''}`}
            onClick={() => { switchRole(role); onNavigate('dashboard'); }}
          >
            {role.slice(0, 3)}
          </button>
        ))}
      </div>
    </aside>
  );
}
