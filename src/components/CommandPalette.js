'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', hint: 'Overview & KPIs', section: 'Navigation', icon: 'grid' },
  { id: 'create-goals', label: 'Create New Goals', hint: 'Start a new goal sheet', section: 'Navigation', icon: 'plus' },
  { id: 'my-goals', label: 'View My Goal Sheet', hint: 'Review your submitted goals', section: 'Navigation', icon: 'target' },
  { id: 'quarterly-update', label: 'Quarterly Check-in', hint: 'Update Q1–Q4 achievements', section: 'Navigation', icon: 'trending' },
  { id: 'team-review', label: 'Team Review', hint: 'Approve or return goal sheets', section: 'Navigation', icon: 'users' },
  { id: 'shared-goals', label: 'Shared Goals', hint: 'Cross-team shared objectives', section: 'Navigation', icon: 'link' },
  { id: 'analytics', label: 'Analytics Dashboard', hint: 'Charts, heatmaps & insights', section: 'Navigation', icon: 'chart' },
  { id: 'reports', label: 'Export Reports', hint: 'CSV & Excel downloads', section: 'Navigation', icon: 'download' },
  { id: 'admin', label: 'Admin Panel', hint: 'Cycles, users & governance', section: 'Navigation', icon: 'settings' },
  { id: 'escalations', label: 'Escalations', hint: 'Raise or resolve conflicts', section: 'Navigation', icon: 'alert' },
  { id: 'audit-logs', label: 'Audit Trail', hint: 'Full action history', section: 'Navigation', icon: 'scroll' },
];

const ICONS = {
  grid: <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  trending: <svg viewBox="0 0 24 24" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  link: <svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  scroll: <svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

export default function CommandPalette({ onNavigate, role }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  // Filter commands by role
  const roleFiltered = COMMANDS.filter(c => {
    if (role === 'EMPLOYEE') return !['team-review', 'admin', 'escalations', 'audit-logs'].includes(c.id);
    if (role === 'MANAGER') return !['admin', 'audit-logs', 'create-goals', 'my-goals', 'quarterly-update'].includes(c.id);
    return true; // ADMIN sees all
  });

  const filtered = roleFiltered.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.hint.toLowerCase().includes(query.toLowerCase())
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery('');
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  const handleSelect = useCallback((id) => {
    onNavigate(id);
    handleClose();
  }, [onNavigate, handleClose]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open ? handleClose() : handleOpen();
      }
      if (e.key === 'Escape' && open) handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleOpen, handleClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      handleSelect(filtered[activeIdx].id);
    }
  };

  if (!open) return null;

  return (
    <div className="cmd-overlay" onClick={handleClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          {ICONS.search}
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Search pages, actions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyDown}
          />
          <span className="cmd-kbd">ESC</span>
        </div>
        <div className="cmd-results">
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map((cmd, idx) => (
            <button
              key={cmd.id}
              className={`cmd-item ${idx === activeIdx ? 'active' : ''}`}
              onClick={() => handleSelect(cmd.id)}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <div className="cmd-icon">{ICONS[cmd.icon]}</div>
              <div style={{ flex: 1 }}>
                <div className="cmd-label">{cmd.label}</div>
                <div className="cmd-hint">{cmd.hint}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="cmd-footer">
          <span><span className="cmd-kbd">↑↓</span> Navigate</span>
          <span><span className="cmd-kbd">↵</span> Select</span>
          <span><span className="cmd-kbd">Esc</span> Close</span>
        </div>
      </div>
    </div>
  );
}
