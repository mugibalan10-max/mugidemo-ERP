import React, { useState, useEffect } from "react";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

/**
 * Tally Integration Dashboard
 * Enterprise-level monitoring for ERP ➔ Tally synchronization.
 */
export default function TallyDashboard() {
  const [stats, setStats] = useState({
    ledgerSynced: 0,
    stockSynced: 0,
    gstSynced: 0,
    paymentsSynced: 0,
    pending: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTallyStatus();
  }, []);

  const fetchTallyStatus = async () => {
    try {
      const res = await api.get("/api/dashboard/stats");
      const data = res.data;
      
      setStats({
        ledgerSynced: data.totalCustomers || 0,
        stockSynced: data.tallySynced || 0,
        gstSynced: data.tallySynced || 0,
        paymentsSynced: 0,
        pending: data.tallyPending || 0
      });

      // Map real sync logs from backend
      if (data.logs) {
        setLogs(data.logs.map(log => ({
          id: log.id,
          module: log.module,
          status: log.action === 'SUCCESS' ? 'Success' : 'Pending Retry',
          time: new Date(log.createdAt).toLocaleTimeString(),
          info: log.message
        })));
      }
    } catch (err) {
      console.error("Failed to fetch Tally status");
    }
  };

  const retryAll = async () => {
    setLoading(true);
    try {
        const res = await api.get("/api/tally/sync/queue");
        const pendingItems = res.data.data.filter(i => i.status !== 'SUCCESS');
        
        for (const item of pendingItems) {
            await api.post(`/api/tally/sync/retry/${item.id}`);
        }
        
        alert(`✅ ${pendingItems.length} records have been re-queued for synchronization.`);
        fetchTallyStatus();
    } catch (err) {
        alert("Failed to retry syncs");
    } finally {
        setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f172a',
    color: '#f1f5f9',
    fontFamily: "'Inter', sans-serif"
  };

  const mainStyle = {
    flex: 1,
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  const glassCardStyle = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '32px'
  };

  const statCard = (label, value, icon, color) => (
    <div style={{ ...glassCardStyle, marginBottom: 0, padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>{label}</p>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: '900' }}>{value}</h2>
        </div>
        <span style={{ fontSize: '1.5rem', background: `${color}22`, padding: '10px', borderRadius: '12px' }}>{icon}</span>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Tally Integration</h1>
            <p style={{ color: '#94a3b8' }}>Real-time synchronization bridge between ERP and TallyPrime XML API.</p>
          </div>
          <button
            onClick={retryAll}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '16px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
            }}
          >
            {loading ? 'Retrying...' : '🔄 Retry Pending Syncs'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {statCard('Ledgers Synced', stats.ledgerSynced, '👥', '#6366f1')}
          {statCard('Stock Items', stats.stockSynced, '📦', '#10b981')}
          {statCard('GST Vouchers', stats.gstSynced, '📜', '#f59e0b')}
          {statCard('Pending Tasks', stats.pending, '⏳', '#ef4444')}
        </div>

        <div style={glassCardStyle}>
          <h3 style={{ marginBottom: '24px', fontWeight: '800' }}>Live Synchronization Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {logs.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: log.status === 'Success' ? '#10b981' : '#ef4444',
                  marginRight: '20px',
                  boxShadow: `0 0 10px ${log.status === 'Success' ? '#10b981' : '#ef4444'}`
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '700' }}>{log.info}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Module: {log.module} • {log.time}</p>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: log.status === 'Success' ? '#10b98122' : '#ef444422',
                  color: log.status === 'Success' ? '#10b981' : '#ef4444',
                  border: `1px solid ${log.status === 'Success' ? '#10b98144' : '#ef444444'}`
                }}>{log.status}</span>
              </div>
            ))}
            {logs.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No sync activity recorded yet.</p>}
          </div>
        </div>

        {/* Technical Config Note */}
        <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6' }}>
            <strong style={{ color: '#fff' }}>📡 Tally Connection Status:</strong> ERP is currently listening on port 5000 and pushing XML payloads to TallyPrime HTTP server at <strong>localhost:9000</strong>. CGST/SGST/IGST mapping is handled automatically based on the customer GST state code.
          </p>
        </div>
      </div>
    </div>
  );
}
