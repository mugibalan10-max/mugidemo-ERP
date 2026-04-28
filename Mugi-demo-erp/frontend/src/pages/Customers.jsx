import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  Users, Plus, Search, Mail, Phone, MoreHorizontal, Download, 
  CreditCard, DollarSign, TrendingUp, AlertTriangle, Building, MapPin, ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [dashboard, setDashboard] = useState({ totalCustomers: 0, totalRevenue: 0, totalOverdue: 0, openTickets: 0, topCustomers: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ 
    name: '', email: '', phone: '', companyName: '', gstNumber: '', 
    billingAddress: '', shippingAddress: '', creditLimit: '', 
    paymentTerms: 'Net 30', customerType: 'Retail' 
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderAmount, setOrderAmount] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const [custRes, dashRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/customers/reports/dashboard')
      ]);
      setCustomers(custRes.data);
      setDashboard(dashRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newClient.name) return alert("Client name is required");
    try {
      await api.post('/api/customers', newClient);
      setShowModal(false);
      setNewClient({ name: '', email: '', phone: '', companyName: '', gstNumber: '', billingAddress: '', shippingAddress: '', creditLimit: '', paymentTerms: 'Net 30', customerType: 'Retail' });
      fetchCustomers();
      alert("Enterprise Client registered successfully! Ledger Auto-Created.");
    } catch (err) {
      alert("Failed to register client");
    }
  };

  const handleTestOrder = async () => {
    try {
      // Sending a dummy single item order to test the credit limit block
      await api.post(`/api/customers/${selectedCustomer.id}/orders`, {
        totalAmount: orderAmount,
        items: [{ productId: 1, quantity: 1, unitPrice: orderAmount }] // Dummy product ID
      });
      alert(`Order processed successfully! Ledger updated by $${orderAmount}`);
      setShowOrderModal(false);
      setOrderAmount('');
      fetchCustomers();
    } catch (err) {
      if (err.response?.status === 403) {
        alert("🚨 ORDER BLOCKED: " + err.response.data.error);
      } else {
        alert("Failed to process order. Ensure product ID 1 exists.");
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const theme = {
    primary: '#0ea5e9', secondary: '#38bdf8', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
    bg: '#f8fafc', card: '#ffffff', textMain: '#0f172a', textMuted: '#64748b', border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <nav style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '8px', fontWeight: '700' }}>
                 <span>Enterprise ERP</span><span>/</span><span style={{ color: theme.primary }}>Customer Master</span>
              </nav>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain, margin: 0 }}>Customer Management</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px' }}>Global registry linked with Sales, Ledgers, and Credit Control.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: theme.primary, color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: `0 10px 15px -3px ${theme.primary}40` }}>
                 <Plus size={18} /> Register Customer
               </button>
            </div>
          </header>

          {/* ERP Financial Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#0ea5e915', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={24} /></div>
                 <Badge text="Active" color={theme.success} bg="#10b98115" />
              </div>
              <p style={statLabel}>Total Customers</p>
              <h3 style={statValue}>{dashboard.totalCustomers}</h3>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#10b98115', color: theme.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={24} /></div>
                 <Badge text="+14% this month" color={theme.success} bg="#10b98115" />
              </div>
              <p style={statLabel}>Total Account Revenue</p>
              <h3 style={statValue}>${dashboard.totalRevenue?.toLocaleString()}</h3>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#ef444415', color: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={24} /></div>
                 <Badge text="Action Required" color={theme.danger} bg="#ef444415" />
              </div>
              <p style={statLabel}>Total Overdue (Receivables)</p>
              <h3 style={statValue}>${dashboard.totalOverdue?.toLocaleString()}</h3>
            </div>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} /> Top Tier Customers</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dashboard.topCustomers?.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{c.name}</span>
                    <span style={{ fontSize: '0.85rem', color: theme.success, fontWeight: '700' }}>${parseFloat(c.revenue).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
               <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
               <input 
                 placeholder="Search by customer name or company..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: `1px solid ${theme.border}`, outline: 'none', fontSize: '1rem', fontWeight: '600', color: theme.textMain, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
               />
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: theme.bg, color: theme.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Customer / Company</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Contact Info</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Credit & Terms</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Ledger Status</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#0ea5e915', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>
                             {c.name.charAt(0)}
                          </div>
                          <div>
                             <p style={{ margin: 0, fontWeight: '800', color: theme.textMain, fontSize: '1.05rem' }}>{c.name}</p>
                             <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}><Building size={12} /> {c.companyName || c.customerType}</p>
                          </div>
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: theme.textMuted, fontWeight: '600' }}><Mail size={14} /> {c.email || 'N/A'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: theme.textMuted, fontWeight: '600' }}><Phone size={14} /> {c.phone || 'N/A'}</div>
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: theme.textMain }}>Limit: ${parseFloat(c.creditLimit).toLocaleString()}</span>
                          <Badge text={c.paymentTerms} color={theme.primary} bg="#0ea5e915" />
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       {c.ledger ? (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                           <span style={{ fontSize: '0.8rem', color: theme.textMuted, fontWeight: '700' }}>Outstanding</span>
                           <span style={{ fontSize: '1.1rem', fontWeight: '800', color: parseFloat(c.ledger.outstandingAmount) > parseFloat(c.creditLimit) ? theme.danger : parseFloat(c.ledger.outstandingAmount) > 0 ? theme.warning : theme.success }}>
                             ${parseFloat(c.ledger.outstandingAmount).toLocaleString()}
                           </span>
                         </div>
                       ) : <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>No Ledger</span>}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                       <button 
                         onClick={() => { setSelectedCustomer(c); setShowOrderModal(true); }}
                         style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                       >
                          Test Order <ArrowRight size={14} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '800px' }}>
             <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: '800', color: theme.textMain }}>Register Enterprise Customer</h2>
             <p style={{ color: theme.textMuted, marginBottom: '32px', fontSize: '0.9rem' }}>This instantly links to Sales, Inventory, and auto-generates a Finance Ledger.</p>
             
             <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div><label style={modalLabel}>Contact Name *</label><input required style={modalInput} value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} /></div>
                   <div><label style={modalLabel}>Company Name</label><input style={modalInput} value={newClient.companyName} onChange={e => setNewClient({...newClient, companyName: e.target.value})} /></div>
                   <div><label style={modalLabel}>Email Address</label><input type="email" style={modalInput} value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} /></div>
                   <div><label style={modalLabel}>Phone Number</label><input style={modalInput} value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} /></div>
                   <div><label style={modalLabel}>GSTIN / Tax ID</label><input style={modalInput} value={newClient.gstNumber} onChange={e => setNewClient({...newClient, gstNumber: e.target.value})} /></div>
                   <div><label style={modalLabel}>Customer Type</label>
                      <select style={modalInput} value={newClient.customerType} onChange={e => setNewClient({...newClient, customerType: e.target.value})}>
                        <option>Retail</option><option>Wholesale</option><option>Distributor</option>
                      </select>
                   </div>
                </div>

                <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafc', border: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div style={{ gridColumn: '1 / -1' }}><h4 style={{ margin: 0, color: theme.textMain, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={16} /> Credit Control Engine</h4></div>
                   <div><label style={modalLabel}>Credit Limit ($)</label><input type="number" style={{ ...modalInput, borderColor: theme.warning }} value={newClient.creditLimit} onChange={e => setNewClient({...newClient, creditLimit: e.target.value})} placeholder="e.g. 50000" /></div>
                   <div><label style={modalLabel}>Payment Terms</label>
                      <select style={modalInput} value={newClient.paymentTerms} onChange={e => setNewClient({...newClient, paymentTerms: e.target.value})}>
                        <option>Due on Receipt</option><option>Net 15</option><option>Net 30</option><option>Net 60</option>
                      </select>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div><label style={modalLabel}>Billing Address</label><textarea style={{ ...modalInput, height: '80px', resize: 'none' }} value={newClient.billingAddress} onChange={e => setNewClient({...newClient, billingAddress: e.target.value})} /></div>
                   <div><label style={modalLabel}>Shipping Address</label><textarea style={{ ...modalInput, height: '80px', resize: 'none' }} value={newClient.shippingAddress} onChange={e => setNewClient({...newClient, shippingAddress: e.target.value})} /></div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '800', cursor: 'pointer', color: theme.textMain }}>Cancel</button>
                   <button type="submit" style={{ flex: 2, padding: '16px', borderRadius: '14px', border: 'none', background: theme.primary, color: 'white', fontWeight: '800', cursor: 'pointer', boxShadow: `0 10px 15px -3px ${theme.primary}40` }}>Deploy Customer Profile</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Credit Block Testing Modal */}
      {showOrderModal && selectedCustomer && (
        <div style={modalOverlay}>
          <div style={modalContent}>
             <h2 style={{ marginBottom: '8px', color: theme.textMain, fontWeight: '800' }}>Test Credit Control</h2>
             <p style={{ color: theme.textMuted, fontSize: '0.85rem', marginBottom: '24px' }}>Attempt to place a Sales Order for <strong style={{ color: theme.textMain }}>{selectedCustomer.name}</strong>. The system will mathematically check this order against their Outstanding Ledger + Credit Limit.</p>
             
             <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: '700' }}>Credit Limit:</span><span style={{ fontWeight: '800' }}>${parseFloat(selectedCustomer.creditLimit).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.85rem', color: theme.textMuted, fontWeight: '700' }}>Current Outstanding:</span><span style={{ fontWeight: '800', color: theme.warning }}>${parseFloat(selectedCustomer.ledger?.outstandingAmount || 0).toLocaleString()}</span></div>
             </div>

             <div style={{ display: 'grid', gap: '20px' }}>
               <div><label style={modalLabel}>Sales Order Amount ($)</label><input type="number" style={modalInput} placeholder="e.g. 10000" value={orderAmount} onChange={e => setOrderAmount(e.target.value)} /></div>
               
               <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button onClick={() => setShowOrderModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '800', cursor: 'pointer', color: theme.textMain }}>Cancel</button>
                  <button onClick={handleTestOrder} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer' }}>
                    Execute Order
                  </button>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

const Badge = ({ text, color, bg }) => (
  <span style={{ fontSize: '0.7rem', fontWeight: '800', color, background: bg, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</span>
);

const cardStyle = { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const statLabel = { margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#64748b' };
const statValue = { margin: '8px 0 0', fontSize: '2rem', fontWeight: '800', color: '#0f172a' };

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent = { background: 'white', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalLabel = { display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', fontWeight: '600', color: '#0f172a' };
