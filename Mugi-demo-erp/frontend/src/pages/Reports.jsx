import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    primary: '#6366f1',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#f1f5f9',
    tableHeader: '#f8fafc'
  };

  const tabs = [
    { id: 'invoices', name: 'Invoices', icon: '📄' },
    { id: 'payments', name: 'Payments', icon: '💰' },
    { id: 'employees', name: 'Employees', icon: '👥' },
    { id: 'products', name: 'Inventory', icon: '📦' },
    { id: 'payroll', name: 'Payroll', icon: '🏦' },
    { id: 'logs', name: 'Automation Logs', icon: '🤖' },
    { id: 'tally-sync', name: 'Tally Sync', icon: '🔄' }
  ];

  useEffect(() => {
    fetchReport();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/reports/${activeTab}`);
      const result = await res.json();
      if (Array.isArray(result)) {
        setData(result);
      } else {
        console.error("Report data is not an array:", result);
        setData([]);
      }
    } catch (err) {
      console.error("Failed to fetch report");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (data.length === 0) return <p style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>No data available for this report.</p>;

    const columns = Object.keys(data[0]);

    return (
      <div style={{ overflowX: 'auto', background: theme.card, borderRadius: '20px', border: `1px solid ${theme.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: theme.tableHeader }}>
              {columns.map(col => (
                <th key={col} style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {col.replace(/([A-Z])/g, ' $1').replace(/_([a-z])/g, ' $1')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${theme.border}`, transition: 'background 0.2s' }}>
                {columns.map(col => {
                  let cellContent = typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col]);
                  let customStyle = { padding: '16px 24px', fontSize: '0.9rem', color: theme.textMain };

                  if (col === 'status' && activeTab === 'tally-sync') {
                    const statusColors = {
                      'QUEUED': { bg: '#fef3c7', text: '#92400e', label: '🟡 Queued' },
                      'PROCESSING': { bg: '#dbeafe', text: '#1e40af', label: '🔵 Syncing...' },
                      'SUCCESS': { bg: '#dcfce7', text: '#166534', label: '🟢 Synced' },
                      'FAILED': { bg: '#fee2e2', text: '#991b1b', label: '🔴 Failed' }
                    };
                    const config = statusColors[row[col]] || { bg: '#f1f5f9', text: '#475569', label: row[col] };
                    return (
                      <td key={col} style={customStyle}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: '700', 
                          background: config.bg, 
                          color: config.text,
                          display: 'inline-block'
                        }}>
                          {config.label}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={col} style={customStyle}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Financial Reports</h1>
            <p style={{ color: theme.textMuted }}>Comprehensive data overview for all business modules.</p>
          </header>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#e2e8f080', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === tab.id ? theme.card : 'transparent',
                  color: activeTab === tab.id ? theme.primary : theme.textMuted,
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tab.icon}</span> {tab.name}
              </button>
            ))}
          </div>

          {/* Report Data Area */}
          <div>
            {loading ? (
              <div style={{ padding: '100px', textAlign: 'center' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: `4px solid ${theme.border}`, 
                  borderTop: `4px solid ${theme.primary}`, 
                  borderRadius: '50%',
                  margin: '0 auto',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '20px', color: theme.textMuted, fontWeight: '600' }}>Generating Report...</p>
              </div>
            ) : (
              renderTable()
            )}
          </div>

          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              tr:hover {
                background: #f8fafc;
              }
            `}
          </style>

        </div>
      </div>
    </div>
  );
}
