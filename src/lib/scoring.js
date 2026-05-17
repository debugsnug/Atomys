/**
 * Score computation engine for all UoM types
 */

export function computeScore(uomType, target, actual, targetDate, completionDate) {
  switch (uomType) {
    case 'NUMERIC_MIN':
    case 'PERCENT_MIN':
      // Higher is better: Achievement / Target * 100
      if (target === 0) return actual > 0 ? 100 : 0;
      return Math.min(Math.round((actual / target) * 100 * 100) / 100, 150); // Cap at 150%

    case 'NUMERIC_MAX':
    case 'PERCENT_MAX':
      // Lower is better: Target / Achievement * 100
      if (actual === 0) return target === 0 ? 100 : 150; // If achieved 0 and target was > 0, perfect
      return Math.min(Math.round((target / actual) * 100 * 100) / 100, 150);

    case 'TIMELINE':
      // Date-based: compare completion date to deadline
      if (!completionDate || !targetDate) return 0;
      const deadline = new Date(targetDate);
      const completed = new Date(completionDate);
      if (completed <= deadline) return 100;
      // Penalty for late: lose 10% per week late
      const daysLate = Math.floor((completed - deadline) / (1000 * 60 * 60 * 24));
      const weeksLate = Math.ceil(daysLate / 7);
      return Math.max(0, 100 - weeksLate * 10);

    case 'ZERO':
      // Zero = 100%, anything else = 0%
      return actual === 0 ? 100 : 0;

    default:
      return 0;
  }
}

export function getUomLabel(uomType) {
  const labels = {
    NUMERIC_MIN: 'Numeric (Higher is better)',
    NUMERIC_MAX: 'Numeric (Lower is better)',
    PERCENT_MIN: '% (Higher is better)',
    PERCENT_MAX: '% (Lower is better)',
    TIMELINE: 'Timeline (Date-based)',
    ZERO: 'Zero-based (Zero = Success)',
  };
  return labels[uomType] || uomType;
}

export function getStatusColor(status) {
  switch (status) {
    case 'NOT_STARTED': return '#94a3b8';
    case 'ON_TRACK': return '#10b981';
    case 'COMPLETED': return '#6366f1';
    default: return '#94a3b8';
  }
}

export function getSheetStatusColor(status) {
  switch (status) {
    case 'DRAFT': return '#94a3b8';
    case 'SUBMITTED': return '#f59e0b';
    case 'APPROVED': return '#10b981';
    case 'RETURNED': return '#ef4444';
    default: return '#94a3b8';
  }
}
