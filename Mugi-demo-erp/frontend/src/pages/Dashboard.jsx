import React, { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard Page for Mugi Demo ERP
 * Displays key business metrics and performance overview with a premium visual design.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = React.useState({
    totalCustomers: 0,
    totalLeads: 0,
    totalSales: 0,
    inventoryAlerts: 0,
    lowStockItems: [],
    tallySynced: 0,
    tallyPending: 0,
    conversionRate: "0%",
  });

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) {
      navigate('/login');
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/dashboard/stats");
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error("Failed to fetch stats");
    }
  };

  // Design system theme
  const theme = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
  };

  const stats = [
    { label: 'Total Sales', value: `₹${Number(statsData.totalSales).toLocaleString()}`, change: 'Revenue', trend: 'up', icon: '💰', color: theme.success },
    { label: 'Tally Synced', value: statsData.tallySynced, change: 'Vouchers Pushed', trend: 'up', icon: '🔄', color: theme.primary },
    { label: 'Inventory Alerts', value: statsData.inventoryAlerts, change: 'Low Stock Items', trend: statsData.inventoryAlerts > 0 ? 'down' : 'up', icon: '📦', color: statsData.inventoryAlerts > 0 ? theme.danger : theme.success },
    { label: 'Lead Conversion', value: statsData.conversionRate, change: 'Success Rate', trend: 'up', icon: '🎯', color: theme.warning },
  ];

  const cardStyle = {
    background: theme.card,
    padding: '24px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.3s ease',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '800', 
              color: theme.textMain, 
              marginBottom: '12px',
              letterSpacing: '-0.025em' 
            }}>
              Dashboard
            </h1>
            <p style={{ color: theme.textMuted, fontSize: '1.125rem' }}>
              Welcome back! Here's the latest update for <span style={{ color: theme.primary, fontWeight: '700' }}>Mugi Demo ERP</span>.
            </p>
          </div>


      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={cardStyle} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ 
                width: '52px', 
                height: '52px', 
                borderRadius: '16px', 
                background: `${stat.color}15`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {stat.icon}
              </div>
              <div style={{ 
                fontSize: '0.8125rem', 
                fontWeight: '700', 
                color: stat.color,
                background: `${stat.color}10`,
                padding: '6px 12px',
                borderRadius: '99px',
                border: `1px solid ${stat.color}20`
              }}>
                {stat.change}
              </div>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: theme.textMuted }}>{stat.label}</p>
              <h2 style={{ margin: '4px 0 0', fontSize: '2rem', fontWeight: '800', color: theme.textMain }}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Sales Chart Container (Visual Representation) */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: theme.textMain }}>Revenue Trend</h3>
            <select style={{ 
              padding: '8px 16px', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              background: '#fff',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: theme.textMuted,
              outline: 'none',
              cursor: 'pointer'
            }}>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          
          <div style={{ 
            height: '240px', 
            width: '100%', 
            background: '#fcfdfe', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'space-around', 
            padding: '24px',
            border: '1px dashed #e2e8f0'
          }}>
            {[35, 65, 45, 85, 55, 95, 75].map((h, i) => (
              <div key={i} style={{ 
                width: '32px', 
                height: `${h}%`, 
                background: `linear-gradient(to top, ${theme.primary}, ${theme.primary}CC)`,
                borderRadius: '8px 8px 4px 4px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: theme.textMuted
                }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: theme.textMain, marginBottom: '20px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Create Invoice', icon: '📝', primary: true },
              { label: 'Add Lead', icon: '👤', primary: false },
              { label: 'New Expense', icon: '💸', primary: false },
              { label: 'View Reports', icon: '📊', primary: false },
            ].map((btn, i) => (
              <button key={i} style={{ 
                padding: '16px', 
                borderRadius: '14px', 
                border: 'none', 
                background: btn.primary ? theme.primary : '#f1f5f9', 
                color: btn.primary ? 'white' : theme.textMain,
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.2s',
              }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: theme.textMain, marginBottom: '16px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { text: 'Invoice #402 paid by Client A', time: '2h ago', type: 'payment' },
              { text: 'New lead "Arjun K." assigned to sales', time: '4h ago', type: 'lead' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.primary }}></div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500', color: theme.textMain }}>{item.text}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted }}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>

        {/* Low Stock Alerts Section */}
        {statsData.lowStockItems.length > 0 && (
          <div style={{ marginTop: '40px', background: 'white', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Inventory Alerts (Action Required)</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {statsData.lowStockItems.map(item => (
                <div key={item.id} style={{ padding: '20px', borderRadius: '20px', background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <p style={{ margin: 0, fontWeight: '700', color: '#991b1b' }}>{item.productName}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#b91c1c' }}>Stock: {item.quantity} / Min: {item.minStock}</p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '800', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '6px' }}>
                        REORDER: {item.minStock - item.quantity}
                      </p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tally Sync Alerts Section */}
        {statsData.tallyPending > 0 && (
          <div style={{ marginTop: '24px', background: 'white', padding: '32px', borderRadius: '32px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.5rem' }}>🔄</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Tally Sync Status (Attention Required)</h2>
            </div>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>You have <span style={{ color: '#ef4444', fontWeight: '800' }}>{statsData.tallyPending}</span> invoices waiting for Tally synchronization. This usually happens when the Tally server is offline.</p>
            <button 
                onClick={() => navigate('/invoices')}
                style={{ background: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
            >View Pending Syncs</button>
          </div>
        )}
      </div>
    </div>
  );
}
