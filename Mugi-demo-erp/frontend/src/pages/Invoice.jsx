import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

/**
 * React Invoice Page — Step 4
 * Features real-time tax calculation and premium Glassmorphic ERP design.
 */
export default function Invoice() {
  const [data, setData] = useState({
    customer_name: "",
    subtotal: "",
    gst_percent: 18,
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Real-time calculation logic
  const subtotalNum = Number(data.subtotal) || 0;
  const gstPercentNum = Number(data.gst_percent) || 0;
  const gst_amount = (subtotalNum * gstPercentNum) / 100;
  const total = subtotalNum + gst_amount;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const createInvoice = async () => {
    if (!data.customer_name || !data.subtotal) {
      return alert("Please enter both Customer Name and Subtotal.");
    }
    
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/invoices", data);
      alert("✅ Invoice Created! ID: " + res.data.invoice_no);
      setData({ customer_name: "", subtotal: "", gst_percent: 18 }); // Reset form
      fetchInvoices(); // Refresh list
    } catch (err) {
      alert("❌ Failed to create invoice. Please check the backend.");
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f172a', // Dark theme for premium look
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
    padding: '40px',
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    marginBottom: '40px'
  };

  const inputStyle = {
    padding: '16px',
    borderRadius: '14px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    width: '100%',
    fontSize: '1rem',
    marginTop: '10px',
    outline: 'none',
    transition: 'all 0.3s ease'
  };

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const retrySync = async (id) => {
    try {
      const response = await axios.post("http://localhost:5000/api/tally/sync", { invoiceId: id });
      alert(response.data.message);
      fetchInvoices();
    } catch (err) {
      alert("Manual sync failed. Check if Tally is running.");
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Create Invoice</h1>
          <p style={{ color: '#94a3b8' }}>Generate instant billing and track your receivables globally.</p>
        </div>

        <div style={glassCardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <div>
              <label style={labelStyle}>Customer Name</label>
              <input
                placeholder="e.g., Apple Inc."
                style={inputStyle}
                value={data.customer_name}
                onChange={(e) => setData({ ...data, customer_name: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Subtotal (₹)</label>
              <input
                type="number"
                placeholder="1000.00"
                style={inputStyle}
                value={data.subtotal}
                onChange={(e) => setData({ ...data, subtotal: e.target.value })}
              />
            </div>
            <div>
              <label style={labelStyle}>Tax Bracket (GST %)</label>
              <select
                style={inputStyle}
                value={data.gst_percent}
                onChange={(e) => setData({ ...data, gst_percent: e.target.value })}
              >
                <option value={5}>GST 5% (Basics)</option>
                <option value={12}>GST 12% (Standard)</option>
                <option value={18}>GST 18% (Services)</option>
                <option value={28}>GST 28% (Luxury)</option>
              </select>
            </div>
          </div>

          <div style={{ 
            marginTop: '40px', 
            padding: '24px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            borderRadius: '20px', 
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>GST Calculations</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>+ ₹{gst_amount.toFixed(2)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Gross Total Amount</p>
              <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#6366f1' }}>₹{total.toFixed(2)}</p>
            </div>
          </div>

          <button 
            onClick={createInvoice} 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '32px', 
              padding: '18px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              color: 'white', 
              border: 'none', 
              fontSize: '1.1rem', 
              fontWeight: '800', 
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? 'Confirming Transaction...' : 'Generate Invoice Record'}
          </button>
        </div>

        {/* Tally Sync Test Panel */}
        <div style={{ ...glassCardStyle, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🧪</span> Tally Sync Test Panel
             </h2>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                    <p style={labelStyle}>Manual Verification Guide</p>
                    <ul style={{ fontSize: '0.85rem', color: '#94a3b8', paddingLeft: '20px', lineHeight: '1.6' }}>
                        <li>Open TallyPrime ➔ Select Company</li>
                        <li>Go to: <b>Display More Reports ➔ Day Book</b></li>
                        <li>Verify <b>Invoice No, Party Name, and Total Amount</b></li>
                    </ul>
                </div>
                {invoices.length > 0 && (
                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                        <p style={labelStyle}>Last Generated Invoice Sync</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: '700' }}>{invoices[0].invoiceNo}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Status: {invoices[0].syncStatus}</p>
                            </div>
                            <button 
                                onClick={() => retrySync(invoices[0].id)}
                                style={{ background: '#6366f1', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                            >Retry Sync 🔄</button>
                        </div>
                    </div>
                )}
             </div>
        </div>

        {/* Recent Invoices List */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Invoice History</h2>
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          backdropFilter: 'blur(10px)', 
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '20px' }}>INVOICE ID</th>
                <th style={{ padding: '20px' }}>CLIENT</th>
                <th style={{ padding: '20px' }}>TALLY SYNC</th>
                <th style={{ padding: '20px' }}>GRAND TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '20px', fontWeight: '700', color: '#6366f1' }}>{inv.invoiceNo}</td>
                  <td style={{ padding: '20px', fontWeight: '600' }}>{inv.customerName}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800', 
                        background: inv.syncStatus === 'Success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: inv.syncStatus === 'Success' ? '#10b981' : '#ef4444'
                    }}>
                        {inv.syncStatus}
                    </span>
                  </td>
                  <td style={{ padding: '20px', fontWeight: '800', color: '#f1f5f9' }}>₹{inv.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
