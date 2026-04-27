import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Card, Table, Badge, Button, Input } from '../components/UI';
import api from '../lib/api';
import { FileText, Plus, Search, Calendar, Download, Eye, ArrowRight, Filter } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    if (status === 'Paid' || status === 'Success') return 'success';
    if (status === 'Unpaid' || status === 'Pending Retry') return 'warning';
    return 'danger';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <nav style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 'bold' }}>
                 <span>REVENUE</span>
                 <span>/</span>
                 <span style={{ color: '#6366f1' }}>Invoicing</span>
              </nav>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Sales Vouchers</h1>
              <p style={{ color: '#64748b' }}>Track billed revenue, pending collections, and automated Tally Prime synchronization.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <Button variant="outline" icon={<Download size={18} />}>Statement</Button>
               <Button icon={<Plus size={18} />}>Raise Invoice</Button>
            </div>
          </div>

          {/* Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
             <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                 <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Total Billed (MTD)</p>
                 <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b' }}>₹{invoices.reduce((acc, inv) => acc + parseFloat(inv.total), 0).toLocaleString()}</h2>
             </div>
             <div style={{ background: '#6366f1', padding: '24px', borderRadius: '24px', color: '#fff' }}>
                 <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '12px' }}>Pending Collections</p>
                 <h2 style={{ fontSize: '1.75rem', fontWeight: '900' }}>₹{invoices.filter(i => i.status === 'Unpaid').reduce((acc, inv) => acc + parseFloat(inv.total), 0).toLocaleString()}</h2>
             </div>
             <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                 <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Sync Success Rate</p>
                 <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: '#1e293b' }}>98.4%</h2>
             </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
               <Input placeholder="Search vouchers by number, customer name, or amount..." icon={<Search size={18} />} />
            </div>
            <Button variant="outline" icon={<Filter size={18} />}>Period Select</Button>
          </div>

          {/* Invoices Table */}
          <Table 
            headers={['Voucher Details', 'Customer', 'Amount', 'Fulfillment', 'Tally Status', 'Actions']}
            data={invoices}
            renderRow={(inv) => (
              <>
                <td style={{ padding: '20px 24px' }}>
                   <div>
                      <p style={{ margin: 0, fontWeight: '800', color: '#1e293b', fontSize: '0.95rem' }}>{inv.invoiceNo}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                         <Calendar size={12} /> {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                   </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <p style={{ margin: 0, fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>{inv.customer?.name || inv.customerName}</p>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <p style={{ margin: 0, fontWeight: '900', color: '#1e293b' }}>₹{parseFloat(inv.total).toLocaleString()}</p>
                   <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: '#10b981', fontWeight: '800' }}>GST INCLUDED</p>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <Badge variant={getStatusVariant(inv.status)}>{inv.status}</Badge>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: inv.syncStatus === 'Success' ? '#10b981' : '#f59e0b' }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>{inv.syncStatus}</span>
                   </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <button style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#6366f1', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      View <ArrowRight size={14} />
                   </button>
                </td>
              </>
            )}
          />

        </div>
      </main>
    </div>
  );
}
