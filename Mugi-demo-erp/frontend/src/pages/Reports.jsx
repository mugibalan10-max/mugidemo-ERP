import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  CreditCard, 
  FileText, 
  Users, 
  Package, 
  Briefcase, 
  Activity, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('invoices');
  const [data, setData] = useState([]);
  const [quarterly, setQuarterly] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = {
    primary: '#1e40af', // Deep Corporate Blue
    primaryLight: '#dbeafe',
    secondary: '#3b82f6',
    success: '#059669',
    successLight: '#d1fae5',
    warning: '#d97706',
    warningLight: '#fef3c7',
    danger: '#dc2626',
    dangerLight: '#fee2e2',
    bg: '#f4f7fb',
    card: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    tableHeader: '#f8fafc'
  };

  const tabs = [
    { id: 'invoices', name: 'Sales & Invoices', icon: <FileText size={18} /> },
    { id: 'payments', name: 'Cash Receipts', icon: <Wallet size={18} /> },
    { id: 'employees', name: 'Headcount', icon: <Users size={18} /> },
    { id: 'products', name: 'Inventory Val.', icon: <Package size={18} /> },
    { id: 'payroll', name: 'Payroll Ledger', icon: <Briefcase size={18} /> },
    { id: 'tally-sync', name: 'Tally Integrations', icon: <RefreshCw size={18} /> },
    { id: 'logs', name: 'Audit Trail', icon: <Activity size={18} /> }
  ];

  useEffect(() => {
    fetchQuarterlySummary();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchQuarterlySummary = async () => {
    try {
      const res = await api.get('/api/reports/quarterly');
      if (res.data.success) {
        setQuarterly(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch quarterly summary", err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/reports/${activeTab}`);
      const result = res.data;
      if (Array.isArray(result)) {
        setData(result);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to fetch report");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return alert("No data to export.");
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(col => typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]));
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Mugi_ERP_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = () => {
    if (data.length === 0) return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
        <BarChart3 size={48} color={theme.border} style={{ margin: '0 auto', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px 0', color: theme.textMain }}>No Records Found</h3>
        <p style={{ margin: 0, color: theme.textMuted }}>There is no data available for the selected reporting period.</p>
      </div>
    );

    // Filter out some internal fields for cleaner UI
    let columns = Object.keys(data[0]).filter(col => !['id', 'password', 'createdAt', 'updatedAt'].includes(col));
    
    // Bring important fields to front
    if (columns.includes('status')) {
      columns = ['status', ...columns.filter(c => c !== 'status')];
    }
    if (columns.includes('name')) {
      columns = ['name', ...columns.filter(c => c !== 'name')];
    }

    return (
      <div style={{ overflowX: 'auto', background: theme.card, borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ background: theme.tableHeader, borderBottom: `2px solid ${theme.border}` }}>
              {columns.map(col => (
                <th key={col} style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {col.replace(/([A-Z])/g, ' $1').replace(/_([a-z])/g, ' $1')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: i === data.length - 1 ? 'none' : `1px solid ${theme.border}`, transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                {columns.map(col => {
                  let cellContent = typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col] ?? '-');
                  let customStyle = { padding: '16px 24px', fontSize: '0.85rem', color: theme.textMain, fontWeight: '500' };

                  // Currency Formatting
                  if (['total', 'amount', 'salary', 'subtotal', 'balanceAmount', 'netSalary', 'price'].includes(col) && row[col] !== null) {
                    cellContent = `₹${parseFloat(row[col]).toLocaleString()}`;
                    customStyle.fontWeight = '700';
                  }

                  // Status Pill Formatting
                  if (col === 'status' || col === 'approvalStatus') {
                    const statusColors = {
                      'QUEUED': { bg: theme.warningLight, text: theme.warning },
                      'PROCESSING': { bg: theme.primaryLight, text: theme.primary },
                      'SUCCESS': { bg: theme.successLight, text: theme.success },
                      'FAILED': { bg: theme.dangerLight, text: theme.danger },
                      'Active': { bg: theme.successLight, text: theme.success },
                      'Paid': { bg: theme.successLight, text: theme.success },
                      'Draft': { bg: '#f1f5f9', text: '#64748b' },
                      'Pending': { bg: theme.warningLight, text: theme.warning },
                      'Approved': { bg: theme.primaryLight, text: theme.primary },
                    };
                    const config = statusColors[row[col]] || { bg: '#f1f5f9', text: '#475569' };
                    return (
                      <td key={col} style={customStyle}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '99px', 
                          fontSize: '0.75rem', 
                          fontWeight: '800', 
                          background: config.bg, 
                          color: config.text,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {row[col]}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td key={col} style={customStyle}>
                      {cellContent.length > 50 ? cellContent.substring(0, 50) + '...' : cellContent}
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
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', height: '100vh', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.secondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Analytics & Reporting</span>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: theme.textMain, margin: 0 }}>Financial Intelligence</h1>
              <p style={{ color: theme.textMuted, fontSize: '1.1rem', marginTop: '8px' }}>Enterprise-grade performance metrics, compliance tracking, and operational ledgers.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                onClick={exportCSV}
                style={{ padding: '14px 24px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.2)' }}
                >
                <Download size={18} /> Export Current View
                </button>
            </div>
          </header>

          {/* KPI Dashboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
            
            {/* Revenue Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: theme.successLight, borderRadius: '50%', opacity: 0.5, zIndex: 0 }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>YTD Bookings (Revenue)</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.textMain }}>₹{quarterly?.summary?.totalRevenue?.toLocaleString() || '0'}</div>
                </div>
                <div style={{ background: theme.successLight, padding: '12px', borderRadius: '12px', color: theme.success }}>
                  <TrendingUp size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.85rem', fontWeight: '600', color: theme.success, display: 'flex', alignItems: 'center', gap: '4px' }}>
                +14% <span style={{ color: theme.textMuted, fontWeight: '500' }}>vs last quarter</span>
              </div>
            </div>

            {/* Collected Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Cash Collected</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.textMain }}>₹{quarterly?.summary?.totalCollected?.toLocaleString() || '0'}</div>
                </div>
                <div style={{ background: theme.primaryLight, padding: '12px', borderRadius: '12px', color: theme.primary }}>
                  <Wallet size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.85rem', fontWeight: '600', color: theme.textMuted }}>
                From {quarterly?.summary?.invoiceCount || 0} Invoices
              </div>
            </div>

            {/* Outstanding Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Accounts Receivable (AR)</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.warning }}>₹{quarterly?.summary?.outstanding?.toLocaleString() || '0'}</div>
                </div>
                <div style={{ background: theme.warningLight, padding: '12px', borderRadius: '12px', color: theme.warning }}>
                  <CreditCard size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.85rem', fontWeight: '600', color: theme.warning, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Attention needed <span style={{ color: theme.textMuted, fontWeight: '500' }}>on overdue accounts</span>
              </div>
            </div>

            {/* Expenses Card */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Operational Expense</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.textMain }}>₹{quarterly?.summary?.totalExpense?.toLocaleString() || '3,45,000'}</div>
                </div>
                <div style={{ background: theme.dangerLight, padding: '12px', borderRadius: '12px', color: theme.danger }}>
                  <BarChart3 size={24} />
                </div>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.85rem', fontWeight: '500', color: theme.textMuted }}>
                Includes Payroll & Vendor Payments
              </div>
            </div>

          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
            
            {/* Header & Tabs */}
            <div style={{ borderBottom: `1px solid ${theme.border}`, padding: '24px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontWeight: '900', fontSize: '1.5rem', color: theme.textMain }}>Master Ledger View</h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ padding: '8px 16px', background: 'white', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === tab.id ? theme.primary : 'transparent',
                        color: activeTab === tab.id ? 'white' : theme.textMuted,
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.icon} {tab.name}
                    </button>
                    ))}
                </div>
            </div>

            {/* Report Data Area */}
            <div style={{ padding: '32px', background: theme.bg }}>
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
                    <p style={{ marginTop: '20px', color: theme.textMuted, fontWeight: '700' }}>Fetching Master Records...</p>
                </div>
                ) : (
                renderTable()
                )}
            </div>

          </div>

          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                background: transparent;
              }
              ::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>

        </div>
      </div>
    </div>
  );
}
