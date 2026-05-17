'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginPage from './LoginPage';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import GoalCreate from './GoalCreate';
import GoalView from './GoalView';
import TeamReview from './TeamReview';
import QuarterlyUpdate from './QuarterlyUpdate';
import SharedGoals from './SharedGoals';
import AdminPanel from './AdminPanel';
import Reports from './Reports';
import AuditLogs from './AuditLogs';
import Analytics from './Analytics';
import Escalations from './Escalations';
import Toast from './Toast';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';

export default function AppShell() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [pageKey, setPageKey] = useState(0);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // Wrap navigation so each page change triggers a transition
  const navigate = useCallback((page) => {
    setCurrentPage(page);
    setPageKey(k => k + 1);
  }, []);

  // Spotlight hover effect: track mouse position on cards globally
  useEffect(() => {
    const handler = (e) => {
      const cards = document.querySelectorAll('.card, .stat-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        {/* Skeleton loading screen */}
        <div style={{ width: 400, padding: 40 }}>
          <div className="skeleton skeleton-circle" style={{ margin: '0 auto 20px' }} />
          <div className="skeleton skeleton-text long" />
          <div className="skeleton skeleton-text medium" />
          <div className="skeleton skeleton-text short" />
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard addToast={addToast} />;
      case 'create-goals': return <GoalCreate addToast={addToast} onNavigate={navigate} />;
      case 'my-goals': return <GoalView addToast={addToast} onNavigate={navigate} />;
      case 'quarterly-update': return <QuarterlyUpdate addToast={addToast} />;
      case 'team-review': return <TeamReview addToast={addToast} />;
      case 'shared-goals': return <SharedGoals addToast={addToast} />;
      case 'admin': return <AdminPanel addToast={addToast} />;
      case 'reports': return <Reports addToast={addToast} />;
      case 'analytics': return <Analytics />;
      case 'escalations': return <Escalations addToast={addToast} />;
      case 'audit-logs': return <AuditLogs />;
      default: return <Dashboard addToast={addToast} />;
    }
  };

  return (
    <>
      {/* Aurora ambient glow */}
      <div className="aurora-bg">
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>

      <div className="app-layout">
        <Sidebar currentPage={currentPage} onNavigate={navigate} />
        <main className="main-content">
          <div className="page-transition" key={pageKey}>
            {renderPage()}
          </div>
        </main>
        <Toast toasts={toasts} />
        <CommandPalette onNavigate={navigate} role={user?.role} />
      </div>
    </>
  );
}

