'use client';

import { useState, useEffect } from 'react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching leaderboard data or fetch from a real endpoint if we had one
    // We'll mock the data for the hackathon demo to ensure it always looks good
    const mockLeaders = [
      { id: 1, name: 'Sarah Jenkins', role: 'Senior Engineer', dept: 'Engineering', score: 98.5, streak: 4, badges: ['Top Performer', 'Early Bird'] },
      { id: 2, name: 'Rahul Desai', role: 'Sales Lead', dept: 'Sales', score: 96.2, streak: 2, badges: ['Deal Closer'] },
      { id: 3, name: 'Amit Kumar', role: 'DevOps Engineer', dept: 'Engineering', score: 94.0, streak: 3, badges: ['Infrastructure Hero'] },
      { id: 4, name: 'Priya Sharma', role: 'HR Manager', dept: 'Human Resources', score: 91.8, streak: 1, badges: [] },
      { id: 5, name: 'Neha Gupta', role: 'Product Manager', dept: 'Product', score: 89.5, streak: 5, badges: ['Visionary'] },
    ];
    
    setTimeout(() => {
      setLeaders(mockLeaders);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="spinner" style={{ margin: 0 }}></div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            Top Performers Leaderboard
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Recognizing excellence across all departments this quarter
          </p>
        </div>
        <div style={{ background: 'rgba(212,160,23,0.1)', color: 'var(--primary)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
          Q3 2025-26
        </div>
      </div>

      <div style={{ padding: '12px 24px' }}>
        {leaders.map((leader, index) => (
          <div key={leader.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '16px 0',
            borderBottom: index < leaders.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ 
              width: 32, 
              fontSize: 16, 
              fontWeight: 800, 
              color: index === 0 ? '#fdb913' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'monospace'
            }}>
              #{index + 1}
            </div>
            
            <div style={{ 
              width: 44, height: 44, 
              borderRadius: '50%', 
              background: index === 0 ? 'var(--gradient)' : 'var(--surface)',
              border: `2px solid ${index === 0 ? 'var(--primary)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700,
              color: index === 0 ? '#000' : 'var(--text)',
              margin: '0 16px 0 8px'
            }}>
              {leader.name.charAt(0)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{leader.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {leader.role} • {leader.dept}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginRight: 24 }}>
              {leader.badges.map((badge, bi) => (
                <span key={bi} style={{ 
                  fontSize: 10, 
                  fontWeight: 600, 
                  background: 'rgba(212,160,23,0.1)', 
                  color: 'var(--primary)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(212,160,23,0.2)'
                }}>
                  {badge}
                </span>
              ))}
              {leader.streak > 0 && (
                <span style={{ 
                  fontSize: 10, 
                  fontWeight: 600, 
                  background: 'rgba(249,115,22,0.1)', 
                  color: '#f97316',
                  padding: '3px 8px',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M15.09 11.02L18.73 2l-7.79 9H7.27l-3.64 9.02 7.79-9h3.67z"/>
                  </svg>
                  {leader.streak} Qtr Streak
                </span>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: index === 0 ? 'var(--primary)' : 'var(--text)' }}>
                {leader.score}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Avg Score
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
