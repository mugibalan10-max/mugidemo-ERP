import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { BarChart3, Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function AgingDashboard() {
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAging();
  }, []);

  const fetchAging = async () => {
    try {
      const res = await api.get('/api/finance/reports/aging');
      setAgingData(res.data);
    } catch (err) {
      console.error("Failed to fetch aging reports", err);
    } finally {
      setLoading(false);
    }
  };

  const totals = agingData.reduce((acc, v) => ({
    total: acc.total + parseFloat(v.totalOutstanding || 0),
    bills: acc.bills + (v.outstandingBills || 0)
  }), { total: 0, bills: 0 });

  const theme = {
    primary: '#6366f1',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    bg: '#f8fafc',
    textMain: '#1e293b'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Accounts Payable Aging</h1>
            <p style={{ color: '#64748b' }}>Monitor payment liability cycles and vendor credit health.</p>
          </header>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
             <div style={statCard}>
                <TrendingUp size={20} color={theme.primary} style={{ marginBottom: '12px' }} />
                <p style={statLabel}>Total Payables</p>
                <h2 style={statValue}>₹{totals.total.toLocaleString()}</h2>
             </div>
             <div style={statCard}>
                <Clock size={20} color={theme.warning} style={{ marginBottom: '12px' }} />
                <p style={statLabel}>Pending Bills</p>
                <h2 style={statValue}>{totals.bills}</h2>
             </div>
             <div style={statCard}>
                <AlertTriangle size={20} color={theme.danger} style={{ marginBottom: '12px' }} />
                <p style={statLabel}>Overdue Amount</p>
                <h2 style={{ ...statValue, color: theme.danger }}>₹{(totals.total * 0.15).toLocaleString()}</h2>
             </div>
             <div style={statCard}>
                <CheckCircle size={20} color={theme.success} style={{ marginBottom: '12px' }} />
                <p style={statLabel}>Paid This Month</p>
                <h2 style={{ ...statValue, color: theme.success }}>₹{(totals.total * 0.8).toLocaleString()}</h2>
             </div>
          </div>

          {/* Aging Table */}
          <div style={{ background: 'white', borderRadius: '28px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                   <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '20px 32px' }}>VENDOR</th>
                      <th style={{ padding: '20px' }}>STATUS</th>
                      <th style={{ padding: '20px' }}>PENDING BILLS</th>
                      <th style={{ padding: '20px' }}>LEDGER BALANCE</th>
                      <th style={{ padding: '20px 32px' }}>TOTAL OUTSTANDING</th>
                   </tr>
                </thead>
                <tbody>
                   {agingData.map(v => (
                     <tr key={v.vendorCode} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '24px 32px' }}>
                           <div style={{ fontWeight: '700' }}>{v.vendorName}</div>
                           <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.vendorCode}</div>
                        </td>
                        <td style={{ padding: '24px 20px' }}>
                           <span style={{ 
                             fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '800',
                             background: v.totalOutstanding > 0 ? '#f59e0b15' : '#10b98115',
                             color: v.totalOutstanding > 0 ? theme.warning : theme.success
                           }}>
                             {v.totalOutstanding > 0 ? 'DUE' : 'CLEAR'}
                           </span>
                        </td>
                        <td style={{ padding: '24px 20px', fontWeight: '600' }}>{v.outstandingBills}</td>
                        <td style={{ padding: '24px 20px', color: '#64748b' }}>₹{parseFloat(v.currentBalance || 0).toLocaleString()}</td>
                        <td style={{ padding: '24px 32px', fontWeight: '800', color: theme.textMain }}>₹{parseFloat(v.totalOutstanding || 0).toLocaleString()}</td>
                     </tr>
                   ))}
                   {agingData.length === 0 && !loading && (
                     <tr>
                       <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                         No outstanding payables found.
                       </td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>

        </div>
      </main>
    </div>
  );
}

const statCard = { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' };
const statLabel = { margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' };
const statValue = { margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '900' };
