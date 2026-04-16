import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

/**
 * Step 3 — Leads Page UI
 * Styled with a premium glassmorphic ERP look.
 */
export default function Leads() {
  const [lead, setLead] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [leadsList, setLeadsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch leads on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/leads");
      setLeadsList(response.data);
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/leads/${id}/status`, { status });
      fetchLeads();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const addLead = async () => {
    if (!lead.name) return alert("Name is required");
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/leads", lead);
      setLead({ name: "", email: "", phone: "" });
      alert("Lead Added Successfully");
      fetchLeads(); // Refresh list
    } catch (err) {
      alert("Failed to add lead");
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
    margin: '0 auto'
  };

  const inputGroupStyle = {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(10px)',
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '40px',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'flex-end'
  };

  const inputStyle = {
    padding: '14px 18px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    outline: 'none',
    minWidth: '200px',
    flex: 1
  };

  const buttonStyle = {
    padding: '14px 28px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#fff',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    opacity: loading ? 0.7 : 1
  };

  const listStyle = {
    background: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden'
  };

  const statuses = ["New", "Contacted", "Follow-up", "Qualified", "Converted", "Lost"];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Converted': return { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' };
      case 'Lost': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' };
      case 'Qualified': return { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' };
      case 'New': return { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' };
      default: return { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8' };
    }
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Leads Management</h1>
          <p style={{ color: '#94a3b8' }}>Track and manage your business prospects efficiently <span style={{ color: '#6366f1', fontWeight: '700' }}>(CRM AI Automation Enabled)</span>.</p>
        </div>

        {/* Add Lead Form */}
        <div style={inputGroupStyle}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Full Name</label>
            <input
              placeholder="e.g. John Doe"
              value={lead.name}
              style={inputStyle}
              onChange={(e) => setLead({ ...lead, name: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Email Address</label>
            <input
              placeholder="john@example.com"
              value={lead.email}
              style={inputStyle}
              onChange={(e) => setLead({ ...lead, email: e.target.value })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>Phone Number</label>
            <input
              placeholder="+91 98765 43210"
              value={lead.phone}
              style={inputStyle}
              onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            />
          </div>
          <button 
            onClick={addLead} 
            disabled={loading}
            style={buttonStyle}
            onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? "Adding..." : "Add Lead"}
          </button>
        </div>

        {/* Leads List Table */}
        <div style={listStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '20px' }}>NAME</th>
                <th style={{ padding: '20px' }}>EMAIL/PHONE</th>
                <th style={{ padding: '20px' }}>WORKFLOW STATUS</th>
                <th style={{ padding: '20px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {leadsList.map((item) => {
                const colors = getStatusColor(item.status);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px' }}>
                      <div style={{ fontWeight: '700', fontSize: '1rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '2px' }}>ID: #{item.id}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ color: '#f1f5f9', fontSize: '0.9rem' }}>{item.email || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.phone || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '20px' }}>
                      <span style={{ 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        background: colors.bg, 
                        color: colors.text,
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>{item.status || 'New'}</span>
                    </td>
                    <td style={{ padding: '20px' }}>
                      {item.status !== 'Converted' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select 
                            value={item.status}
                            onChange={(e) => updateStatus(item.id, e.target.value)}
                            style={{ 
                              background: 'rgba(15, 23, 42, 0.8)', 
                              color: '#fff', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              padding: '8px 12px', 
                              borderRadius: '10px',
                              fontSize: '0.85rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          
                          <button 
                            onClick={() => updateStatus(item.id, 'Converted')}
                            style={{ 
                              background: 'rgba(34, 197, 94, 0.15)', 
                              color: '#22c55e', 
                              border: '1px solid rgba(34, 197, 94, 0.3)', 
                              padding: '8px 16px', 
                              borderRadius: '10px', 
                              cursor: 'pointer', 
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.background = 'rgba(34, 197, 94, 0.25)'}
                            onMouseLeave={e => e.target.style.background = 'rgba(34, 197, 94, 0.15)'}
                          >🚀 Quick Convert</button>
                        </div>
                      )}
                      {item.status === 'Converted' && (
                        <div style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✅ Converted to Customer
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
