import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Package, Landmark, ArrowRight, RefreshCw, AlertCircle,
  BarChart3, PieChart, Activity, Receipt
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart as RePieChart, Pie
} from 'recharts';

/**
 * Modern ERP Dashboard UI
 * Integrated with Tally Real-time Data
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    totalSales: 0,
    totalPurchase: 0,
    totalProfit: 0,
    cashBalance: 0,
    stockValue: 0,
    recentTransactions: [],
    lowStock: [],
    gstSummary: { collected: 0, paid: 0, net: 0 },
    tallyStatus: "Checking..."
  });

  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

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
      console.error("Dashboard Fetch Error:", err);
      setData(prev => ({ ...prev, tallyStatus: "Disconnected" }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) navigate('/login');
    
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [navigate, fetchDashboardData]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const theme = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    danger: '#f43f5e',
    warning: '#f59e0b',
    info: '#0ea5e9',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0'
  };

  const kpis = [
    { title: 'Total Sales', value: formatCurrency(data.totalSales), icon: <ShoppingCart size={24} />, color: theme.primary, trend: '+12.5%' },
    { title: 'Total Purchase', value: formatCurrency(data.totalPurchase), icon: <Receipt size={24} />, color: theme.danger, trend: '+5.2%' },
    { title: 'Gross Profit', value: formatCurrency(data.totalProfit), icon: <Activity size={24} />, color: theme.success, trend: '+18.3%' },
    { title: 'Cash & Bank', value: formatCurrency(data.cashBalance), icon: <Landmark size={24} />, color: theme.info, trend: '-2.1%' },
    { title: 'Stock Value', value: formatCurrency(data.stockValue), icon: <Package size={24} />, color: theme.warning, trend: '+8.4%' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <RefreshCw size={48} className="animate-spin" style={{ color: theme.primary, marginBottom: '16px' }} />
            <h2 style={{ color: theme.textMain, fontWeight: '600' }}>Loading Real-time Insights...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {/* Top Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: theme.textMain, marginBottom: '4px' }}>
              Business Overview
            </h1>
            <p style={{ color: theme.textMuted, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Dashboard updated via Tally • 
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                color: data.tallyStatus === 'Connected' ? theme.success : theme.danger, 
                fontWeight: '700' 
              }}>
                <span className="status-dot" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: data.tallyStatus === 'Connected' ? theme.success : theme.danger,
                  boxShadow: `0 0 8px ${data.tallyStatus === 'Connected' ? theme.success : theme.danger}`,
                  display: 'inline-block'
                }}></span>
                {data.tallyStatus}
              </span>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => fetchDashboardData(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'white',
                border: `1px solid ${theme.border}`,
                color: theme.textMain,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Syncing...' : 'Sync Tally'}
            </button>
            <button style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: theme.primary,
              color: 'white',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 4px 14px 0 ${theme.primary}40`
            }}>
              Generate Report
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          {kpis.map((kpi, idx) => (
            <div key={idx} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '20px',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '12px', 
                  background: `${kpi.color}15`, color: kpi.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {kpi.icon}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', fontWeight: '700', 
                  color: kpi.trend.startsWith('+') ? theme.success : theme.danger,
                  background: kpi.trend.startsWith('+') ? `${theme.success}10` : `${theme.danger}10`,
                  padding: '4px 8px', borderRadius: '8px', height: 'fit-content'
                }}>
                  {kpi.trend}
                </div>
              </div>
              <p style={{ color: theme.textMuted, fontSize: '0.875rem', fontWeight: '500', marginBottom: '4px' }}>{kpi.title}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: theme.textMain }}>{kpi.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Sales Analytics */}
          <div style={{ 
            background: 'white', padding: '24px', borderRadius: '24px', 
            border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textMain }}>Revenue vs Expense Trend</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: theme.textMuted }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: theme.primary }}></div> Sales
                </span>
                <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: theme.textMuted }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: theme.danger }}></div> Purchase
                </span>
              </div>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: theme.textMuted, fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: theme.textMuted, fontSize: 12}} tickFormatter={(value) => `₹${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="sales" stroke={theme.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="purchase" stroke={theme.danger} strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Breakdown */}
          <div style={{ 
            background: 'white', padding: '24px', borderRadius: '24px', 
            border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textMain, marginBottom: '24px' }}>Transaction Mix</h3>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '20px' }}>
               {pieData.map((item, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                      <span style={{ fontSize: '0.875rem', color: theme.textMuted }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: theme.textMain }}>
                      {((item.value / (data.totalSales + data.totalPurchase || 1)) * 100).toFixed(1)}%
                    </span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Bottom Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Recent Transactions */}
          <div style={{ 
            background: 'white', padding: '24px', borderRadius: '24px', 
            border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textMain }}>Recent Transactions</h3>
              <button style={{ color: theme.primary, background: 'none', border: 'none', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                View All
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Party</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx, i) => (
                  <tr key={i} style={{ borderBottom: i === data.recentTransactions.length - 1 ? 'none' : `1px solid ${theme.bg}` }}>
                    <td style={{ padding: '16px 0' }}>
                      <p style={{ margin: 0, fontWeight: '600', color: theme.textMain, fontSize: '0.9rem' }}>{tx.party}</p>
                      <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.75rem' }}>#{tx.number}</p>
                    </td>
                    <td style={{ padding: '16px 0' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700',
                        background: tx.type === 'Sales' ? `${theme.success}10` : `${theme.danger}10`,
                        color: tx.type === 'Sales' ? theme.success : theme.danger
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: '700', color: theme.textMain }}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column: Inventory & GST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* GST Summary */}
            <div style={{ 
              background: 'white', padding: '24px', borderRadius: '24px', 
              border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textMain, marginBottom: '20px' }}>GST Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '16px', background: `${theme.info}05`, border: `1px solid ${theme.info}10` }}>
                  <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600' }}>GST Collected</p>
                  <h4 style={{ margin: '4px 0 0', color: theme.info, fontWeight: '800' }}>{formatCurrency(data.gstSummary.collected)}</h4>
                </div>
                <div style={{ padding: '16px', borderRadius: '16px', background: `${theme.danger}05`, border: `1px solid ${theme.danger}10` }}>
                  <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600' }}>GST Paid</p>
                  <h4 style={{ margin: '4px 0 0', color: theme.danger, fontWeight: '800' }}>{formatCurrency(data.gstSummary.paid)}</h4>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '16px', borderRadius: '16px', background: `${theme.success}05`, border: `1px solid ${theme.success}10`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.75rem', fontWeight: '600' }}>Net Liability</p>
                  <h4 style={{ margin: '4px 0 0', color: theme.success, fontWeight: '800' }}>{formatCurrency(data.gstSummary.net)}</h4>
                </div>
                <ArrowRight size={20} color={theme.success} />
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div style={{ 
              background: 'white', padding: '24px', borderRadius: '24px', 
              border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              flex: 1
            }}>
              <div style={{ display: 'flex', items: 'center', gap: '10px', marginBottom: '20px' }}>
                <AlertCircle size={20} color={theme.danger} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.textMain }}>Low Stock Alerts</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.lowStock.length > 0 ? data.lowStock.map((item, i) => (
                  <div key={i} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px', borderRadius: '12px', background: '#fffafb',
                    border: '1px solid #fee2e2'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: '#991b1b', fontSize: '0.85rem' }}>{item.name}</p>
                      <p style={{ margin: 0, color: '#ef4444', fontSize: '0.75rem' }}>Critical Level</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontWeight: '800', color: '#ef4444' }}>{item.quantity}</p>
                      <p style={{ margin: 0, color: '#f87171', fontSize: '0.65rem' }}>In Stock</p>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted }}>
                    <BarChart3 size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                    <p style={{ fontSize: '0.875rem' }}>All stock levels are optimal</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .status-dot {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

