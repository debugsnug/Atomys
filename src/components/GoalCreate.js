'use client';

import { useState, useEffect } from 'react';
import GoalCopilot from './GoalCopilot';
import { useAuth } from '@/context/AuthContext';
import confetti from 'canvas-confetti';

const UOM_OPTIONS = [
  { value: 'NUMERIC_MIN', label: 'Numeric (Higher is better)', hint: 'e.g., Revenue, Units Sold' },
  { value: 'NUMERIC_MAX', label: 'Numeric (Lower is better)', hint: 'e.g., TAT, Cost, Defects' },
  { value: 'PERCENT_MIN', label: '% (Higher is better)', hint: 'e.g., Test Coverage, Retention' },
  { value: 'PERCENT_MAX', label: '% (Lower is better)', hint: 'e.g., Churn Rate, Error Rate' },
  { value: 'TIMELINE', label: 'Timeline (Date-based)', hint: 'Completion date vs. Deadline' },
  { value: 'ZERO', label: 'Zero-based (Zero = Success)', hint: 'e.g., Safety Incidents, Outages' },
];

const emptyGoal = () => ({
  id: Date.now() + Math.random(),
  title: '', description: '', thrustAreaId: '', uomType: 'NUMERIC_MIN',
  target: '', targetDate: '', weightage: '',
});

