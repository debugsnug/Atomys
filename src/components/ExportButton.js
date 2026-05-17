'use client';

export default function ExportButton({ data, filename, columns }) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Create CSV header
    const header = columns.map(c => `"${c.label}"`).join(',');
    
    // Create CSV rows
    const rows = data.map(row => 
      columns.map(c => {
        let value = row[c.key];
        // Handle nested or formatted values if a formatter is provided
        if (c.formatter) value = c.formatter(value, row);
        
        // Escape quotes and wrap in quotes to handle commas within data
        const safeValue = value !== null && value !== undefined 
          ? String(value).replace(/"/g, '""') 
          : '';
        return `"${safeValue}"`;
      }).join(',')
    );

    const csvContent = [header, ...rows].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="btn btn-outline btn-sm"
      style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--border)' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Export CSV
    </button>
  );
}
