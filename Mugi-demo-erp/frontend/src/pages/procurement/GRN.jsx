import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { 
  PackageCheck, ClipboardList, Warehouse, User, 
  RotateCcw, ShieldCheck, BoxSelect, ArrowRight,
  Database, Tag, Truck
} from 'lucide-react';

export default function GRN() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  
  const [grnData, setGrnData] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    warehouseId: '',
    receivedBy: 'Warehouse Manager',
    remarks: 'Auto-verified via SAP MIGO equivalent',
    items: []
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOpenPOs();
    fetchWarehouses();
  }, []);

  const fetchOpenPOs = async () => {
    try {
      const res = await api.get('/api/procurement/po');
      // Enterprise: We can receive against any PO for demo flexibility
      setPurchaseOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/api/inventory/warehouses').catch(() => ({ data: [] }));
      setWarehouses(res.data);
      if (res.data.length > 0) {
          setGrnData(prev => ({ ...prev, warehouseId: res.data[0].id }));
      }
    } catch (err) {}
  };

  const loadPODetails = async (poId) => {
    if (!poId) return setSelectedPO(null);
    try {
      const res = await api.get(`/api/procurement/po/${poId}`);
      setSelectedPO(res.data);
      
      // Map PO items to Enterprise Putaway structure
      setGrnData(prev => ({
        ...prev,
        items: res.data.items.map(item => ({
          productId: item.productId,
          productName: item.product.productName,
          sku: item.product.sku || `SKU-${item.productId}`,
          orderedQty: item.quantity,
          receivedQty: item.quantity, // Auto-fill 100%
          damagedQty: 0,
          binId: '',
          batchNumber: `BCH-${Date.now().toString().slice(-6)}`,
          expiryDate: ''
        }))
      }));
    } catch (err) {
      alert("Failed to load Purchase Order Details.");
    }
  };

  const updateItem = (idx, field, val) => {
    const newItems = [...grnData.items];
    newItems[idx][field] = val;
    setGrnData({ ...grnData, items: newItems });
  };

  const submitGRN = async () => {
    if (!selectedPO) return alert("Select a Purchase Order");
    if (!grnData.warehouseId) return alert("Select a Destination Warehouse for Putaway");
    
    setLoading(true);
    try {
      const payload = {
        poId: selectedPO.id,
        warehouseId: grnData.warehouseId,
        items: grnData.items.map(i => ({
            productId: parseInt(i.productId),
            receivedQty: parseInt(i.receivedQty),
            damagedQty: parseInt(i.damagedQty) || 0,
            binId: i.binId ? parseInt(i.binId) : null,
            batchNumber: i.batchNumber,
            expiryDate: i.expiryDate || null
        }))
      };

      await api.post('/api/inventory/grn', payload);
      alert("✅ SAP MIGO (Goods Receipt) Executed Successfully! Financial Ledger & Inventory Updated.");
      setSelectedPO(null);
      fetchOpenPOs();
    } catch (err) {
      alert("Transaction Failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    primary: '#2563eb', // SAP Blue
    secondary: '#1e40af',
    accent: '#38bdf8',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bg: '#f1f5f9',
    card: '#ffffff',
    textMain: '#0f172a',
    border: '#cbd5e1'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>Material Management (MM)</span>
                  <ArrowRight size={14} color="#94a3b8" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Goods Movement MIGO</span>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: theme.textMain, margin: 0, letterSpacing: '-0.5px' }}>Inbound Delivery & Putaway</h1>
              <p style={{ color: '#475569', fontSize: '1.1rem', marginTop: '8px' }}>Execute multi-stage receipt, Quality Control, and dynamic Bin assignment.</p>
            </div>
            
            <div style={{ width: '350px', background: 'white', padding: '16px', borderRadius: '16px', border: `1px solid ${theme.border}`, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} color={theme.primary} /> LINK TO PURCHASE ORDER
              </label>
              <select 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${theme.primary}`, outline: 'none', fontWeight: '700', cursor: 'pointer' }}
                onChange={(e) => loadPODetails(e.target.value)}
              >
                <option value="">[ F4 ] Search Document...</option>
                {purchaseOrders.map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber} — {po.vendor?.vendorName || 'Unknown Vendor'}</option>
                ))}
              </select>
            </div>
          </header>

          {selectedPO ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
              
              {/* Header Data */}
              <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={20} color={theme.primary} /> Document Header Data</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                  <div>
                    <label style={labelStyle}>Receiving Plant / Warehouse</label>
                    <select style={inputStyle} value={grnData.warehouseId} onChange={e => setGrnData({...grnData, warehouseId: e.target.value})}>
                        {warehouses.length === 0 && <option value="1">Central DC (Auto-Failover)</option>}
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.location})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Posting Date</label>
                    <input type="date" style={inputStyle} value={grnData.receivedDate} onChange={e => setGrnData({...grnData, receivedDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Received By (User ID)</label>
                    <input style={inputStyle} value={grnData.receivedBy} onChange={e => setGrnData({...grnData, receivedBy: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Delivery Note / Bill of Lading</label>
                    <input style={{...inputStyle, background: '#f8fafc'}} placeholder="External Doc No..." />
                  </div>
                </div>
              </div>

              {/* Line Items Grid (SAP Style) */}
              <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BoxSelect size={20} color={theme.primary} /> Line Items Detail
                    </h3>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: theme.success, background: '#10b98120', padding: '6px 16px', borderRadius: '20px' }}>
                        {grnData.items.length} Items Loaded from PO
                    </span>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      <th style={{ padding: '16px 24px', fontWeight: '800' }}>Material / SKU</th>
                      <th style={{ padding: '16px 24px', fontWeight: '800' }}>Open Qty</th>
                      <th style={{ padding: '16px 24px', fontWeight: '800' }}>Qty in UoE (Good)</th>
                      <th style={{ padding: '16px 24px', fontWeight: '800' }}>Qty in UoE (Reject)</th>
                      <th style={{ padding: '16px 24px', fontWeight: '800' }}>Bin / Rack Loc</th>
                      <th style={{ padding: '16px 24px', fontWeight: '800' }}>Batch (Auto-Gen)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grnData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                        <td style={{ padding: '24px', fontWeight: '700', color: theme.textMain }}>
                            {item.productName}
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Tag size={12} /> {item.sku}
                            </div>
                        </td>
                        <td style={{ padding: '24px', fontWeight: '800', fontSize: '1.1rem' }}>{item.orderedQty}</td>
                        <td style={{ padding: '24px' }}>
                          <input 
                            type="number" 
                            style={{ ...inputStyle, width: '120px', borderColor: theme.success, borderLeftWidth: '4px', background: '#f0fdf4' }} 
                            value={item.receivedQty} 
                            onChange={(e) => updateItem(idx, 'receivedQty', e.target.value)} 
                          />
                        </td>
                        <td style={{ padding: '24px' }}>
                          <input 
                            type="number" 
                            style={{ ...inputStyle, width: '120px', borderColor: item.damagedQty > 0 ? theme.danger : theme.border, background: item.damagedQty > 0 ? '#fef2f2' : 'white' }} 
                            value={item.damagedQty} 
                            onChange={(e) => updateItem(idx, 'damagedQty', e.target.value)} 
                          />
                        </td>
                        <td style={{ padding: '24px' }}>
                          <input 
                            placeholder="e.g. A-101" 
                            style={{ ...inputStyle, width: '120px' }} 
                            value={item.binId} 
                            onChange={(e) => updateItem(idx, 'binId', e.target.value)} 
                          />
                        </td>
                        <td style={{ padding: '24px' }}>
                          <input 
                            style={{ ...inputStyle, width: '160px', fontFamily: 'monospace', fontSize: '0.85rem', color: theme.primary, background: '#eff6ff', border: `1px solid #bfdbfe` }} 
                            value={item.batchNumber} 
                            onChange={(e) => updateItem(idx, 'batchNumber', e.target.value)} 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={24} color={theme.success} />
                    <div>
                        <h4 style={{ margin: 0, fontWeight: '800' }}>Ready for Financial Posting</h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Material documents and accounting docs will be created automatically.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => setSelectedPO(null)} style={{ padding: '16px 32px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '800', cursor: 'pointer', color: '#475569' }}>
                    Cancel
                  </button>
                  <button onClick={submitGRN} disabled={loading} style={{ padding: '16px 40px', borderRadius: '14px', border: 'none', background: theme.primary, color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: `0 10px 15px -3px ${theme.primary}40` }}>
                    <PackageCheck size={20} /> {loading ? 'Processing...' : 'Post Material Document'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ padding: '120px 20px', textAlign: 'center', background: 'white', borderRadius: '32px', border: `1px dashed #cbd5e1` }}>
               <ClipboardList size={80} style={{ color: '#e2e8f0', marginBottom: '32px' }} />
               <h2 style={{ color: theme.textMain, fontWeight: '900', fontSize: '2rem', margin: '0 0 16px 0' }}>Select a Purchase Order to Begin</h2>
               <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
                   Use the dropdown above to pull Purchase Order data directly from the backend. The system will pre-fill line items for rapid execution.
               </p>
            </div>
          )}

        </div>
      </main>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'
};
const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', background: 'white', fontWeight: '600', transition: 'all 0.2s', ':focus': { borderColor: '#2563eb', boxShadow: '0 0 0 3px rgba(37,99,235,0.1)' }
};
