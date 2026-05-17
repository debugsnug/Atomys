'use client';

import { useState } from 'react';

const ROLE_GOALS = {
  Engineering: [
    { title: 'Improve BLDC Motor Efficiency', description: 'Increase motor efficiency by 5% for the new ceiling fan line', uomType: 'PERCENT_MIN', target: 5, thrustArea: 'Innovation' },
    { title: 'IoT App Latency', description: 'Reduce IoT app control latency to under 150ms', uomType: 'NUMERIC_MAX', target: 150, thrustArea: 'Customer Satisfaction' },
    { title: 'Zero Critical Firmware Bugs', description: 'Maintain zero critical CVEs in smart fan firmware', uomType: 'ZERO', target: 0, thrustArea: 'Code Quality' },
    { title: 'New Appliance R&D', description: 'Deliver 3 working prototypes for mixer grinders', uomType: 'NUMERIC_MIN', target: 3, thrustArea: 'Product Development' },
  ],
  Sales: [
    { title: 'Q3 Season Retail Revenue', description: 'Achieve retail sales revenue of ₹50Cr during Q3 peak season', uomType: 'NUMERIC_MIN', target: 500000000, thrustArea: 'Revenue Growth' },
    { title: 'Expand E-commerce Reach', description: 'Increase Amazon/Flipkart market share by 15%', uomType: 'PERCENT_MIN', target: 15, thrustArea: 'Revenue Growth' },
    { title: 'B2B Builder Acquisitions', description: 'Onboard 20 new enterprise real estate developers', uomType: 'NUMERIC_MIN', target: 20, thrustArea: 'Revenue Growth' },
    { title: 'Customer NPS Score', description: 'Achieve Net Promoter Score of 75+ for fan installations', uomType: 'NUMERIC_MIN', target: 75, thrustArea: 'Customer Satisfaction' },
  ],
  'Human Resources': [
    { title: 'Manufacturing Plant Hiring', description: 'Reduce time-to-hire for assembly line workers to 15 days', uomType: 'NUMERIC_MAX', target: 15, thrustArea: 'Operational Excellence' },
    { title: 'Employee Safety Training', description: 'Ensure 100% factory staff complete safety protocols', uomType: 'PERCENT_MIN', target: 100, thrustArea: 'Employee Experience' },
    { title: 'Attrition Rate Control', description: 'Keep voluntary attrition in corporate below 10%', uomType: 'PERCENT_MAX', target: 10, thrustArea: 'Employee Experience' },
  ],
  Operations: [
    { title: 'Reduce BLDC Motor Defect Rate', description: 'Bring defect rate down to <0.5%', uomType: 'NUMERIC_MAX', target: 0.5, thrustArea: 'Operational Excellence' },
    { title: 'On-Time Delivery (Q3 Season)', description: 'Achieve 95% on-time delivery for Q3 festive season', uomType: 'PERCENT_MIN', target: 95, thrustArea: 'Customer Satisfaction' },
    { title: 'Supply Chain Optimization', description: 'Reduce PCB component procurement costs by 8%', uomType: 'PERCENT_MIN', target: 8, thrustArea: 'Revenue Growth' },
    { title: 'Zero Factory Incidents', description: 'Maintain zero workplace safety incidents at the Pune plant', uomType: 'ZERO', target: 0, thrustArea: 'Operational Excellence' },
  ],
};

export default function GoalCopilot({ department, onAddGoal, existingGoals = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState([]);

  const deptName = department || 'Engineering';
  const suggestions = ROLE_GOALS[deptName] || ROLE_GOALS['Engineering'];

  // Filter out goals that are already added
  const existingTitles = existingGoals.map(g => g.title?.toLowerCase());
  const available = suggestions.filter(s => !existingTitles.includes(s.title.toLowerCase()));

  const toggleGoal = (idx) => {
    setSelectedGoals(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const addSelected = () => {
    selectedGoals.forEach(idx => {
      if (available[idx]) onAddGoal(available[idx]);
    });
    setSelectedGoals([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-outline"
        style={{
          borderColor: 'var(--primary)',
          color: 'var(--primary)',
          gap: 8,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
          <line x1="9" y1="21" x2="15" y2="21"/>
        </svg>
        AI Goal Suggestions
      </button>
    );
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--primary)',
      borderRadius: 'var(--radius)',
      padding: 20,
      marginBottom: 16,
      animation: 'slideUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
            AI-Suggested Goals for {deptName}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Select goals to add to your sheet. Targets and UoM are pre-configured.
          </p>
        </div>
        <button onClick={() => { setIsOpen(false); setSelectedGoals([]); }} className="btn btn-ghost btn-sm">Close</button>
      </div>

      {available.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
          All suggested goals have been added to your sheet.
        </p>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {available.map((goal, idx) => (
              <div
                key={idx}
                onClick={() => toggleGoal(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '10px 12px',
                  background: selectedGoals.includes(idx) ? 'rgba(212,160,23,0.08)' : 'var(--bg)',
                  border: `1px solid ${selectedGoals.includes(idx) ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, marginTop: 1,
                  border: `2px solid ${selectedGoals.includes(idx) ? 'var(--primary)' : '#444'}`,
                  background: selectedGoals.includes(idx) ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s ease',
                }}>
                  {selectedGoals.includes(idx) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{goal.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{goal.description}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span className="badge badge-submitted" style={{ fontSize: 9 }}>{goal.uomType.replace('_', ' ')}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Target: {goal.target}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{goal.thrustArea}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <button onClick={() => { setIsOpen(false); setSelectedGoals([]); }} className="btn btn-ghost btn-sm">Cancel</button>
            <button
              onClick={addSelected}
              disabled={selectedGoals.length === 0}
              className="btn btn-primary btn-sm"
            >
              Add {selectedGoals.length} Goal{selectedGoals.length !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
