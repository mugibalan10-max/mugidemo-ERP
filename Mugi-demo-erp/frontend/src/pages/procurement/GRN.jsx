import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { PackageCheck, ClipboardList, Warehouse, User, Save, RotateCcw } from 'lucide-react';

export default function GRN() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grnData, setGrnData] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    warehouse: 'Main Store',
    receivedBy: 'Admin',
    remarks: '',
    items: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOpenPOs();
  }, []);

  const fetchOpenPOs = async () => {
    try {
      const res = await api.get('/api/procurement/po');
      // Governance Check: Only Approved or Partial POs can be received
      setPurchaseOrders(res.data.filter(po => po.status === 'Approved' || po.status === 'Partial'));
    } catch (err) {
      console.error(err);
    }
  };

  const loadPODetails = async (poId) => {
    if (!poId) return setSelectedPO(null);
    try {
      const res = await api.get(`/api/procurement/po/${poId}`);
      setSelectedPO(res.data);
      // Map PO items to GRN items structure
      setGrnData({
        ...grnData,
        items: res.data.items.map(item => ({
          productId: item.productId,
          productName: item.product.productName,
          orderedQty: item.quantity,
          receivedQty: item.quantity, // Default to full receipt
          damagedQty: 0
        }))
      });
    } catch (err) {
      alert("Failed to load PO details");
    }
  };

  const handleReceivedQtyChange = (idx, val) => {
    const newItems = [...grnData.items];
    newItems[idx].receivedQty = parseInt(val) || 0;
    setGrnData({ ...grnData, items: newItems });
  };

  const handleDamagedQtyChange = (idx, val) => {
    const newItems = [...grnData.items];
    newItems[idx].damagedQty = parseInt(val) || 0;
    setGrnData({ ...grnData, items: newItems });
  };

  const submitGRN = async () => {
    if (!selectedPO) return alert("Please select a Purchase Order first.");
    setLoading(true);
    try {
      await api.post('/api/procurement/grn', {
        ...grnData,
        poId: selectedPO.id
      });
      alert("✅ Goods Received Successfully! Inventory has been updated.");
      setSelectedPO(null);
      fetchOpenPOs();
    } catch (err) {
      alert("Failed to process GRN");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    primary: '#10b981', // Success green for GRN
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: theme.textMain }}>Receive Goods (GRN)</h1>
              <p style={{ color: '#64748b' }}>Verify incoming shipments and update stock levels automatically.</p>
            </div>
            <div style={{ width: '300px' }}>
              <label style={labelStyle}><ClipboardList size={14} /> SELECT PURCHASE ORDER</label>
              <select 
                style={inputStyle} 
                onChange={(e) => loadPODetails(e.target.value)}
              >
                <option value="">Choose Pending PO...</option>
                {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.poNumber} - {po.vendor.vendorName}</option>)}
              </select>
            </div>
          </header>

          {selectedPO ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
              
              {/* Shipment Info */}
              <div style={cardStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}><RotateCcw size={14} /> RECEIVED DATE</label>
                    <input type="date" style={inputStyle} value={grnData.receivedDate} onChange={e => setGrnData({...grnData, receivedDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}><Warehouse size={14} /> STORAGE WAREHOUSE</label>
                    <input style={inputStyle} value={grnData.warehouse} onChange={e => setGrnData({...grnData, warehouse: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}><User size={14} /> RECEIVED BY</label>
                    <input style={inputStyle} value={grnData.receivedBy} onChange={e => setGrnData({...grnData, receivedBy: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Items Verification */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Verify Incoming Items</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: '#64748b', fontSize: '0.8rem' }}>
                      <th style={{ padding: '16px 12px' }}>PRODUCT</th>
                      <th style={{ padding: '16px 12px' }}>ORDERED</th>
                      <th style={{ padding: '16px 12px' }}>RECEIVED</th>
                      <th style={{ padding: '16px 12px' }}>DAMAGED</th>
                      <th style={{ padding: '16px 12px' }}>PENDING</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grnData.items.map((item, idx) => {
                      const pending = item.orderedQty - item.receivedQty;
                      return (
                        <tr key={idx} style={{ borderBottom: `1px solid #f1f5f9` }}>
                          <td style={{ padding: '20px 12px', fontWeight: '600' }}>{item.productName}</td>
                          <td style={{ padding: '20px 12px' }}>{item.orderedQty} units</td>
                          <td style={{ padding: '20px 12px' }}>
                            <input 
                              type="number" 
                              style={{ ...inputStyle, width: '100px' }} 
                              value={item.receivedQty} 
                              onChange={(e) => handleReceivedQtyChange(idx, e.target.value)} 
                            />
                          </td>
                          <td style={{ padding: '20px 12px' }}>
                            <input 
                              type="number" 
                              style={{ ...inputStyle, width: '100px', borderColor: item.damagedQty > 0 ? '#f43f5e' : '#e2e8f0' }} 
                              value={item.damagedQty} 
                              onChange={(e) => handleDamagedQtyChange(idx, e.target.value)} 
                            />
                          </td>
                          <td style={{ padding: '20px 12px' }}>
                             <span style={{ 
                               fontSize: '0.8rem', fontWeight: '800', 
                               color: pending > 0 ? '#f59e0b' : '#10b981' 
                             }}>{pending} remaining</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' }}>
                <button 
                  onClick={() => setSelectedPO(null)}
                  style={{ padding: '16px 32px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={submitGRN}
                  disabled={loading}
                  style={{ 
                    padding: '16px 40px', borderRadius: '16px', border: 'none', 
                    background: '#1e293b', color: 'white', fontWeight: '800', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' 
                  }}
                >
                  <PackageCheck size={20} /> {loading ? 'Receiving...' : 'Complete Goods Receipt'}
                </button>
              </div>

            </div>
          ) : (
            <div style={{ padding: '100px', textAlign: 'center', background: 'white', borderRadius: '32px', border: `1px solid ${theme.border}` }}>
               <ClipboardList size={64} style={{ color: '#e2e8f0', marginBottom: '24px' }} />
               <h3 style={{ color: '#1e293b' }}>Select a Purchase Order to start receiving</h3>
               <p style={{ color: '#64748b' }}>Search by PO number or Vendor name above.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const cardStyle = {
  background: 'white', padding: '32px', borderRadius: '28px', border: '1px solid #e2e8f0'
};
const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '700', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'
};
const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem', background: '#fff'
};
