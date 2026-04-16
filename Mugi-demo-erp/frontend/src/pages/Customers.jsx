import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    primary: '#6366f1',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#f1f5f9',
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/customers');
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error("Customers data is not an array:", data);
        setCustomers([]);
        setLoading(false);
        return;
      }

      // For each customer, fetch their balance
      const customerWithBalances = await Promise.all(data.map(async (cust) => {
        try {
          const balRes = await fetch(`http://localhost:5000/api/ledger/balance/${encodeURIComponent(cust.name)}`);
          const balData = await balRes.json();
          return { ...cust, balanceData: balData };
        } catch (e) {
          return { ...cust, balanceData: { balance: 0, status: 'Unknown' } };
        }
      }));

      setCustomers(customerWithBalances);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setCustomers([]);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Client Portfolio</h1>
            <p style={{ color: theme.textMuted }}>Overview of all converted leads and their current financial standing.</p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {loading ? (
              <p>Loading customers...</p>
            ) : customers.length === 0 ? (
              <p>No customers found based on current leads.</p>
            ) : customers.map(cust => (
              <div key={cust.id} style={{ 
                background: theme.card, 
                padding: '28px', 
                borderRadius: '24px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                border: `1px solid ${theme.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${theme.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    👤
                  </div>
                  <div style={{ 
                    padding: '6px 12px', 
                    borderRadius: '99px', 
                    background: cust.balanceData?.status === 'Clear' ? '#dcfce7' : '#fee2e2', 
                    color: cust.balanceData?.status === 'Clear' ? '#166534' : '#991b1b',
                    fontSize: '0.75rem',
                    fontWeight: '800'
                  }}>
                    {cust.balanceData?.status || 'Active'}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: theme.textMain }}>{cust.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: theme.textMuted }}>{cust.email || 'No email provided'}</p>
                </div>

                <div style={{ 
                  marginTop: '12px', 
                  padding: '16px', 
                  background: '#f8fafc', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between' 
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Current Balance</p>
                    <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: '800', color: theme.textMain }}>
                      ₹{cust.balanceData?.balance?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>Total Invoiced</p>
                    <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: '700', color: theme.textMain }}>
                      ₹{cust.balanceData?.totalInvoiced?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <button style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  borderRadius: '12px', 
                  border: `1px solid ${theme.primary}30`, 
                  background: 'white', 
                  color: theme.primary,
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  View Full Statement
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
