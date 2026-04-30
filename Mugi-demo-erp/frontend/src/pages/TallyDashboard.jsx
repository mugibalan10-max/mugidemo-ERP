import React, { useState, useEffect } from "react";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

/**
 * Production-Grade Tally Integration Dashboard
 */
export default function TallyDashboard() {
  const [stats, setStats] = useState({
    ledgerSynced: 0,
    stockSynced: 0,
    gstSynced: 0,
    pending: 0,
    successRate: 0,
    connected: false
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTallyStatus();
    const interval = setInterval(fetchTallyStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTallyStatus = async () => {
    try {
      const queueRes = await api.get("/api/tally/sync/queue");
      const queueData = queueRes.data.data || [];
      
      const successCount = queueData.filter(i => i.status === 'SUCCESS').length;
      const totalCount = queueData.length;
      const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

      setStats({
        ledgerSynced: queueData.filter(i => i.entityType === 'ledger' && i.status === 'SUCCESS').length,
        stockSynced: queueData.filter(i => i.entityType === 'stock' && i.status === 'SUCCESS').length,
        gstSynced: queueData.filter(i => i.entityType === 'invoice' && i.status === 'SUCCESS').length,
        pending: queueData.filter(i => ['QUEUED', 'RETRY'].includes(i.status)).length,
        successRate,
        connected: false
      });
      
      try {
        const statusRes = await api.get("/api/tally/status");
        setStats(prev => ({ ...prev, connected: statusRes.data.connected }));
      } catch (err) {
        setStats(prev => ({ ...prev, connected: false }));
      }

      setLogs(queueData.map(log => ({
        id: log.id,
        module: log.entityType,
        status: log.status,
        time: new Date(log.updatedAt).toLocaleTimeString(),
        info: `${log.entityType.toUpperCase()} ${log.entityId}`,
        error: log.lastError
      })));
    } catch (err) {
      console.error("Failed to fetch Tally status");
    }
  };

  const retryAll = async () => {
    setLoading(true);
    try {
        await api.post("/api/tally/sync/retry-all");
        // Wait 1 second for background processing to start then refresh
        setTimeout(fetchTallyStatus, 1000);
    } catch (err) {
        console.error("Retry failed:", err);
        alert("Failed to retry syncs: " + (err.response?.data?.error || err.message));
    } finally {
        setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return '#10b981';
      case 'FAILED': return '#ef4444';
      case 'RETRY': return '#f59e0b';
      case 'PROCESSING': return '#3b82f6';
      default: return '#94a3b8';
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
        <span style={{ fontSize: '1.5rem', background: `${color}22`, padding: '10px', borderRadius: '12px', color: color }}>{icon}</span>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0 }}>Tally Integration</h1>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px', borderRadius: '20px',
                    background: stats.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${stats.connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                    <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: stats.connected ? '#10b981' : '#ef4444',
                        boxShadow: `0 0 10px ${stats.connected ? '#10b981' : '#ef4444'}`,
                        animation: stats.connected ? 'pulse 2s infinite' : 'none'
                    }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: stats.connected ? '#10b981' : '#ef4444' }}>
                        {stats.connected ? 'ONLINE' : 'OFFLINE'}
                    </span>
                </div>
            </div>
            <p style={{ color: '#94a3b8' }}>Auto-healing synchronization with <strong>{stats.successRate}% Success Rate</strong>.</p>
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
            {loading ? 'Retrying...' : '🔄 Retry All Failed'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {statCard('Ledgers Synced', stats.ledgerSynced, '👥', '#6366f1')}
          {statCard('Stock Items', stats.stockSynced, '📦', '#10b981')}
          {statCard('GST Vouchers', stats.gstSynced, '📜', '#f59e0b')}
          {statCard('Active Queue', stats.pending, '⏳', '#3b82f6')}
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
                  background: getStatusColor(log.status),
                  marginRight: '20px',
                  boxShadow: `0 0 10px ${getStatusColor(log.status)}`
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '700' }}>{log.info}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Module: {log.module} • {log.time}</p>
                  {log.error && <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#ef4444' }}>{log.error}</p>}
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: `${getStatusColor(log.status)}22`,
                  color: getStatusColor(log.status),
                  border: `1px solid ${getStatusColor(log.status)}44`
                }}>{log.status}</span>
              </div>
            ))}
            {logs.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No sync activity recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