export default function GoalCreate({ addToast, onNavigate }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([emptyGoal()]);
  const [thrustAreas, setThrustAreas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [existingSheet, setExistingSheet] = useState(null);

  useEffect(() => {
    fetch('/api/thrust-areas').then(r => r.json()).then(d => setThrustAreas(d.areas || []));
    fetch('/api/goals?view=my').then(r => r.json()).then(d => {
      const sheet = d.sheets?.find(s => ['DRAFT', 'RETURNED'].includes(s.status));
      if (sheet && sheet.goals.length > 0) {
        setExistingSheet(sheet);
        setGoals(sheet.goals.map(g => ({
          id: g.id, title: g.title, description: g.description,
          thrustAreaId: g.thrustAreaId || '', uomType: g.uomType,
          target: g.target, targetDate: g.targetDate || '', weightage: g.weightage,
          isSharedReadonly: g.isSharedReadonly, sharedGoalId: g.sharedGoalId,
        })));
      }
    });
  }, []);

  const totalWeightage = goals.reduce((sum, g) => sum + (parseFloat(g.weightage) || 0), 0);
  const isValid = totalWeightage === 100 && goals.length >= 1 && goals.length <= 8 &&
    goals.every(g => g.title && g.uomType && (parseFloat(g.weightage) || 0) >= 10);

  const updateGoal = (idx, field, value) => {
    setGoals(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  const addGoal = () => {
    if (goals.length >= 8) { addToast('Maximum 8 goals allowed', 'error'); return; }
    setGoals(prev => [...prev, emptyGoal()]);
  };

  const removeGoal = (idx) => {
    if (goals.length <= 1) return;
    setGoals(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddSuggestedGoal = (suggestion) => {
    if (goals.length >= 8) { addToast('Maximum 8 goals allowed', 'error'); return; }
    
    // If we only have one empty goal, replace it instead of appending
    if (goals.length === 1 && !goals[0].title && !goals[0].description) {
      setGoals([{ ...emptyGoal(), ...suggestion }]);
    } else {
      setGoals(prev => [...prev, { ...emptyGoal(), ...suggestion }]);
    }
    addToast('AI Suggestion Added', 'success');
  };

  const saveGoals = async (submit = false) => {
    if (submit && !isValid) { addToast('Please fix validation errors before submitting', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      });
      const data = await res.json();
      if (!res.ok) { addToast(data.error, 'error'); setSaving(false); return; }

      if (submit) {
        const subRes = await fetch('/api/goals/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetId: data.sheetId }),
        });
        const subData = await subRes.json();
        if (!subRes.ok) { addToast(subData.error, 'error'); setSaving(false); return; }
        
        // Celebration animation on successful submission
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4a017', '#e8b930', '#b8860b', '#f5d060']
        });
        
        addToast('Goal sheet submitted for approval!', 'success');
        setTimeout(() => onNavigate('my-goals'), 1500); // Give them time to see the confetti
      } else {
        addToast('Goals saved as draft', 'success');
      }
    } catch { addToast('Failed to save goals', 'error'); }
    setSaving(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Create Goal Sheet</h1>
            <p className="page-subtitle">Cycle 2025-26 • Define your goals and weightages</p>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-outline" onClick={() => saveGoals(false)} disabled={saving}>Save Draft</button>
            <button className="btn btn-primary" onClick={() => saveGoals(true)} disabled={saving || !isValid}>Submit for Approval</button>
          </div>
        </div>
      </div>
      <div className="page-body">
        {existingSheet?.status === 'RETURNED' && existingSheet.returnNote && (
          <div style={{ padding: '14px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
            <strong style={{ color: 'var(--danger)' }}>! Returned by Manager:</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{existingSheet.returnNote}</span>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <GoalCopilot 
            department={user?.department?.name || 'Engineering'} 
            onAddGoal={handleAddSuggestedGoal} 
            existingGoals={goals} 
          />
        </div>

        <div className="weightage-bar">
          <div>
            <div className="text-sm text-muted">Total Weightage</div>
            <div className={`weightage-total ${totalWeightage === 100 ? 'valid' : 'invalid'}`}>
              {totalWeightage}%
            </div>
          </div>
          <div className="progress-bar" style={{ flex: 1, height: 10 }}>
            <div className={`progress-fill ${totalWeightage === 100 ? 'success' : totalWeightage > 100 ? 'danger' : 'warning'}`}
              style={{ width: `${Math.min(totalWeightage, 100)}%` }} />
          </div>
          <div className="text-sm text-muted">{goals.length}/8 Goals</div>
        </div>

        {goals.map((goal, idx) => (
          <div className="goal-row" key={goal.id}>
            <div className="goal-row-header">
              <span className="goal-number">GOAL {idx + 1}</span>
              {goal.isSharedReadonly && <span className="badge badge-submitted">Shared KPI</span>}
            </div>
            {goals.length > 1 && !goal.isSharedReadonly && (
              <button className="remove-goal" onClick={() => removeGoal(idx)}>✕</button>
            )}
            <div className="form-group">
              <label className="form-label">Goal Title *</label>
              <input className="form-input" value={goal.title} onChange={e => updateGoal(idx, 'title', e.target.value)}
                placeholder="e.g., Improve customer satisfaction score" disabled={goal.isSharedReadonly} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={goal.description} onChange={e => updateGoal(idx, 'description', e.target.value)}
                placeholder="Describe what this goal entails..." disabled={goal.isSharedReadonly} rows={2} />
            </div>
            <div className="goal-row-fields">
              <div className="form-group">
                <label className="form-label">Thrust Area</label>
                <select className="form-select" value={goal.thrustAreaId} onChange={e => updateGoal(idx, 'thrustAreaId', e.target.value ? parseInt(e.target.value) : '')}>
                  <option value="">Select...</option>
                  {thrustAreas.map(ta => <option key={ta.id} value={ta.id}>{ta.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measure *</label>
                <select className="form-select" value={goal.uomType} onChange={e => updateGoal(idx, 'uomType', e.target.value)} disabled={goal.isSharedReadonly}>
                  {UOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{goal.uomType === 'TIMELINE' ? 'Deadline' : 'Target *'}</label>
                {goal.uomType === 'TIMELINE' ? (
                  <input type="date" className="form-input" value={goal.targetDate} onChange={e => updateGoal(idx, 'targetDate', e.target.value)} disabled={goal.isSharedReadonly} />
                ) : (
                  <input type="number" className="form-input" value={goal.target} onChange={e => updateGoal(idx, 'target', e.target.value)}
                    placeholder={goal.uomType === 'ZERO' ? '0' : 'Target value'} disabled={goal.isSharedReadonly || goal.uomType === 'ZERO'} />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Weightage (%) *</label>
                <input type="number" className="form-input" value={goal.weightage} onChange={e => updateGoal(idx, 'weightage', e.target.value)}
                  min="10" max="100" placeholder="Min 10%" />
                {goal.weightage && parseFloat(goal.weightage) < 10 && <div className="form-error">Min 10%</div>}
              </div>
            </div>
          </div>
        ))}

        <button className="btn btn-outline w-full" onClick={addGoal} disabled={goals.length >= 8}
          style={{ justifyContent: 'center', marginTop: 8, padding: '14px', borderStyle: 'dashed' }}>
          + Add Goal {goals.length >= 8 ? '(Max reached)' : ''}
        </button>
      </div>
    </div>
  );
}
