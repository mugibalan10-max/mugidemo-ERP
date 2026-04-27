import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Bell, 
  Search, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  MoreVertical
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalInventory: 0,
    pendingPayments: 0,
    approvalQueue: [],
    pendingCount: 0
  });

  const [recentLogs, setRecentLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tallyStatus, setTallyStatus] = useState('checking'); 

  useEffect(() => {
    fetchDashboardData();
    checkTallyStatus();
    const interval = setInterval(checkTallyStatus, 10000); 
    return () => clearInterval(interval);
  }, []);

  const checkTallyStatus = async () => {
    try {
      const res = await api.get("/api/tally/status");
      setTallyStatus(res.data.connected ? 'connected' : 'disconnected');
    } catch (err) {
      setTallyStatus('disconnected');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/api/dashboard/stats");
      const data = res.data;
      
      setStats({
        totalSales: data.totalInvoiced,
        totalOrders: data.purchaseOrders,
        totalInventory: data.stockValuation,
        pendingPayments: data.vendorPayables,
        approvalQueue: data.approvalQueue || [],
        pendingCount: data.pendingCount || 0
      });

      if (data.logs) {
        setRecentLogs(data.logs);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await api.get("/api/reports/quarterly");
      const result = res.data;
      
      if (result.success) {
        alert(
          `📊 QUARTERLY REPORT GENERATED: ${result.period}\n\n` +
          `• Total Revenue: ₹${result.summary.totalRevenue.toLocaleString()}\n` +
          `• Invoices Sent: ${result.summary.invoiceCount}\n` +
          `• Total Collected: ₹${result.summary.totalCollected.toLocaleString()}\n` +
          `• Outstanding Balance: ₹${result.summary.outstanding.toLocaleString()}\n\n` +
          `Status: SUCCESS`
        );
      } else {
        alert("Failed to generate report.");
      }
    } catch (err) {
      alert("Error generating report: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const kpiData = [
    { label: 'Total Invoiced', value: `₹${parseFloat(stats.totalSales || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#6366f1', trend: '+12.5%' },
    { label: 'Purchase Orders', value: stats.totalOrders || 0, icon: <ShoppingBag size={24} />, color: '#10b981', trend: '+4.2%' },
    { label: 'Stock Valuation', value: `₹${parseFloat(stats.totalInventory || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#f59e0b', trend: '-2.1%' },
    { label: 'Vendor Payables', value: `₹${parseFloat(stats.pendingPayments || 0).toLocaleString()}`, icon: <CreditCard size={24} />, color: '#ef4444', trend: '+8.3%' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        <header style={{
          height: '80px',
          minHeight: '80px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              placeholder="Quick search commands, customers, or reports..." 
              style={{ padding: '12px 16px 12px 48px', width: '100%', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f1f5f9', outline: 'none', fontSize: '0.9rem', color: '#1e293b' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 14px', 
              borderRadius: '12px', 
              background: tallyStatus === 'connected' ? 'rgba(34, 197, 94, 0.1)' : tallyStatus === 'disconnected' ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9',
              border: `1px solid ${tallyStatus === 'connected' ? 'rgba(34, 197, 94, 0.2)' : tallyStatus === 'disconnected' ? 'rgba(239, 68, 68, 0.2)' : '#e2e8f0'}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                background: tallyStatus === 'connected' ? '#22c55e' : tallyStatus === 'disconnected' ? '#ef4444' : '#94a3b8',
                boxShadow: tallyStatus === 'connected' ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none',
                animation: tallyStatus === 'checking' ? 'pulse 2s infinite' : 'none'
              }} />
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                color: tallyStatus === 'connected' ? '#166534' : tallyStatus === 'disconnected' ? '#991b1b' : '#64748b'
              }}>
                Tally: {tallyStatus === 'connected' ? 'Online' : tallyStatus === 'disconnected' ? 'Offline' : 'Syncing...'}
              </span>
            </div>

            <div style={{ position: 'relative', cursor: 'pointer', padding: '10px', borderRadius: '12px', background: '#f1f5f9' }}>
               <Bell size={20} color="#64748b" />
               <div style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', height: '32px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
               <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '700' }}>John Doe</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Super Admin</p>
               </div>
               <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(45deg, #6366f1, #a855f7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>JD</div>
            </div>
          </div>
        </header>

        <div style={{ padding: '40px', flex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Overview</h1>
                <p style={{ color: '#64748b' }}>Real-time enterprise metrics and business health status.</p>
              </div>
              <button 
                disabled={isGenerating}
                onClick={handleGenerateReport}
                style={{ 
                  padding: '12px 24px', 
                  background: isGenerating ? '#94a3b8' : '#6366f1', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                 {isGenerating ? 'Generating...' : 'Generate Quarterly Report'} <ArrowUpRight size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
              {kpiData.map((kpi, idx) => (
                <div key={idx} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    {kpi.icon}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</p>
                  <h2 style={{ margin: '8px 0', fontSize: '1.75rem', fontWeight: '900', color: '#1e293b' }}>{kpi.value}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <span style={{ fontSize: '0.85rem', fontWeight: '800', color: kpi.trend.startsWith('+') ? '#10b981' : '#ef4444' }}>{kpi.trend}</span>
                     <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>vs last month</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              
              <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Critical Approval Queue</h3>
                    <span style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', fontSize: '0.75rem', fontWeight: '800', borderRadius: '8px' }}>{stats.pendingCount} Pending</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {(stats.approvalQueue || []).map((app, idx) => (
                      <div key={idx} style={{ padding: '20px', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={20} color="#94a3b8" /></div>
                            <div>
                               <p style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>{app.type}</p>
                               <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Reference: {app.ref} • {app.user}</p>
                            </div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontWeight: '800', fontSize: '0.95rem', color: '#1e293b' }}>{app.amount}</p>
                            <button 
                               onClick={() => navigate(app.link)}
                               style={{ margin: '8px 0 0', background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                            >
                               Review Now →
                            </button>
                         </div>
                      </div>
                    ))}
                    {(!stats.approvalQueue || stats.approvalQueue.length === 0) && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                         <CheckCircle2 size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
                         <p>All clear! No pending approvals.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '24px' }}>Security & Audit Log</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recentLogs.slice(0, 6).map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '14px' }}>
                         <div style={{ 
                            width: '12px', height: '12px', borderRadius: '50%', marginTop: '6px', 
                            background: log.action?.includes('Delete') ? '#ef4444' : log.action?.includes('Update') ? '#f59e0b' : '#10b981' 
                         }} />
                         <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700' }}>{log.message}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                               <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleTimeString()}</span>
                               <span style={{ fontSize: '0.75rem', padding: '2px 6px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}>{log.module}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
                 <button style={{ width: '100%', padding: '12px', marginTop: '24px', borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>View Full Audit Trail</button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
