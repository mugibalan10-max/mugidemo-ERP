import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { 
  FileText, CheckCircle, ShieldAlert, CreditCard, 
  ArrowRight, Plus, X, Search, FileSignature 
} from 'lucide-react';

export default function VendorBills() {
  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [pos, setPos] = useState([]);
  const [grns, setGrns] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  
  const [newBill, setNewBill] = useState({
    vendorId: '', poId: '', grnId: '',
    invoiceNumber: '', billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    subtotal: 0, taxAmount: 0, totalAmount: 0
  });

  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentMode: 'Bank Transfer', transactionRef: '', remarks: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billsRes, venRes, poRes, grnRes] = await Promise.all([
        api.get('/api/ap/bills').catch(() => ({ data: [] })),
        api.get('/api/procurement/vendors').catch(() => ({ data: [] })),
        api.get('/api/procurement/po').catch(() => ({ data: [] })),
        api.get('/api/inventory/grn').catch(() => ({ data: [] }))
      ]);
      setBills(billsRes.data);
      setVendors(venRes.data);
      setPos(poRes.data);
      setGrns(grnRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate total
  useEffect(() => {
    setNewBill(prev => ({
        ...prev,
        totalAmount: Number(prev.subtotal) + Number(prev.taxAmount)
    }));
  }, [newBill.subtotal, newBill.taxAmount]);

  const submitBill = async (e) => {
    e.preventDefault();
    try {
        await api.post('/api/ap/bills', newBill);
        alert("✅ Vendor Bill Submitted Successfully! 3-Way Match Executed.");
        setShowCreateModal(false);
        fetchData();
    } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || "Submission Failed");
    }
  };

  const approveBill = async (id) => {
    try {
      const res = await api.post(`/api/ap/bills/${id}/approve`);
      if (res.data.error) {
          return alert(`⚠️ Approval Blocked: ${res.data.message}`);
      }
      alert("✅ Bill Approved & Posted to Ledger");
      fetchData();
    } catch (err) {
      alert("Failed to approve bill");
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/payment', {
        ...paymentForm,
        vendorId: paymentModal.vendorId,
        billId: paymentModal.id
      });
      alert("💰 Payment Successfully Posted");
      setPaymentModal(null);
      fetchData();
    } catch (err) {
      alert("Payment failed");
    }
  };

  const theme = {
    primary: '#4f46e5', // AP Purple
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#0f172a',
    border: '#cbd5e1'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>Finance Module</span>
                  <ArrowRight size={14} color="#94a3b8" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Accounts Payable</span>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: theme.textMain, margin: 0 }}>Vendor Bills</h1>
              <p style={{ color: '#475569', fontSize: '1.1rem', marginTop: '8px' }}>Manage 3-Way Matching, approvals, and automated ledger entries.</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{ padding: '16px 24px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
            >
              <Plus size={20} /> Create Vendor Bill
            </button>
          </header>

          <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '20px 24px' }}>Bill ID & Status</th>
                  <th style={{ padding: '20px' }}>Vendor</th>
                  <th style={{ padding: '20px' }}>Reference Docs</th>
                  <th style={{ padding: '20px' }}>Amount & Due</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                    <tr>
                        <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                            <FileSignature size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <h3>No Vendor Bills Found</h3>
                            <p>Click "Create Vendor Bill" to upload an invoice and trigger a 3-Way Match.</p>
                        </td>
                    </tr>
                ) : bills.map(bill => (
                  <tr key={bill.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '24px' }}>
                       <div style={{ fontWeight: '800', color: theme.textMain, fontSize: '1.1rem' }}>{bill.billNumber}</div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: bill.status === 'Exception' ? '#fef2f2' : '#f8fafc', color: bill.status === 'Exception' ? theme.danger : '#64748b', fontWeight: '800', border: `1px solid ${bill.status === 'Exception' ? '#fca5a5' : '#e2e8f0'}` }}>
                            {bill.status === 'Exception' ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldAlert size={12}/> Exception Detected</span> : bill.status}
                          </span>
                       </div>
                    </td>
                    <td style={{ padding: '24px' }}>
                       <div style={{ fontWeight: '700' }}>{bill.vendor?.vendorName || 'Unknown'}</div>
                       <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Inv: {bill.invoiceNumber || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '24px' }}>
                       <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>PO: #{bill.poId || 'N/A'}</div>
                       <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>GRN: #{bill.grnId || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '24px' }}>
                       <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>₹{parseFloat(bill.totalAmount).toLocaleString()}</div>
                       <div style={{ fontSize: '0.8rem', color: new Date(bill.dueDate) < new Date() ? theme.danger : '#64748b', fontWeight: '600', marginTop: '2px' }}>
                         Due: {new Date(bill.dueDate).toLocaleDateString()}
                       </div>
                    </td>
                    <td style={{ padding: '24px', textAlign: 'right' }}>
                       {bill.approvalStatus === 'Pending' ? (
                         <button onClick={() => approveBill(bill.id)} style={{ padding: '10px 20px', borderRadius: '8px', border: `1px solid ${theme.primary}`, background: '#eff6ff', color: theme.primary, fontWeight: '800', cursor: 'pointer' }}>
                            Run Approval
                         </button>
                       ) : (
                         bill.status !== 'Paid' && (
                           <button onClick={() => { setPaymentModal(bill); setPaymentForm({...paymentForm, amount: bill.balanceAmount}); }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: theme.textMain, color: 'white', fontWeight: '800', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                             <CreditCard size={16} /> Pay Bill
                           </button>
                         )
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {/* CREATE BILL MODAL */}
      {showCreateModal && (
        <div style={modalOverlay}>
           <div style={{...modalContent, maxWidth: '800px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontWeight: '900' }}>Submit Vendor Bill</h2>
                  <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
              </div>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #e2e8f0' }}>
                  <ShieldAlert size={20} color={theme.primary} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontWeight: '600' }}>
                      The system will instantly perform a 3-Way Match against the linked PO and GRN. Any price or quantity mismatches will trigger a compliance Exception.
                  </p>
              </div>

              <form onSubmit={submitBill} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Vendor</label>
                    <select required style={inputStyle} value={newBill.vendorId} onChange={e => setNewBill({...newBill, vendorId: e.target.value})}>
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName}</option>)}
                    </select>
                </div>
                
                <div>
                    <label style={labelStyle}>Linked Purchase Order (PO)</label>
                    <select required style={inputStyle} value={newBill.poId} onChange={e => setNewBill({...newBill, poId: e.target.value})}>
                        <option value="">Select PO...</option>
                        {pos.map(p => <option key={p.id} value={p.id}>{p.poNumber}</option>)}
                    </select>
                </div>
                
                <div>
                    <label style={labelStyle}>Linked Goods Receipt (GRN)</label>
                    <select required style={inputStyle} value={newBill.grnId} onChange={e => setNewBill({...newBill, grnId: e.target.value})}>
                        <option value="">Select GRN...</option>
                        <option value="1">GRN-DEMO-1 (Auto-Fallback)</option>
                        {grns.map(g => <option key={g.id} value={g.id}>{g.grnNumber}</option>)}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Vendor Invoice Number</label>
                    <input required placeholder="e.g. INV-9921" style={inputStyle} value={newBill.invoiceNumber} onChange={e => setNewBill({...newBill, invoiceNumber: e.target.value})} />
                </div>
                <div>
                    <label style={labelStyle}>Due Date</label>
                    <input type="date" required style={inputStyle} value={newBill.dueDate} onChange={e => setNewBill({...newBill, dueDate: e.target.value})} />
                </div>

                <div style={{ background: '#f1f5f9', padding: '24px', borderRadius: '16px', gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>Subtotal</label>
                        <input type="number" required style={inputStyle} value={newBill.subtotal} onChange={e => setNewBill({...newBill, subtotal: e.target.value})} />
                    </div>
                    <div>
                        <label style={labelStyle}>Tax Amount (GST)</label>
                        <input type="number" required style={inputStyle} value={newBill.taxAmount} onChange={e => setNewBill({...newBill, taxAmount: e.target.value})} />
                    </div>
                    <div>
                        <label style={labelStyle}>Total Payable</label>
                        <input type="number" disabled style={{...inputStyle, background: '#e2e8f0', fontWeight: '800'}} value={newBill.totalAmount} />
                    </div>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', fontWeight: '800' }}>Cancel</button>
                   <button type="submit" style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '800' }}>Run 3-Way Match & Submit</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContent = {
  background: 'white', width: '100%', maxWidth: '450px', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', fontWeight: '600' };
