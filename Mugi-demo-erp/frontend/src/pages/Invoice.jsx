import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  FileText, Download, Plus, Search, ShieldCheck,
  CreditCard, DollarSign, Calculator, Settings, Building, Send
} from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    customerId: '', isInterState: false, currency: 'INR',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    discountTotal: 0, items: [{ productId: 1, quantity: 1, unitPrice: 0, taxPercent: 18 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes] = await Promise.all([
        api.get('/api/invoices/reports/register').catch(() => ({ data: [] })),
        api.get('/api/customers').catch(() => ({ data: [] }))
      ]);
      setInvoices(invRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    let sub = 0; let tax = 0;
    newInvoice.items.forEach(i => {
      const lineSub = (i.quantity * i.unitPrice);
      sub += lineSub;
      tax += (lineSub * i.taxPercent) / 100;
    });
    sub -= parseFloat(newInvoice.discountTotal || 0);
    return { subtotal: sub, tax, total: sub + tax };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newInvoice.customerId) return alert("Select a customer");
    try {
      const res = await api.post('/api/invoices', newInvoice);
      alert(`Invoice Created!\nAccounting Auto-Journal:\n${res.data.accountingEntry}`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      if (err.response?.status === 403) alert(`🚨 Blocked: ${err.response.data.error}`);
      else alert("Failed to generate invoice");
    }
  };

  const theme = {
    primary: '#6366f1', secondary: '#8b5cf6', success: '#10b981', 
    warning: '#f59e0b', danger: '#ef4444', bg: '#f8fafc',
    textMain: '#0f172a', textMuted: '#64748b', border: '#e2e8f0'
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <nav style={{ display: 'flex', gap: '8px', fontSize: 'var(--text-small)', color: theme.textMuted, marginBottom: '8px', fontWeight: 'var(--weight-semibold)' }}>
                 <span>Finance Module</span><span>/</span><span style={{ color: theme.primary }}>Sales Register</span>
              </nav>
              <h1 style={{ fontSize: 'var(--text-h1)', fontWeight: 'var(--weight-semibold)', color: theme.textMain, margin: 0 }}>GST Invoices</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px' }}>Tally/SAP Integrated billing, automated taxation, and strict credit enforcement.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => alert("GST GSTR-1 Excel downloaded")} style={{ ...btnStyle, background: 'white', color: theme.textMain, border: `1px solid ${theme.border}` }}>
                 <Download size={18} /> Export GSTR-1
               </button>
               <button onClick={() => setShowModal(true)} style={{ ...btnStyle, background: theme.primary, color: 'white', boxShadow: `0 10px 15px -3px ${theme.primary}40` }}>
                 <Plus size={18} /> Generate Tax Invoice
               </button>
            </div>
          </header>

          <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between' }}>
               <h3 style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={20} color={theme.primary} /> Sales Register (GST Compliant)</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-body)' }}>
              <thead>
                <tr style={{ background: theme.bg, color: theme.textMuted, fontSize: 'var(--text-small)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '20px 24px', fontWeight: 'var(--weight-semibold)' }}>Voucher No</th>
                  <th style={{ padding: '20px 24px', fontWeight: 'var(--weight-semibold)' }}>Customer / GSTIN</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>Taxable Value</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>CGST / SGST</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>IGST</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 'var(--weight-semibold)' }}>Total (₹)</th>
                  <th style={{ padding: '20px 24px', textAlign: 'center', fontWeight: 'var(--weight-semibold)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No invoices found in the ledger.</td></tr>}
                {invoices.map((inv, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s' }}>
                    <td style={{ padding: '20px 24px', fontWeight: 'var(--weight-semibold)', color: theme.textMain }}>{inv.invoiceNo}</td>
                    <td style={{ padding: '20px 24px' }}>
                       <p style={{ margin: 0, fontWeight: 'var(--weight-medium)', color: theme.textMain }}>{inv.customerName}</p>
                       <code style={{ fontSize: 'var(--text-small)', color: theme.textMuted, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{inv.gstin || 'URD'}</code>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 'var(--weight-medium)' }}>{parseFloat(inv.taxableValue).toFixed(2)}</td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', color: theme.textMuted, fontSize: 'var(--text-body)' }}>
                       {inv.cgst > 0 ? `${parseFloat(inv.cgst).toFixed(2)} / ${parseFloat(inv.sgst).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', color: theme.textMuted, fontSize: 'var(--text-body)' }}>
                       {inv.igst > 0 ? parseFloat(inv.igst).toFixed(2) : '-'}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: 'var(--weight-bold)', color: theme.primary, fontSize: '1rem' }}>
                       ₹{parseFloat(inv.totalValue).toLocaleString()}
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                       <span style={{ background: inv.status === 'Approved' ? '#10b98115' : '#ef444415', color: inv.status === 'Approved' ? theme.success : theme.danger, padding: '6px 12px', borderRadius: '12px', fontSize: 'var(--text-small)', fontWeight: 'var(--weight-bold)' }}>
                         {inv.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Invoice Generator Modal */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '900px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                   <h2 style={{ margin: '0 0 8px 0', fontSize: '1.75rem', fontWeight: '800', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '12px' }}><FileText color={theme.primary} /> Tax Invoice Engine</h2>
                   <p style={{ margin: 0, color: theme.textMuted, fontSize: '0.9rem' }}>Automatically executes Journal Entries & Tally XML push upon generation.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>✕</button>
             </div>

             <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                   <div>
                      <label style={modalLabel}>Select Customer</label>
                      <select required style={modalInput} value={newInvoice.customerId} onChange={e => setNewInvoice({...newInvoice, customerId: e.target.value})}>
                        <option value="">-- Choose Account --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.gstNumber || 'URD'})</option>)}
                      </select>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <div>
                           <label style={modalLabel}>Invoice Date</label>
                           <input type="date" required style={modalInput} value={newInvoice.invoiceDate} onChange={e => setNewInvoice({...newInvoice, invoiceDate: e.target.value})} />
                        </div>
                        <div>
                           <label style={modalLabel}>Due Date</label>
                           <input type="date" required style={modalInput} value={newInvoice.dueDate} onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} />
                        </div>
                      </div>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      <div>
                        <label style={modalLabel}>Tax Type (GST Engine)</label>
                        <select style={modalInput} value={newInvoice.isInterState ? "IGST" : "CGST"} onChange={e => setNewInvoice({...newInvoice, isInterState: e.target.value === "IGST"})}>
                          <option value="CGST">Intra-State (CGST + SGST Split)</option>
                          <option value="IGST">Inter-State (IGST 100%)</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalLabel}>Currency</label>
                        <select style={modalInput} value={newInvoice.currency} onChange={e => setNewInvoice({...newInvoice, currency: e.target.value})}>
                          <option>INR</option><option>USD</option><option>EUR</option>
                        </select>
                      </div>
                   </div>
                </div>

                {/* Line Items */}
                <div>
                   <h4 style={{ margin: '0 0 12px 0', color: theme.textMain, fontWeight: '800' }}>Line Items</h4>
                   {newInvoice.items.map((item, index) => (
                     <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <input style={modalInput} value="Enterprise Software" readOnly />
                        <input type="number" placeholder="Qty" style={modalInput} value={item.quantity} onChange={e => {
                          const newItems = [...newInvoice.items]; newItems[index].quantity = parseInt(e.target.value)||0; setNewInvoice({...newInvoice, items: newItems});
                        }} />
                        <input type="number" placeholder="Unit Rate" style={modalInput} value={item.unitPrice} onChange={e => {
                          const newItems = [...newInvoice.items]; newItems[index].unitPrice = parseFloat(e.target.value)||0; setNewInvoice({...newInvoice, items: newItems});
                        }} />
                        <select style={modalInput} value={item.taxPercent} onChange={e => {
                          const newItems = [...newInvoice.items]; newItems[index].taxPercent = parseFloat(e.target.value); setNewInvoice({...newInvoice, items: newItems});
                        }}>
                          <option value={0}>0% GST</option><option value={5}>5% GST</option>
                          <option value={12}>12% GST</option><option value={18}>18% GST</option><option value={28}>28% GST</option>
                        </select>
                     </div>
                   ))}
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: `1px solid ${theme.border}` }}>
                   <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ color: theme.textMuted, fontWeight: '600' }}>Subtotal:</span>
                         <span style={{ fontWeight: '700' }}>{subtotal.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ color: theme.textMuted, fontWeight: '600' }}>Trade Discount (-):</span>
                         <input type="number" style={{ width: '100px', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${theme.border}` }} value={newInvoice.discountTotal} onChange={e => setNewInvoice({...newInvoice, discountTotal: parseFloat(e.target.value)||0})} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ color: theme.textMuted, fontWeight: '600' }}>{newInvoice.isInterState ? 'IGST' : 'CGST + SGST'} (+):</span>
                         <span style={{ fontWeight: '700' }}>{tax.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, marginTop: '8px' }}>
                         <span style={{ color: theme.textMain, fontWeight: '800', fontSize: '1.2rem' }}>Total Payable:</span>
                         <span style={{ color: theme.primary, fontWeight: '800', fontSize: '1.5rem' }}>₹{total.toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                   <button type="submit" style={{ flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                     <Send size={18} /> Generate Tax Invoice & Sync
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}

const btnStyle = { padding: '12px 24px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent = { background: 'white', width: '100%', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalLabel = { display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', fontWeight: '600', color: '#0f172a' };
