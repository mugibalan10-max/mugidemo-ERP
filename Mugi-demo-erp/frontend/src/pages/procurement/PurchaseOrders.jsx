import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Plus, Filter, FileText, ChevronRight } from 'lucide-react';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      const res = await api.get('/api/procurement/po');
      setPos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return '#94a3b8';
      case 'Approved': return '#6366f1';
      case 'Completed': return '#10b981';
      case 'Partially Received': return '#f59e0b';
      case 'Cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/procurement/po/${id}/approve`);
      alert("✅ Purchase Order Approved. Stock has been reserved!");
      fetchPOs();
    } catch (err) {
      alert(err.response?.data?.error || "Approval failed");
    }
  };

  const theme = {
    primary: '#6366f1',
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
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Purchase Orders</h1>
              <p style={{ color: '#64748b' }}>Track and manage all your acquisition requests and supplier commitments.</p>
            </div>
            <button 
              onClick={() => navigate('/create-po')}
              style={{ padding: '12px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={20} /> Create New PO
            </button>
          </header>

          <div style={{ background: 'white', borderRadius: '28px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 32px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                    <input placeholder="Search PO#, Vendor..." style={{ padding: '10px 16px 10px 40px', borderRadius: '10px', border: `1px solid ${theme.border}`, outline: 'none', width: '300px' }} />
                  </div>
                  <button style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: 'white', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Filter size={16} /> Filters</button>
               </div>
               <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Showing {pos.length} orders</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '20px 32px' }}>PO NUMBER</th>
                  <th style={{ padding: '20px' }}>VENDOR</th>
                  <th style={{ padding: '20px' }}>DATE</th>
                  <th style={{ padding: '20px' }}>AMOUNT</th>
                  <th style={{ padding: '20px' }}>STATUS</th>
                  <th style={{ padding: '20px 32px' }}></th>
                </tr>
              </thead>
              <tbody>
                {pos.map(po => (
                  <tr key={po.id} style={{ borderBottom: `1px solid #f1f5f9`, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#fcfcfd'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '24px 32px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: `${getStatusColor(po.status)}15`, color: getStatusColor(po.status), padding: '10px', borderRadius: '10px' }}><FileText size={18} /></div>
                          <span style={{ fontWeight: '700', color: theme.textMain }}>{po.poNumber}</span>
                       </div>
                    </td>
                    <td style={{ padding: '24px 20px' }}>
                       <div style={{ fontWeight: '600' }}>{po.vendor.vendorName}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{po.vendor.vendorCode}</div>
                    </td>
                    <td style={{ padding: '24px 20px', fontSize: '0.9rem', color: '#64748b' }}>
                      {new Date(po.poDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '24px 20px', fontWeight: '800', color: theme.textMain }}>
                      ₹{parseFloat(po.totalAmount).toLocaleString()}
                    </td>
                    <td style={{ padding: '24px 20px' }}>
                       <span style={{ 
                         padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', 
                         background: `${getStatusColor(po.status)}15`, color: getStatusColor(po.status) 
                       }}>
                         {po.status}
                       </span>
                    </td>
                    <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                          {po.status === 'Draft' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(po.id);
                              }}
                              style={{ 
                                padding: '8px 16px', borderRadius: '8px', border: 'none', 
                                background: '#6366f1', color: 'white', fontWeight: '700', 
                                fontSize: '0.75rem', cursor: 'pointer' 
                              }}
                            >
                              Approve
                            </button>
                          )}
                          <ChevronRight size={20} color="#cbd5e1" />
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}
