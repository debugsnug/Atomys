'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import Leaderboard from './Leaderboard';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div><div className="page-header"><h1 className="page-title">Analytics</h1></div><div className="page-body"><div className="spinner" /></div></div>;
  if (!data) return <div><div className="page-header"><h1 className="page-title">Analytics</h1></div><div className="page-body"><p>Failed to load analytics</p></div></div>;

  const tabs = [
    { id: 'leaderboard', label: 'Top Performers' },
    { id: 'trends', label: 'QoQ Trends' },
    { id: 'distribution', label: 'Distributions' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'managers', label: 'Manager Effectiveness' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Interactive charts and insights across the organization</p>
      </div>
      <div className="page-body">
        <div className="tabs mb-16">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'trends' && <TrendsView data={data} />}
        {activeTab === 'distribution' && <DistributionView data={data} />}
        {activeTab === 'heatmap' && <HeatmapView data={data} />}
        {activeTab === 'managers' && <ManagerView data={data} />}
      </div>
    </div>
  );
}

function TrendsView({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* QoQ Average Score Trend */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>QoQ Average Achievement Score</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.qoqTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="quarter" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Line type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 6 }} activeDot={{ r: 8 }} name="Avg Score %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Completion Rate per Quarter */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Check-in Completion Rate by Quarter</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.qoqTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="quarter" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Bar dataKey="completionRate" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Completion %" />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department-wise QoQ Trends */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Department-wise QoQ Trends</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
            const row = { quarter: q };
            data.deptTrends.forEach(dept => {
              const qData = dept.quarters.find(x => x.quarter === q);
              row[dept.department] = qData?.avgScore || 0;
            });
            return row;
          })}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="quarter" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Legend />
            {data.deptTrends.map((dept, i) => (
              <Bar key={dept.department} dataKey={dept.department} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DistributionView({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Thrust Area Distribution */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Goals by Thrust Area</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data.thrustAreaDist} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#94a3b8' }}>
              {data.thrustAreaDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* UoM Type Distribution */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Goals by Unit of Measure</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.uomDist} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={120} tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} name="Goals" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Goal Status Distribution */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Goal Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data.statusDist} cx="50%" cy="50%" outerRadius={110} dataKey="count" nameKey="name" label={({ name, count }) => `${name}: ${count}`} labelLine={{ stroke: '#94a3b8' }}>
              {data.statusDist.map((entry, i) => (
                <Cell key={i} fill={entry.name === 'COMPLETED' ? '#10b981' : entry.name === 'ON TRACK' ? '#6366f1' : '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Department Employee Count */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Team Size by Department</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.deptTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="department" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Bar dataKey="employeeCount" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Employees" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HeatmapView({ data }) {
  const getHeatColor = (value) => {
    if (value >= 80) return '#10b981';
    if (value >= 60) return '#22c55e';
    if (value >= 40) return '#f59e0b';
    if (value >= 20) return '#f97316';
    if (value > 0) return '#ef4444';
    return '#334155';
  };

  return (
    <div>
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Completion Heatmap — Department × Quarter</h3>
        <p className="text-sm text-muted mb-16">Percentage of employees who completed check-ins per quarter</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th style={{ textAlign: 'center' }}>Q1</th>
                <th style={{ textAlign: 'center' }}>Q2</th>
                <th style={{ textAlign: 'center' }}>Q3</th>
                <th style={{ textAlign: 'center' }}>Q4</th>
              </tr>
            </thead>
            <tbody>
              {data.heatmapData.map(row => (
                <tr key={row.department}>
                  <td><strong>{row.department}</strong></td>
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <td key={q} style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 56, height: 40, borderRadius: 8,
                        background: getHeatColor(row[q]),
                        color: 'white', fontWeight: 700, fontSize: 14,
                      }}>
                        {row[q]}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, fontSize: 12 }}>
          <span>Legend:</span>
          {[{ label: '0%', color: '#334155' }, { label: '20%', color: '#ef4444' }, { label: '40%', color: '#f59e0b' }, { label: '60%', color: '#22c55e' }, { label: '80%+', color: '#10b981' }].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: l.color, display: 'inline-block' }} />{l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Radar chart for department comparison */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Department Performance Radar</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data.deptTrends.map(d => ({
            department: d.department,
            Q1: d.quarters[0].avgScore,
            Q2: d.quarters[1].avgScore,
            Q3: d.quarters[2].avgScore,
            Q4: d.quarters[3].avgScore,
          }))}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="department" stroke="#94a3b8" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => (
              <Radar key={q} name={q} dataKey={q} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
            ))}
            <Legend />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ManagerView({ data }) {
  return (
    <div>
      <div className="card mb-20">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Manager Check-in Effectiveness</h3>
        <p className="text-sm text-muted mb-16">Comparison of check-in completion rates across L1 managers</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.managerEffectiveness}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
            <Bar dataKey="overallRate" fill="url(#mgrGradient)" radius={[6, 6, 0, 0]} name="Overall Completion %" />
            <defs>
              <linearGradient id="mgrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed per-quarter breakdown */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quarterly Breakdown per Manager</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Manager</th>
                <th>Direct Reports</th>
                <th style={{ textAlign: 'center' }}>Q1</th>
                <th style={{ textAlign: 'center' }}>Q2</th>
                <th style={{ textAlign: 'center' }}>Q3</th>
                <th style={{ textAlign: 'center' }}>Q4</th>
                <th style={{ textAlign: 'center' }}>Overall</th>
              </tr>
            </thead>
            <tbody>
              {data.managerEffectiveness.map(m => (
                <tr key={m.name}>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.totalReports}</td>
                  {m.quarterCompletion.map(q => (
                    <td key={q.quarter} style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: q.rate >= 80 ? 'rgba(16,185,129,0.2)' : q.rate >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                        color: q.rate >= 80 ? '#10b981' : q.rate >= 50 ? '#f59e0b' : '#ef4444',
                      }}>
                        {q.completed}/{q.total}
                      </span>
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: m.overallRate >= 80 ? '#10b981' : m.overallRate >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {m.overallRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
