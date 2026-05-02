import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  Users, Mail, PhoneCall, TrendingUp, Calendar, AlertCircle, Plus, 
  ArrowRight, Search, Award, MessageSquare, Zap, Filter, MoreVertical,
  CheckCircle2, XCircle, Clock, DollarSign, Briefcase, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [dashboard, setDashboard] = useState({ 
    totalLeads: 0, wonLeads: 0, lostLeads: 0, conversionRate: '0%', 
    stageStats: [], sourceStats: [] 
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // kanban or list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('All');

  // Modals
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const [selectedLead, setSelectedLead] = useState(null);
  const [savingLead, setSavingLead] = useState(false);
  const [newLead, setNewLead] = useState({ 
    name: '', email: '', phone: '', company: '', source: 'Manual', 
    budget: '', requirement: '', priority: 'Medium', isDecisionMaker: false, isQualified: false 
  });
  const [newActivity, setNewActivity] = useState({ 
    type: 'Call', notes: '', nextFollowupDate: '' 
  });
  const [lostReason, setLostReason] = useState('Price Issue');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, dashRes] = await Promise.all([
        api.get(`/api/leads?search=${searchQuery}${filterSource !== 'All' ? `&source=${filterSource}` : ''}`),
        api.get('/api/leads/reports/dashboard')
      ]);
      setLeads(leadsRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      console.error("Error fetching leads:", err);
      toast.error("Failed to load leads data");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterSource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateLead = async () => {
    if (!newLead.name) return toast.error("Full Name is required");
    setSavingLead(true);
    try {
      // Clean budget of any non-numeric chars except period
      const cleanBudget = newLead.budget ? newLead.budget.toString().replace(/[^0-9.]/g, '') : '';
      
      await api.post('/api/leads', { ...newLead, budget: cleanBudget });
      toast.success("Lead created & auto-assigned successfully");
      setShowLeadModal(false);
      setNewLead({ 
        name: '', email: '', phone: '', company: '', source: 'Manual', 
        budget: '', requirement: '', priority: 'Medium', isDecisionMaker: false, isQualified: false 
      });
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Connection error. Please check if backend is running.";
      toast.error(errorMsg);
    } finally {
      setSavingLead(false);
    }
  };

  const handleUpdateStatus = async (leadId, status, extraData = {}) => {
    try {
      const res = await api.patch(`/api/leads/${leadId}`, { status, ...extraData });
      toast.success(`Pipeline updated successfully`);
      fetchData();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, ...res.data });
      }
      if (showLostModal) setShowLostModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleLogActivity = async () => {
    if (!newActivity.notes) return toast.error("Activity notes are required");
    try {
      await api.post(`/api/leads/${selectedLead.id}/activities`, newActivity);
      toast.success("Activity logged");
      setShowActivityModal(false);
      setNewActivity({ type: 'Call', notes: '', nextFollowupDate: '' });
      fetchData();
    } catch (err) {
      toast.error("Failed to log activity");
    }
  };

  const handleConvertLead = async (leadId) => {
    try {
      await handleUpdateStatus(leadId, 'Won');
      setShowConvertModal(false);
      toast.success("🚀 Lead converted to Customer & Contact!");
    } catch (err) {
      toast.error("Conversion failed");
    }
  };

  const PIPELINE_STAGES = [
    { id: 'New', label: 'New Lead', color: '#64748b' },
    { id: 'Contacted', label: 'Contacted', color: '#3b82f6' },
    { id: 'Qualified', label: 'Qualified', color: '#8b5cf6' },
    { id: 'Proposal', label: 'Proposal', color: '#f59e0b' },
    { id: 'Negotiation', label: 'Negotiation', color: '#ec4899' },
    { id: 'Won', label: 'Won', color: '#10b981' },
    { id: 'Lost', label: 'Lost', color: '#ef4444' }
  ];

  const theme = {
    primary: '#4f46e5', secondary: '#8b5cf6', success: '#10b981', warning: '#f59e0b',
    danger: '#ef4444', bg: '#f8fafc', textMain: '#0f172a', textMuted: '#64748b', border: '#e2e8f0'
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading && leads.length === 0) {
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
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 'var(--weight-semibold)', color: theme.textMain, letterSpacing: '-0.01em' }}>Enterprise CRM</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px', fontWeight: 'var(--weight-medium)' }}>Manage your high-value sales pipeline and conversion.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <div style={{ position: 'relative' }}>
                 <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                 <input 
                   type="text" 
                   placeholder="Search leads..." 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   style={{ padding: '12px 12px 12px 42px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', outline: 'none', width: '280px', fontWeight: 'var(--weight-medium)' }}
                 />
               </div>
               <button 
                onClick={() => setShowLeadModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: 'var(--weight-bold)', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
              >
                <Plus size={18} /> New Lead
              </button>
            </div>
          </header>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <div style={{ ...kpiCard, background: 'white' }}>
              <div style={{ background: '#4f46e515', color: theme.primary, ...iconBox }}><Users size={20} /></div>
              <div>
                <p style={kpiLabel}>Total Pipeline</p>
                <h3 style={kpiValue}>{dashboard.totalLeads}</h3>
              </div>
            </div>
            <div style={{ ...kpiCard, background: 'white' }}>
              <div style={{ background: '#10b98115', color: theme.success, ...iconBox }}><Award size={20} /></div>
              <div>
                <p style={kpiLabel}>Conversion Rate</p>
                <h3 style={kpiValue}>{dashboard.conversionRate}</h3>
              </div>
            </div>
            <div style={{ ...kpiCard, background: 'white' }}>
              <div style={{ background: '#f59e0b15', color: theme.warning, ...iconBox }}><Zap size={20} /></div>
              <div>
                <p style={kpiLabel}>Won Deals</p>
                <h3 style={kpiValue}>{dashboard.wonLeads}</h3>
              </div>
            </div>
            <div style={{ ...kpiCard, background: 'white' }}>
              <div style={{ background: '#ef444415', color: theme.danger, ...iconBox }}><XCircle size={20} /></div>
              <div>
                <p style={kpiLabel}>Lost Leads</p>
                <h3 style={kpiValue}>{dashboard.lostLeads}</h3>
              </div>
            </div>
          </div>

          {/* Kanban Pipeline */}
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '24px', minHeight: 'calc(100vh - 400px)' }}>
             {PIPELINE_STAGES.map(stage => {
               const stageLeads = leads.filter(l => l.status === stage.id);
               return (
                 <div key={stage.id} style={{ minWidth: '300px', width: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
                       <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                          {stage.label}
                       </h4>
                       <span style={{ fontSize: '0.75rem', fontWeight: '700', color: theme.textMuted, background: '#e2e8f0', padding: '2px 8px', borderRadius: '20px' }}>{stageLeads.length}</span>
                    </div>

                    <div 
                      className="stage-column"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const leadId = e.dataTransfer.getData("leadId");
                        handleUpdateStatus(parseInt(leadId), stage.id);
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: '400px', borderRadius: '16px', transition: 'background 0.2s' }}
                    >
                       {stageLeads.map(lead => (
                         <div 
                           key={lead.id} 
                           draggable={true}
                           onDragStart={(e) => {
                             e.dataTransfer.setData("leadId", lead.id.toString());
                           }}
                           onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                           style={{ 
                             background: 'white', padding: '16px', borderRadius: '16px', 
                             boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: isOverdue(lead.nextFollowupDate) ? `2px solid ${theme.danger}` : `1px solid ${theme.border}`,
                             cursor: 'grab', transition: 'all 0.2s ease', position: 'relative'
                           }}
                           className="lead-card"
                         >
                            {isOverdue(lead.nextFollowupDate) && (
                              <div style={{ position: 'absolute', top: -10, right: 10, background: theme.danger, color: 'white', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>OVERDUE</div>
                            )}
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                               <span style={{ fontSize: '0.65rem', fontWeight: '700', color: lead.priority === 'High' ? theme.danger : lead.priority === 'Medium' ? theme.warning : theme.success, background: lead.priority === 'High' ? '#ef444410' : lead.priority === 'Medium' ? '#f59e0b10' : '#10b98110', padding: '2px 8px', borderRadius: '6px' }}>{lead.priority}</span>
                               <span style={{ fontSize: '0.65rem', fontWeight: '700', color: theme.textMuted }}>{lead.source}</span>
                            </div>

                            <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700', color: theme.textMain }}>{lead.name}</h5>
                            <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: theme.textMuted, fontWeight: '500' }}>{lead.company || 'Private Individual'}</p>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                               {lead.budget && (
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: theme.textMuted, fontWeight: '600' }}>
                                   <DollarSign size={12} /> {parseFloat(lead.budget).toLocaleString()}
                                 </div>
                               )}
                               {lead.nextFollowupDate && (
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: isOverdue(lead.nextFollowupDate) ? theme.danger : theme.textMuted, fontWeight: '700' }}>
                                   <Clock size={12} /> {new Date(lead.nextFollowupDate).toLocaleDateString()}
                                 </div>
                               )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowActivityModal(true); }}
                                 style={{ flex: 1, padding: '6px', borderRadius: '8px', background: '#f8fafc', border: `1px solid ${theme.border}`, fontSize: '0.7rem', fontWeight: '700', color: theme.textMain, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                               >
                                 <MessageSquare size={12} /> Log
                               </button>
                               {lead.status === 'Negotiation' && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowConvertModal(true); }}
                                   style={{ flex: 1, padding: '6px', borderRadius: '8px', background: `${theme.success}15`, border: `1px solid ${theme.success}30`, fontSize: '0.7rem', fontWeight: '700', color: theme.success, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                                 >
                                   <Zap size={12} /> Win
                                 </button>
                               )}
                            </div>
                         </div>
                       ))}
                       {stageLeads.length === 0 && (
                         <div style={{ textAlign: 'center', padding: '24px 0', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600', border: '2px dashed #e2e8f0', borderRadius: '16px', flex: 1 }}>Empty stage</div>
                       )}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </main>

      {/* LEAD CREATION MODAL */}
      {showLeadModal && (
        <div style={modalOverlay}>
           <div style={{ ...modalContent, maxWidth: '700px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Create New CRM Lead</h2>
                <button onClick={() => setShowLeadModal(false)} style={closeBtn}>&times;</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Prospect Full Name *</label><input style={modalInput} placeholder="e.g. Robert Smith" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} /></div>
                <div><label style={modalLabel}>Email Address</label><input type="email" style={modalInput} placeholder="robert@company.com" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} /></div>
                <div><label style={modalLabel}>Phone Number</label><input style={modalInput} placeholder="+91 98765 43210" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} /></div>
                <div><label style={modalLabel}>Company Name</label><input style={modalInput} placeholder="Acme Enterprises" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} /></div>
                <div><label style={modalLabel}>Lead Source</label>
                  <select style={modalInput} value={newLead.source} onChange={e => setNewLead({...newLead, source: e.target.value})}>
                    <option>Website</option><option>WhatsApp</option><option>Call</option><option>Referral</option><option>Ads</option><option>Manual</option>
                  </select>
                </div>
                <div><label style={modalLabel}>Estimated Budget ($)</label><input type="number" style={modalInput} placeholder="50000" value={newLead.budget} onChange={e => setNewLead({...newLead, budget: e.target.value})} /></div>
                <div><label style={modalLabel}>Priority Level</label>
                  <select style={modalInput} value={newLead.priority} onChange={e => setNewLead({...newLead, priority: e.target.value})}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Requirement Details</label><textarea style={{ ...modalInput, height: '80px' }} placeholder="Needs custom ERP integration for finance..." value={newLead.requirement} onChange={e => setNewLead({...newLead, requirement: e.target.value})} /></div>
                
                <div style={{ display: 'flex', gap: '20px', gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newLead.isDecisionMaker} onChange={e => setNewLead({...newLead, isDecisionMaker: e.target.checked})} /> Decision Maker?
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>
                    <input type="checkbox" checked={newLead.isQualified} onChange={e => setNewLead({...newLead, isQualified: e.target.checked})} /> Pre-Qualified?
                  </label>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button onClick={() => setShowLeadModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                   <button 
                     onClick={handleCreateLead} 
                     disabled={savingLead}
                     style={{ 
                       flex: 2, padding: '14px', borderRadius: '12px', border: 'none', 
                       background: savingLead ? '#94a3b8' : theme.primary, 
                       color: 'white', fontWeight: '700', cursor: savingLead ? 'not-allowed' : 'pointer' 
                     }}
                   >
                     {savingLead ? 'Initializing...' : 'Save & Initialize'}
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* LEAD DETAIL MODAL (MAIN VIEW) */}
      {showDetailModal && selectedLead && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '1000px', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '0', padding: 0, overflow: 'hidden' }}>
            {/* Sidebar info */}
            <div style={{ background: '#f8fafc', padding: '32px', borderRight: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.primary, background: `${theme.primary}15`, padding: '4px 12px', borderRadius: '20px' }}>{selectedLead.status}</span>
                 <button onClick={() => setShowDetailModal(false)} style={closeBtn}>&times;</button>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 8px 0' }}>{selectedLead.name}</h2>
              <p style={{ color: theme.textMuted, fontSize: '0.875rem', fontWeight: '500', marginBottom: '24px' }}>{selectedLead.company}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                <div style={infoRow}><Mail size={16} /> {selectedLead.email || 'N/A'}</div>
                <div style={infoRow}><PhoneCall size={16} /> {selectedLead.phone || 'N/A'}</div>
                <div style={infoRow}><DollarSign size={16} /> Budget: {selectedLead.budget ? `$${selectedLead.budget}` : 'Not set'}</div>
                
                <div style={{ ...infoRow, cursor: 'pointer' }} onClick={() => handleUpdateStatus(selectedLead.id, selectedLead.status, { isQualified: !selectedLead.isQualified })}>
                  <CheckCircle2 size={16} color={selectedLead.isQualified ? theme.success : theme.textMuted} /> 
                  <span style={{ color: selectedLead.isQualified ? theme.success : theme.textMuted, fontWeight: '700' }}>
                    {selectedLead.isQualified ? 'Qualified Lead' : 'Mark as Qualified'}
                  </span>
                </div>

                <div style={{ ...infoRow, cursor: 'pointer' }} onClick={() => handleUpdateStatus(selectedLead.id, selectedLead.status, { isDecisionMaker: !selectedLead.isDecisionMaker })}>
                  <UserCheck size={16} color={selectedLead.isDecisionMaker ? theme.primary : theme.textMuted} />
                  <span style={{ color: selectedLead.isDecisionMaker ? theme.primary : theme.textMuted, fontWeight: '700' }}>
                    {selectedLead.isDecisionMaker ? 'Decision Maker Identified' : 'Verify Decision Maker'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={modalLabel}>Pipeline Control</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PIPELINE_STAGES.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => s.id === 'Lost' ? setShowLostModal(true) : handleUpdateStatus(selectedLead.id, s.id)}
                      disabled={selectedLead.status === s.id}
                      style={{ 
                        padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '700', 
                        border: `1px solid ${selectedLead.status === s.id ? s.color : theme.border}`,
                        background: selectedLead.status === s.id ? s.color : 'white',
                        color: selectedLead.status === s.id ? 'white' : theme.textMuted,
                        cursor: selectedLead.status === s.id ? 'default' : 'pointer'
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowActivityModal(true)}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Add Interaction
              </button>
            </div>

            {/* Main content timeline */}
            <div style={{ padding: '32px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px' }}>Requirement Overview</h4>
                <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '16px', fontSize: '0.875rem', color: theme.textMain, lineHeight: '1.6' }}>
                  {selectedLead.requirement || "No detailed requirement captured yet."}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>Quotations</h4>
                  <button 
                    onClick={() => {
                      const amount = prompt("Enter Quotation Total Amount:");
                      if (amount) {
                        api.post('/api/quotations', { 
                          leadId: selectedLead.id, 
                          totalAmount: amount,
                          items: [{ description: 'Main Service/Product', quantity: 1, unitPrice: amount }]
                        }).then(() => {
                          toast.success("Quotation generated");
                          fetchData();
                        });
                      }
                    }}
                    style={{ fontSize: '0.75rem', fontWeight: '700', color: theme.primary, background: 'none', border: 'none', cursor: 'pointer' }}
                  >+ New Quote</button>
                </div>
                {selectedLead.quotations?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedLead.quotations.map((q, i) => (
                      <div key={i} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>{q.quotationNo}</div>
                            <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>Total: ${parseFloat(q.totalAmount).toLocaleString()}</div>
                         </div>
                         <span style={{ fontSize: '0.65rem', fontWeight: '800', color: theme.warning, background: `${theme.warning}15`, padding: '2px 8px', borderRadius: '4px' }}>{q.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: theme.textMuted, fontSize: '0.875rem' }}>No quotations yet.</p>
                )}
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '24px' }}>Activity Timeline</h4>
              <div style={{ position: 'relative', paddingLeft: '32px' }}>
                <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: '#e2e8f0' }} />
                {selectedLead.activities?.length > 0 ? selectedLead.activities.map((act, i) => (
                  <div key={i} style={{ marginBottom: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-31px', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: theme.primary, border: '3px solid white' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                       <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.textMain }}>{act.type}</span>
                       <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textMuted, lineHeight: '1.5' }}>{act.notes}</p>
                    {act.nextFollowupDate && (
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: '700', color: theme.secondary }}>Next Follow-up: {new Date(act.nextFollowupDate).toLocaleDateString()}</div>
                    )}
                  </div>
                )) : (
                  <p style={{ color: theme.textMuted, fontSize: '0.875rem' }}>No activities recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY MODAL */}
      {showActivityModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginBottom: '24px' }}>Log Interaction</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={modalLabel}>Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['Call', 'WhatsApp', 'Email', 'Meeting', 'Follow-up'].map(t => (
                    <button 
                      key={t} onClick={() => setNewActivity({...newActivity, type: t})}
                      style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', border: `1px solid ${newActivity.type === t ? theme.primary : theme.border}`, background: newActivity.type === t ? `${theme.primary}10` : 'white', color: newActivity.type === t ? theme.primary : theme.textMuted, cursor: 'pointer' }}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div><label style={modalLabel}>Detailed Notes *</label><textarea style={{ ...modalInput, height: '100px' }} value={newActivity.notes} onChange={e => setNewActivity({...newActivity, notes: e.target.value})} placeholder="What was discussed?" /></div>
              <div><label style={modalLabel}>Next Follow-up Date (Optional)</label><input type="date" style={modalInput} value={newActivity.nextFollowupDate} onChange={e => setNewActivity({...newActivity, nextFollowupDate: e.target.value})} /></div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button onClick={() => setShowActivityModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                 <button onClick={handleLogActivity} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Log Activity</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOST REASON MODAL */}
      {showLostModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{ marginBottom: '8px', color: theme.danger }}>Lead Lost</h2>
            <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginBottom: '24px' }}>Please specify why this lead was lost for future analytics.</p>
            <div style={{ display: 'grid', gap: '20px' }}>
               <div><label style={modalLabel}>Reason Category</label>
                 <select style={modalInput} value={lostReason} onChange={e => setLostReason(e.target.value)}>
                   <option>Price Issue</option><option>Competitor</option><option>No Response</option><option>Not Interested</option><option>Product Fit</option>
                 </select>
               </div>
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button onClick={() => setShowLostModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                 <button onClick={() => handleUpdateStatus(selectedLead.id, 'Lost', { lostReason })} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.danger, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Confirm Lost</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT MODAL */}
      {showConvertModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: '#10b98115', color: theme.success, marginBottom: '16px' }}><Zap size={32} /></div>
              <h2 style={{ margin: 0 }}>Convert to Customer</h2>
              <p style={{ color: theme.textMuted, marginTop: '8px' }}>This will create a permanent Contact and Customer record.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setShowConvertModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
               <button onClick={() => handleConvertLead(selectedLead.id)} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.success, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Process Conversion</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .lead-card:active { cursor: grabbing; }
        .stage-column:hover { background: #f1f5f9; }
        ::-webkit-scrollbar { height: 8px; width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}

const kpiCard = { padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' };
const kpiLabel = { margin: 0, fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const kpiValue = { margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' };
const iconBox = { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: 'white', width: '95%', maxWidth: '500px', padding: '40px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '95vh', overflowY: 'auto' };
const modalLabel = { display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#475569' };
const modalInput = { width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none', fontWeight: '500', transition: 'border-color 0.2s' };
const closeBtn = { background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 };
const infoRow = { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: '#475569', fontWeight: '500' };
