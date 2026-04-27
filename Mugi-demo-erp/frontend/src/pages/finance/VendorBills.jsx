import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { FileText, CheckCircle, Clock, CreditCard, Filter, ArrowRight } from 'lucide-react';

export default function VendorBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentMode: 'Bank Transfer', transactionRef: '', remarks: '' });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await api.get('/api/finance/bills');
      setBills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveBill = async (id) => {
    try {
      await api.patch(`/api/finance/bills/${id}/approve`);
      alert("✅ Bill Approved for Payment");
      fetchBills();
    } catch (err) {
      alert("Failed to approve bill");
    }
  };

  const processPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/finance/payments', {
        ...paymentForm,
        vendorId: paymentModal.vendorId,
        billId: paymentModal.id
      });
      alert("💰 Payment Successfully Posted to Ledger");
      setPaymentModal(null);
      fetchBills();
    } catch (err) {
      alert("Payment failed");
    }
  };

  const theme = {
    primary: '#6366f1',
    success: '#10b981',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Accounts Payable</h1>
              <p style={{ color: '#64748b' }}>Manage vendor bills, process multi-stage approvals, and post payments.</p>
            </div>
          </header>

          <div style={{ background: 'white', borderRadius: '28px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '20px 32px' }}>BILL DETAILS</th>
                  <th style={{ padding: '20px' }}>VENDOR</th>
                  <th style={{ padding: '20px' }}>DUE DATE</th>
                  <th style={{ padding: '20px' }}>TOTAL</th>
                  <th style={{ padding: '20px' }}>STATUS</th>
                  <th style={{ padding: '20px 32px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id} style={{ borderBottom: `1px solid #f1f5f9` }}>
                    <td style={{ padding: '24px 32px' }}>
                       <div style={{ fontWeight: '700', color: theme.textMain }}>{bill.billNumber}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b' }}>From GRN #{bill.grnId || 'Direct'}</div>
                    </td>
                    <td style={{ padding: '24px 20px' }}>
                       <div style={{ fontWeight: '600' }}>{bill.vendor.vendorName}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{bill.vendor.vendorCode}</div>
                    </td>
                    <td style={{ padding: '24px 20px' }}>
                       <div style={{ color: new Date(bill.dueDate) < new Date() ? '#ef4444' : '#64748b', fontWeight: '600' }}>
                         {new Date(bill.dueDate).toLocaleDateString()}
                       </div>
                    </td>
                    <td style={{ padding: '24px 20px' }}>
                       <div style={{ fontWeight: '800' }}>₹{parseFloat(bill.totalAmount).toLocaleString()}</div>
                       <div style={{ fontSize: '0.7rem', color: theme.success }}>Balance: ₹{parseFloat(bill.balanceAmount).toLocaleString()}</div>
                    </td>
                    <td style={{ padding: '24px 20px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: bill.approvalStatus === 'Approved' ? '#10b98115' : '#f59e0b15', color: bill.approvalStatus === 'Approved' ? '#10b981' : '#f59e0b', fontWeight: '800', width: 'fit-content' }}>
                            {bill.approvalStatus}
                          </span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#6366f115', color: '#6366f1', fontWeight: '800', width: 'fit-content' }}>
                            {bill.status}
                          </span>
                       </div>
                    </td>
                    <td style={{ padding: '24px 32px' }}>
                       {bill.approvalStatus === 'Pending' ? (
                         <button onClick={() => approveBill(bill.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Approve</button>
                       ) : (
                         bill.status !== 'Paid' && (
                           <button onClick={() => { setPaymentModal(bill); setPaymentForm({...paymentForm, amount: bill.balanceAmount}); }} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1e293b', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <CreditCard size={14} /> Pay
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

      {paymentModal && (
        <div style={modalOverlay}>
           <div style={modalContent}>
              <h2 style={{ marginBottom: '24px' }}>Post Vendor Payment</h2>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px dashed #e2e8f0' }}>
                 <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Paying for Bill</p>
                 <h4 style={{ margin: 0 }}>{paymentModal.billNumber} - {paymentModal.vendor.vendorName}</h4>
              </div>
              <form onSubmit={processPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                   <label style={labelStyle}>PAYMENT AMOUNT (₹)</label>
                   <input type="number" step="0.01" style={inputStyle} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </div>
                <div>
                   <label style={labelStyle}>PAYMENT MODE</label>
                   <select style={inputStyle} value={paymentForm.paymentMode} onChange={e => setPaymentForm({...paymentForm, paymentMode: e.target.value})}>
                      <option>Bank Transfer</option>
                      <option>Check</option>
                      <option>Cash</option>
                      <option>UPI</option>
                   </select>
                </div>
                <div>
                   <label style={labelStyle}>TRANSACTION REFERENCE</label>
                   <input placeholder="UTR Number, Check #..." style={inputStyle} value={paymentForm.transactionRef} onChange={e => setPaymentForm({...paymentForm, transactionRef: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button type="button" onClick={() => setPaymentModal(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700' }}>Cancel</button>
                   <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#1e293b', color: 'white', fontWeight: '700' }}>Post Payment</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContent = {
  background: 'white', width: '100%', maxWidth: '450px', padding: '40px', borderRadius: '32px'
};
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' };
const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem' };
