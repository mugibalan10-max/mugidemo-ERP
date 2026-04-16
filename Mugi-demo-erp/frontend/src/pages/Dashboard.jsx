import React, { useState, useEffect } from 'react';
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
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalInventory: 0,
    pendingPayments: 0
  });

  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tally/summary`);
      const result = await res.json();
      
      if (result.success && result.data) {
        setData(result.data);
        
        // Mocking chart data based on real totals for visualization
        // In a real app, this would come from a /analytics endpoint
        const mockChart = [
          { name: 'Mon', sales: result.data.totalSales * 0.1, purchase: result.data.totalPurchase * 0.08 },
          { name: 'Tue', sales: result.data.totalSales * 0.15, purchase: result.data.totalPurchase * 0.12 },
          { name: 'Wed', sales: result.data.totalSales * 0.2, purchase: result.data.totalPurchase * 0.15 },
          { name: 'Thu', sales: result.data.totalSales * 0.12, purchase: result.data.totalPurchase * 0.25 },
          { name: 'Fri', sales: result.data.totalSales * 0.25, purchase: result.data.totalPurchase * 0.1 },
          { name: 'Sat', sales: result.data.totalSales * 0.18, purchase: result.data.totalPurchase * 0.3 },
        ];
        setChartData(mockChart);

        setPieData([
          { name: 'Sales', value: result.data.totalSales, color: '#6366f1' },
          { name: 'Purchase', value: result.data.totalPurchase, color: '#f43f5e' },
        ]);
      } else {
        setData(prev => ({ ...prev, tallyStatus: "Disconnected" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const kpiData = [
    { label: 'Total Invoiced', value: `₹${parseFloat(stats.totalSales || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#6366f1', trend: '+12.5%' },
    { label: 'Purchase Orders', value: stats.totalOrders || 0, icon: <ShoppingBag size={24} />, color: '#10b981', trend: '+4.2%' },
    { label: 'Stock Valuation', value: `₹${parseFloat(stats.totalInventory || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: '#f59e0b', trend: '-2.1%' },
    { label: 'Vendor Payables', value: `₹${parseFloat(stats.pendingPayments || 0).toLocaleString()}`, icon: <CreditCard size={24} />, color: '#ef4444', trend: '+8.3%' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Navigation Bar */}
        <header style={{
          height: '80px',
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

        {/* Content Area */}
        <div style={{ padding: '40px', flex: 1 }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Overview</h1>
                <p style={{ color: '#64748b' }}>Real-time enterprise metrics and business health status.</p>
              </div>
              <button style={{ padding: '12px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 Generate Quarterly Report <ArrowUpRight size={18} />
              </button>
            </div>

            {/* KPI Section */}
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

            {/* Main Dashboard Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
              
              {/* Approval Queue */}
              <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Critical Approval Queue</h3>
                    <span style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', fontSize: '0.75rem', fontWeight: '800', borderRadius: '8px' }}>5 Pending</span>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      { type: 'PO Approval', ref: 'PO-2023-0042', amount: '₹1,42,000', user: 'Finance Lead' },
                      { type: 'Price Override', ref: 'SKU-8822', amount: '-15%', user: 'Sales Manager' },
                      { type: 'Leave Request', ref: 'EMP-009', amount: '3 Days', user: 'Operations Head' }
                    ].map((app, idx) => (
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
                            <button style={{ margin: '8px 0 0', background: 'transparent', border: 'none', color: '#6366f1', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>Review Now →</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* System Audit Log */}
              <div style={{ background: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '24px' }}>Security & Audit Log</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recentLogs.slice(0, 6).map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '14px' }}>
                         <div style={{ 
                            width: '12px', height: '12px', borderRadius: '50%', marginTop: '6px', 
                            background: log.action.includes('Delete') ? '#ef4444' : log.action.includes('Update') ? '#f59e0b' : '#10b981' 
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
