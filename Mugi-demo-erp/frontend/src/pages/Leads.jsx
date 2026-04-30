import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  Users, Mail, PhoneCall, TrendingUp, Calendar, AlertCircle, Plus, 
  ArrowRight, Search, Award, MessageSquare, Zap
} from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [dashboard, setDashboard] = useState({ totalLeads: 0, wonLeads: 0, conversionRate: '0%' });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '', source: 'Website', tags: '' });
  const [newActivity, setNewActivity] = useState({ type: 'Call', description: '', completed: true });
  const [convertData, setConvertData] = useState({ expectedValue: '', closeDate: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, dashRes] = await Promise.all([
        api.get('/api/leads'),
        api.get('/api/leads/reports/dashboard')
      ]);
      setLeads(leadsRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setLoading(false);
    }
  };

  const createLead = async () => {
    if (!newLead.name) return alert("Name is required");
    try {
      await api.post('/api/leads', { 
        ...newLead, 
        tags: newLead.tags ? JSON.stringify(newLead.tags.split(',').map(t => t.trim())) : undefined 
      });
      setShowLeadModal(false);
      setNewLead({ name: '', email: '', phone: '', company: '', source: 'Website', tags: '' });
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) alert("Duplicate lead detected! Phone or Email already exists.");
      else alert("Failed to create lead");
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      await api.patch(`/api/leads/${leadId}`, { status });
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const logActivity = async () => {
    try {
      await api.post(`/api/leads/${selectedLead.id}/activities`, newActivity);
      setShowActivityModal(false);
      setNewActivity({ type: 'Call', description: '', completed: true });
      fetchData();
    } catch (err) {
      alert("Failed to log activity");
    }
  };

  const convertLead = async () => {
    try {
      await api.post(`/api/leads/${selectedLead.id}/convert`, convertData);
      setShowConvertModal(false);
      setConvertData({ expectedValue: '', closeDate: '' });
      alert("🚀 Lead successfully converted to Customer & Opportunity!");
      fetchData();
    } catch (err) {
      alert("Failed to convert lead");
    }
  };

  const theme = {
    primary: '#4f46e5', secondary: '#8b5cf6', success: '#10b981', warning: '#f59e0b',
    danger: '#ef4444', bg: '#f8fafc', textMain: '#0f172a', textMuted: '#64748b', border: '#e2e8f0'
  };

  const PIPELINE_STAGES = [
    { id: 'New', label: 'New Lead', color: '#94a3b8' },
    { id: 'Contacted', label: 'Contacted', color: '#3b82f6' },
    { id: 'Qualified', label: 'Qualified', color: '#8b5cf6' },
    { id: 'Proposal Sent', label: 'Proposal Sent', color: '#f59e0b' },
    { id: 'Won', label: 'Won / Deal', color: '#10b981' },
    { id: 'Lost', label: 'Lost', color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: theme.bg }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: theme.primary, borderRadius: '50%' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: theme.textMain }}>CRM Pipeline</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px' }}>Lead Management & Sales Automation Dashboard.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button 
                onClick={() => setShowLeadModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: theme.primary, color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
              >
                <Plus size={18} /> Add New Lead
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Total Pipeline Leads</h4>
                    <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: '800' }}>{dashboard.totalLeads}</p>
                 </div>
                 <Users size={32} style={{ opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Won Deals</h4>
                    <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: '800' }}>{dashboard.wonLeads}</p>
                 </div>
                 <Award size={32} style={{ opacity: 0.5 }} />
              </div>
            </div>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>Conversion Rate</h4>
                    <p style={{ margin: '8px 0 0', fontSize: '2rem', fontWeight: '800' }}>{dashboard.conversionRate}</p>
                 </div>
                 <TrendingUp size={32} style={{ opacity: 0.5 }} />
              </div>
            </div>
          </div>

          {/* Kanban Pipeline */}
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', minHeight: '600px' }}>
             {PIPELINE_STAGES.map(stage => {
               const stageLeads = leads.filter(l => l.status === stage.id);
               return (
                 <div key={stage.id} style={{ minWidth: '320px', width: '320px', background: '#f1f5f9', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
                       <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: stage.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} /> {stage.label}
                       </h4>
                       <span style={{ fontSize: '0.75rem', fontWeight: '800', color: theme.textMuted, background: '#e2e8f0', padding: '4px 10px', borderRadius: '12px' }}>{stageLeads.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                       {stageLeads.map(lead => (
                         <div key={lead.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: `1px solid ${theme.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                               <div style={{ display: 'flex', gap: '6px' }}>
                                 <span style={{ fontSize: '0.65rem', fontWeight: '800', color: theme.primary, background: '#4f46e515', padding: '4px 8px', borderRadius: '6px' }}>Score: {lead.score}</span>
                                 <span style={{ fontSize: '0.65rem', fontWeight: '800', color: theme.textMuted, background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>{lead.source}</span>
                               </div>
                               <select 
                                 value={lead.status} 
                                 onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                 style={{ fontSize: '0.7rem', fontWeight: '700', border: 'none', background: 'transparent', outline: 'none', color: theme.textMuted, cursor: 'pointer' }}
                               >
                                 {PIPELINE_STAGES.map(s => <option key={s.id} value={s.id}>Move to {s.label}</option>)}
                               </select>
                            </div>

                            <h5 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '800', color: theme.textMain }}>{lead.name}</h5>
                            <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: theme.textMuted, fontWeight: '600' }}>{lead.company || 'Individual'}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: theme.textMuted }}>
                                 <Mail size={14} /> {lead.email || 'No email'}
                               </div>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: theme.textMuted }}>
                                 <PhoneCall size={14} /> {lead.phone || 'No phone'}
                               </div>
                            </div>

                            {/* Tags */}
                            {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                {lead.tags.map((tag, idx) => (
                                  <span key={idx} style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', color: theme.textMuted, fontWeight: '600' }}>#{tag}</span>
                                ))}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px' }}>
                               <button 
                                 onClick={() => { setSelectedLead(lead); setShowActivityModal(true); }}
                                 style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#f8fafc', border: `1px solid ${theme.border}`, fontSize: '0.75rem', fontWeight: '700', color: theme.textMain, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                               >
                                 <MessageSquare size={14} /> Activity
                               </button>
                               {lead.status !== 'Won' && (
                                 <button 
                                   onClick={() => { setSelectedLead(lead); setShowConvertModal(true); }}
                                   style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#10b98115', border: '1px solid #10b98130', fontSize: '0.75rem', fontWeight: '700', color: theme.success, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                 >
                                   <Zap size={14} /> Convert
                                 </button>
                               )}
                            </div>
                         </div>
                       ))}
                       {stageLeads.length === 0 && (
                         <div style={{ textAlign: 'center', padding: '32px 0', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', border: '2px dashed #cbd5e1', borderRadius: '16px' }}>Drop leads here</div>
                       )}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </main>

      {/* MODALS */}
      {showLeadModal && (
        <div style={modalOverlay}>
           <div style={modalContent}>
              <h2 style={{ marginBottom: '24px' }}>Create New Lead</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Full Name *</label><input style={modalInput} placeholder="e.g. Sarah Jenkins" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} /></div>
                <div><label style={modalLabel}>Email</label><input type="email" style={modalInput} placeholder="sarah@example.com" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} /></div>
                <div><label style={modalLabel}>Phone</label><input style={modalInput} placeholder="+1 234 567 890" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} /></div>
                <div><label style={modalLabel}>Company</label><input style={modalInput} placeholder="Acme Corp" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} /></div>
                <div><label style={modalLabel}>Source</label>
                  <select style={modalInput} value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                    <option>Website</option><option>WhatsApp</option><option>Ads</option><option>Manual</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Tags (Comma separated)</label><input style={modalInput} placeholder="e.g. Enterprise, High Priority" value={newLead.tags} onChange={e => setNewLead({...newLead, tags: e.target.value})} /></div>
                
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button onClick={() => setShowLeadModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={createLead} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Save Lead</button>
                </div>
              </div>
           </div>
        </div>
      )}

       {showActivityModal && (
        <div style={modalOverlay}>
           <div style={{ ...modalContent, maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Activity & Interactions</h2>
                  <p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: '4px 0 0' }}>History for {selectedLead?.name}</p>
                </div>
                <button onClick={() => setShowActivityModal(false)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
              </div>

              {/* Activity History */}
              <div style={{ marginBottom: '32px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '16px', letterSpacing: '0.1em' }}>Interaction History</h4>
                {selectedLead?.activities && selectedLead.activities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[...selectedLead.activities].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((act, idx) => (
                      <div key={idx} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.primary, background: `${theme.primary}10`, padding: '2px 8px', borderRadius: '4px' }}>{act.type.toUpperCase()}</span>
                          <span style={{ fontSize: '0.7rem', color: theme.textMuted }}>{new Date(act.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMain, lineHeight: 1.5 }}>{act.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: `1px dashed ${theme.border}`, color: theme.textMuted, fontSize: '0.85rem' }}>No activities logged yet.</div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '24px' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: theme.textMuted, marginBottom: '16px', letterSpacing: '0.1em' }}>Log New Activity</h4>
                <div style={{ display: 'grid', gap: '20px' }}>
                  <div>
                    <label style={modalLabel}>Activity Type</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['Call', 'Email', 'Meeting', 'Note'].map(type => (
                        <button 
                          key={type}
                          onClick={() => setNewActivity({...newActivity, type})}
                          style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${newActivity.type === type ? theme.primary : theme.border}`,
                            background: newActivity.type === type ? `${theme.primary}10` : 'white',
                            color: newActivity.type === type ? theme.primary : theme.textMuted,
                            fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label style={modalLabel}>Description / Notes</label><textarea style={{ ...modalInput, height: '80px', resize: 'none' }} placeholder="Discussed requirements, follow up next week..." value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} /></div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setShowActivityModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                    <button 
                      onClick={logActivity} 
                      disabled={!newActivity.description}
                      style={{ 
                        flex: 2, padding: '14px', borderRadius: '12px', border: 'none', 
                        background: newActivity.description ? theme.primary : '#cbd5e1', 
                        color: 'white', fontWeight: '700', cursor: newActivity.description ? 'pointer' : 'not-allowed' 
                      }}
                    >
                      Log Interaction (+Score)
                    </button>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {showConvertModal && (
        <div style={modalOverlay}>
           <div style={modalContent}>
              <h2 style={{ marginBottom: '8px', color: theme.success }}>Convert to Deal/Customer</h2>
              <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginBottom: '24px' }}>You are about to convert {selectedLead?.name} from a Lead into an active Customer Account and Deal Opportunity.</p>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div><label style={modalLabel}>Expected Deal Value ($)</label><input type="number" style={modalInput} placeholder="e.g. 5000" value={convertData.expectedValue} onChange={e => setConvertData({...convertData, expectedValue: e.target.value})} /></div>
                <div><label style={modalLabel}>Expected Close Date</label><input type="date" style={modalInput} value={convertData.closeDate} onChange={e => setConvertData({...convertData, closeDate: e.target.value})} /></div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button onClick={() => setShowConvertModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={convertLead} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.success, color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                     <Zap size={18} /> Convert Lead
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const cardStyle = { padding: '24px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: 'white', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalLabel = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' };
