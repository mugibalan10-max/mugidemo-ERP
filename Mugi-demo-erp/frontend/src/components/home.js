import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Zen Finance — Business Intelligence Dashboard
 * Fetches data from the standardized /api/tally/dashboard endpoint.
 */
function Home() {
    const [status, setStatus] = useState({ connected: false, checking: true });
    const [dashboardData, setDashboardData] = useState({
        totalCustomers: 0,
        totalSales: 0,
        customers: [],
        sales: []
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const statusRes = await axios.get("http://localhost:5000/api/tally/status");
            setStatus({ connected: statusRes.data.connected, checking: false });

            if (statusRes.data.connected) {
                // 🟢 Standardized API Call
                const res = await axios.get("http://localhost:5000/api/tally/dashboard");
                if (res.data.success) {
                    setDashboardData(res.data.data);
                }
            }
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setStatus({ connected: false, checking: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const theme = {
        primary: '#6366f1',
        success: '#10b981',
        warning: '#f59e0b',
        textMain: '#1e293b',
        textMuted: '#64748b',
    };

    return (
        <div style={{ padding: "40px", fontFamily: 'Inter, sans-serif', color: theme.textMain, background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>Zen Finance BI</h1>
                    <p style={{ margin: '4px 0 0', color: theme.textMuted }}>Standardized Tally Dashboard</p>
                </div>
                <div style={{ 
                    padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700',
                    background: status.connected ? '#10b98115' : '#ef444415',
                    color: status.connected ? '#10b981' : '#ef4444',
                    border: `1px solid ${status.connected ? '#10b981' : '#ef4444'}`
                }}>
                    {status.checking ? "Syncing..." : (status.connected ? "🟢 Tally Online" : "🔴 Tally Offline")}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div style={cardStyle}>
                    <p style={labelStyle}>Total Customers</p>
                    <h2 style={valueStyle}>{dashboardData.totalCustomers}</h2>
                    <span style={badgeStyle}>Verified Ledgers</span>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Total Sales</p>
                    <h2 style={valueStyle}>{dashboardData.totalSales}</h2>
                    <span style={{ ...badgeStyle, color: theme.primary, background: '#6366f115' }}>Synced Invoices</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                <div style={cardStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Recent Sales Vouchers</h3>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={headerRowStyle}>
                                <th style={cellStyle}>Date</th>
                                <th style={cellStyle}>Voucher No</th>
                                <th style={cellStyle}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.sales.map((sale, i) => (
                                <tr key={i} style={rowStyle}>
                                    <td style={cellStyle}>{sale.date}</td>
                                    <td style={{ ...cellStyle, fontWeight: '600' }}>{sale.number}</td>
                                    <td style={{ ...cellStyle, color: theme.success, fontWeight: '700' }}>₹{sale.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={cardStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Customer Directory</h3>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={headerRowStyle}>
                                <th style={cellStyle}>Name</th>
                                <th style={cellStyle}>Under Group</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dashboardData.customers.map((customer, i) => (
                                <tr key={i} style={rowStyle}>
                                    <td style={{ ...cellStyle, fontWeight: '500' }}>{customer.name}</td>
                                    <td style={{ ...cellStyle, color: theme.textMuted }}>{customer.group}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const cardStyle = { background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' };
const labelStyle = { margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' };
const valueStyle = { margin: '12px 0', fontSize: '2.25rem', fontWeight: '800' };
const badgeStyle = { fontSize: '0.7rem', fontWeight: '700', color: '#10b981', background: '#10b98115', padding: '4px 8px', borderRadius: '6px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerRowStyle = { textAlign: 'left', borderBottom: '2px solid #f8fafc' };
const rowStyle = { borderBottom: '1px solid #f8fafc' };
const cellStyle = { padding: '14px', fontSize: '0.9rem' };

export default Home;
