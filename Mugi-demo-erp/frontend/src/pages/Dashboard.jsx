import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, CreditCard, Bell, 
  Download, Filter, Calendar, MapPin, RefreshCw, Activity, AlertCircle, FileText
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [salesChart, setSalesChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const [dateFilter, setDateFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = {
    primary: '#0f172a',
    secondary: '#3b82f6',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bg: '#f4f7fb',
    card: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0'
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, branchFilter]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchDashboardData, 30000); // 30 sec refresh
    }
    return () => clearInterval(interval);
  }, [autoRefresh, dateFilter, branchFilter]); // eslint-disable-line

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = `?date_filter=${dateFilter}&branch_id=${branchFilter}`;
      const [sumRes, chartRes, prodRes, alertRes] = await Promise.all([
        api.get(`/api/dashboard/summary${params}`),
        api.get(`/api/dashboard/sales-chart${params}`),
        api.get(`/api/dashboard/top-products${params}`),
        api.get(`/api/dashboard/alerts${params}`)
      ]);
      setSummary(sumRes.data);
      setSalesChart(chartRes.data);
      setTopProducts(prodRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error("Dashboard data fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvData = [
      ["Metric", "Value"],
      ["Total Sales", summary?.sales?.totalAmount || 0],
      ["Total Invoices", summary?.sales?.invoiceCount || 0],
      ["Total Purchases", summary?.purchases?.totalAmount || 0],
      ["Inventory Value", summary?.inventory?.totalStockValue || 0],
      ["Total Expenses", summary?.finance?.totalExpenses || 0],
      ["Net Profit/Loss", summary?.finance?.profitLoss || 0]
    ];
    const csvContent = csvData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Executive_Summary_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '32px', height: '100vh', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          {/* Header & Controls */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '900', color: theme.textMain, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Activity color={theme.secondary} size={32} /> Executive Dashboard
              </h1>
              <p style={{ color: theme.textMuted, margin: 0, fontSize: '1.05rem' }}>Real-time business intelligence and operational oversight.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <MapPin size={18} color={theme.textMuted} />
                <select 
                  value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '600', color: theme.textMain, cursor: 'pointer' }}
                >
                  <option value="all">Global HQ (All Branches)</option>
                  <option value="1">Mumbai Branch</option>
                  <option value="2">Bangalore Branch</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <Calendar size={18} color={theme.textMuted} />
                <select 
                  value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: '600', color: theme.textMain, cursor: 'pointer' }}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: autoRefresh ? theme.success : 'white', color: autoRefresh ? 'white' : theme.textMain, border: `1px solid ${autoRefresh ? theme.success : theme.border}`, fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <RefreshCw size={18} className={autoRefresh ? 'spin' : ''} /> Live
              </button>

              <button 
                onClick={exportReport}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}
              >
                <Download size={18} /> Export
              </button>
            </div>
          </header>

          {loading && !summary ? (
             <div style={{ padding: '100px', textAlign: 'center', color: theme.textMuted, fontWeight: '700' }}>Aggregating Data...</div>
          ) : (
            <>
              {/* Top KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                
                {/* Sales KPI */}
                <div 
                  onClick={() => navigate('/sales')}
                  style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  className="kpi-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '12px', color: '#1d4ed8' }}><TrendingUp size={24} /></div>
                    <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>+12.5%</span>
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: theme.textMain, marginTop: '4px' }}>₹{summary?.sales?.totalAmount?.toLocaleString() || 0}</div>
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: theme.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{summary?.sales?.invoiceCount || 0} Invoices</span>
                    <span style={{ color: theme.danger }}>₹{summary?.sales?.pendingReceivables?.toLocaleString() || 0} AR</span>
                  </div>
                </div>

                {/* Purchases KPI */}
                <div 
                  onClick={() => navigate('/purchases')}
                  style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  className="kpi-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', color: '#b45309' }}><ShoppingBag size={24} /></div>
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Purchases</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: theme.textMain, marginTop: '4px' }}>₹{summary?.purchases?.totalAmount?.toLocaleString() || 0}</div>
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: theme.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{summary?.purchases?.billCount || 0} Bills</span>
                    <span style={{ color: theme.danger }}>₹{summary?.purchases?.pendingPayables?.toLocaleString() || 0} AP</span>
                  </div>
                </div>

                {/* Inventory KPI */}
                <div 
                  onClick={() => navigate('/inventory')}
                  style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  className="kpi-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ background: '#f3e8ff', padding: '12px', borderRadius: '12px', color: '#7e22ce' }}><FileText size={24} /></div>
                    {(summary?.inventory?.lowStockItems > 0) && <span style={{ padding: '4px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>{summary?.inventory?.lowStockItems} Low</span>}
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory Value</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: theme.textMain, marginTop: '4px' }}>₹{summary?.inventory?.totalStockValue?.toLocaleString() || 0}</div>
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: theme.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Live Stock Valuation</span>
                  </div>
                </div>

                {/* Finance KPI */}
                <div 
                  onClick={() => navigate('/reports')}
                  style={{ background: theme.primary, padding: '24px', borderRadius: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' }}
                  className="kpi-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}><CreditCard size={24} /></div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Profit / Loss</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', marginTop: '4px' }}>₹{summary?.finance?.profitLoss?.toLocaleString() || 0}</div>
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cash Bal: ₹{summary?.finance?.cashAndBank?.toLocaleString() || 0}</span>
                  </div>
                </div>

              </div>

              {/* Charts & Secondary Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                
                {/* Main Chart */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', fontWeight: '800', color: theme.textMain }}>Revenue vs Procurement (YTD)</h3>
                  <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.secondary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={theme.secondary} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={theme.warning} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={theme.warning} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.textMuted }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.textMuted }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: `1px solid ${theme.border}`, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                          formatter={(value) => `₹${value.toLocaleString()}`}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="Sales" stroke={theme.secondary} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                        <Area type="monotone" dataKey="Purchases" stroke={theme.warning} strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Alerts & Top Products */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Alerts Panel */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={20} color={theme.textMain} /> System Alerts
                      </h3>
                      {alerts.length > 0 && <span style={{ background: theme.danger, color: 'white', padding: '2px 8px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>{alerts.length}</span>}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {alerts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '0.9rem' }}>No pending alerts. System is healthy.</div>
                      ) : alerts.map(alert => (
                        <div key={alert.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: alert.type === 'danger' ? '#fef2f2' : '#fffbeb', border: `1px solid ${alert.type === 'danger' ? '#fca5a5' : '#fde68a'}` }}>
                          <AlertCircle size={20} color={alert.type === 'danger' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0 }} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: alert.type === 'danger' ? '#991b1b' : '#b45309' }}>{alert.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Products */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: 1 }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '800', color: theme.textMain }}>Top Selling Products</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {topProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: theme.textMuted, fontSize: '0.9rem' }}>No sales data available.</div>
                      ) : topProducts.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#64748b', fontSize: '0.8rem' }}>#{i+1}</div>
                            <div>
                              <div style={{ fontWeight: '700', color: theme.textMain, fontSize: '0.9rem' }}>{p.name}</div>
                              <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>{p.quantity} Units Sold</div>
                            </div>
                          </div>
                          <div style={{ fontWeight: '800', color: theme.success }}>₹{p.salesValue.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          <style>
            {`
              .kpi-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
              }
              .spin {
                animation: spin 1s linear infinite;
              }
              @keyframes spin {
                100% { transform: rotate(360deg); }
              }
            `}
          </style>

        </div>
      </main>
    </div>
  );
}
