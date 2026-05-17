'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const SSO_ERROR_MESSAGES = {
  sso_failed: 'Microsoft sign-in was cancelled or failed. Please try again.',
  sso_callback_failed: 'SSO authentication error. Contact your IT admin.',
  no_code: 'Microsoft did not return an auth code. Try again.',
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoAvailable, setSsoAvailable] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    // Show SSO errors returned from the callback redirect
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err && SSO_ERROR_MESSAGES[err]) setError(SSO_ERROR_MESSAGES[err]);

    // Check if Azure AD is configured on the server
    fetch('/api/auth/sso-status').then(r => r.json()).then(d => {
      setSsoAvailable(!!d.enabled);
    }).catch(() => setSsoAvailable(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  const quickLogin = async (role) => {
    const emails = { employee: 'employee@demo.com', manager: 'manager@demo.com', admin: 'admin@demo.com' };
    setEmail(emails[role]);
    setPassword('demo123');
    setLoading(true);
    const result = await login(emails[role], 'demo123');
    if (!result.success) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <img src="/atomys-logo.png" alt="ATOMYS" style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 12 }} />
        </div>
        <h1 className="login-title">ATOMYS</h1>
        <p className="login-subtitle">Goal Setting & Tracking Portal</p>

        {error && <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.12)', borderRadius: 6, color: '#f87171', fontSize: 13, marginBottom: 14, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@atomberg.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Microsoft Entra ID SSO */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: '#222' }} />
            <span style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#222' }} />
          </div>
          <button
            onClick={() => { setSsoLoading(true); window.location.href = '/api/auth/azure'; }}
            disabled={ssoLoading}
            className="btn btn-outline w-full"
            style={{ justifyContent: 'center', gap: 10, padding: '10px 16px', fontSize: 13, position: 'relative' }}
          >
            <svg width="18" height="18" viewBox="0 0 23 23" fill="none">
              <path d="M1 1h10v10H1z" fill="#f25022"/>
              <path d="M12 1h10v10H12z" fill="#7fba00"/>
              <path d="M1 12h10v10H1z" fill="#00a4ef"/>
              <path d="M12 12h10v10H12z" fill="#ffb900"/>
            </svg>
            {ssoLoading ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
            {ssoAvailable && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--success)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 10 }}>LIVE</span>
            )}
          </button>
          {!ssoAvailable && (
            <p style={{ fontSize: 10, color: '#444', marginTop: 6 }}>
              Azure AD not configured — set <code style={{ color: '#666' }}>AZURE_AD_CLIENT_ID</code> in .env to enable
            </p>
          )}
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1a1a1a' }}>
          <p style={{ fontSize: 10, color: '#555', textAlign: 'center', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Demo Access</p>
          <p style={{ fontSize: 11, color: 'var(--primary)', textAlign: 'center', marginBottom: 10 }}>Use these 1-click buttons for quick role-based evaluation.</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => quickLogin('employee')} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Employee</button>
            <button onClick={() => quickLogin('manager')} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Manager</button>
            <button onClick={() => quickLogin('admin')} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Admin</button>
          </div>
        </div>

        <p style={{ fontSize: 10, color: '#333', textAlign: 'center', marginTop: 20 }}>
          Powered by Atomberg Technologies
        </p>
      </div>
    </div>
  );
}
