import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  Package, Search, Plus, MapPin, ArrowRightLeft, 
  AlertTriangle, TrendingUp, DollarSign, Database, 
  CheckCircle, FileText
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [dashboard, setDashboard] = useState({ valuation: 0, lowStockCount: 0, totalItems: 0, topMoving: [] });
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);

  const [newItem, setNewItem] = useState({
    productName: '', sku: '', category: 'General', unitOfMeasure: 'NOS',
    hsnCode: '', taxPercent: 18, isBatchTracked: false, minStock: 10, price: ''
  });

  const [grnData, setGrnData] = useState({
    poId: 1, warehouseId: '', items: [{ productId: '', receivedQty: '', damagedQty: '', binId: '', batchNumber: '' }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, dashRes, whRes] = await Promise.all([
        api.get('/api/inventory/products'),
        api.get('/api/inventory/reports/dashboard'),
        api.get('/api/inventory/warehouses').catch(() => ({ data: [] }))
      ]);
      setProducts(prodRes.data);
      setDashboard(dashRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/products', newItem);
      alert("Item Master Created Successfully!");
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to create item.");
    }
  };

  const handleProcessGRN = async (e) => {
    e.preventDefault();
    try {
      // Data cleanup
      const payload = {
        poId: grnData.poId, warehouseId: grnData.warehouseId,
        items: grnData.items.map(i => ({
           productId: parseInt(i.productId),
           receivedQty: parseInt(i.receivedQty),
           damagedQty: parseInt(i.damagedQty) || 0,
           binId: i.binId ? parseInt(i.binId) : null,
           batchNumber: i.batchNumber
        }))
      };
      await api.post('/api/inventory/grn', payload);
      alert("GRN Processed & Stock Updated Successfully in Warehouse!");
      setShowGRNModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to process GRN");
    }
  };

  const theme = {
    primary: '#f59e0b', secondary: '#fbbf24', success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
    bg: '#f8fafc', textMain: '#0f172a', textMuted: '#64748b', border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.bg, overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <nav style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: theme.textMuted, marginBottom: '8px', fontWeight: '700' }}>
                 <span>Supply Chain</span><span>/</span><span style={{ color: theme.primary }}>Inventory Master</span>
              </nav>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain, margin: 0 }}>Warehouse & Inventory</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px' }}>Multi-warehouse stock tracking, GRN processing, and live valuation.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setShowGRNModal(true)} style={{ ...btnStyle, background: 'white', color: theme.textMain, border: `1px solid ${theme.border}` }}>
                 <FileText size={18} /> Process GRN (Inbound)
               </button>
               <button onClick={() => setShowItemModal(true)} style={{ ...btnStyle, background: theme.primary, color: 'white', boxShadow: `0 10px 15px -3px ${theme.primary}40` }}>
                 <Plus size={18} /> New Item Master
               </button>
            </div>
          </header>

          {/* ERP Financial Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#f59e0b15', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={24} /></div>
                 <Badge text="Moving Average" color={theme.primary} bg="#f59e0b15" />
              </div>
              <p style={statLabel}>Total Inventory Valuation</p>
              <h3 style={statValue}>₹{dashboard.valuation?.toLocaleString()}</h3>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#ef444415', color: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={24} /></div>
                 <Badge text="Action Required" color={theme.danger} bg="#ef444415" />
              </div>
              <p style={statLabel}>Low Stock Items</p>
              <h3 style={statValue}>{dashboard.lowStockCount}</h3>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#10b98115', color: theme.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={24} /></div>
                 <Badge text="Active" color={theme.success} bg="#10b98115" />
              </div>
              <p style={statLabel}>Total Item Masters</p>
              <h3 style={statValue}>{dashboard.totalItems}</h3>
            </div>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: '700', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} /> Top Moving Stock</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dashboard.topMoving?.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{p.name} <span style={{fontSize:'0.7rem', color:'#64748b'}}>{p.sku}</span></span>
                    <span style={{ fontSize: '0.85rem', color: theme.primary, fontWeight: '700' }}>{p.stock} Units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: theme.bg, color: theme.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Item Master / SKU</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>HSN & Category</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Valuation Rate</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Total Available</th>
                  <th style={{ padding: '20px 24px', fontWeight: '800' }}>Stock Blocks</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: theme.textMuted }}>No items found.</td></tr>}
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s', ':hover': { background: '#f8fafc' } }}>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f59e0b15', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Package size={20} />
                          </div>
                          <div>
                             <p style={{ margin: 0, fontWeight: '800', color: theme.textMain, fontSize: '1.05rem' }}>{p.productName}</p>
                             <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: theme.textMuted, fontWeight: '600' }}>SKU: {p.sku}</p>
                          </div>
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: theme.textMain }}>{p.category}</span>
                          <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>HSN: {p.hsnCode || 'N/A'}</span>
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <span style={{ fontSize: '1rem', fontWeight: '800', color: theme.textMain }}>₹{parseFloat(p.price).toFixed(2)}</span>
                       <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: theme.textMuted }}>per {p.unitOfMeasure}</p>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: p.quantity <= p.minStock ? theme.danger : theme.success }}>
                             {p.quantity}
                          </span>
                          {p.quantity <= p.minStock && <AlertTriangle size={14} color={theme.danger} />}
                       </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {p.reservedQty > 0 && <Badge text={`${p.reservedQty} SO Rsrv`} color={theme.warning} bg="#f59e0b15" />}
                          {p.damagedQty > 0 && <Badge text={`${p.damagedQty} Damaged`} color={theme.danger} bg="#ef444415" />}
                          {p.incomingStock > 0 && <Badge text={`${p.incomingStock} Transit`} color={theme.primary} bg="#f59e0b15" />}
                          {p.reservedQty === 0 && p.damagedQty === 0 && p.incomingStock === 0 && <span style={{ fontSize: '0.8rem', color: theme.textMuted }}>Clear</span>}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ITEM MASTER MODAL */}
      {showItemModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '700px' }}>
             <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: '800', color: theme.textMain }}>Create Item Master</h2>
             <p style={{ color: theme.textMuted, marginBottom: '32px', fontSize: '0.9rem' }}>Define product rules, HSN codes, and valuation metrics.</p>
             
             <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div><label style={modalLabel}>Product Name *</label><input required style={modalInput} value={newItem.productName} onChange={e => setNewItem({...newItem, productName: e.target.value})} /></div>
                   <div><label style={modalLabel}>SKU / Item Code *</label><input required style={modalInput} value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} /></div>
                   
                   <div><label style={modalLabel}>Category</label>
                      <select style={modalInput} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                        <option>Raw Material</option><option>Finished Good</option><option>Consumable</option><option>Service</option>
                      </select>
                   </div>
                   <div><label style={modalLabel}>Unit of Measure (UOM)</label>
                      <select style={modalInput} value={newItem.unitOfMeasure} onChange={e => setNewItem({...newItem, unitOfMeasure: e.target.value})}>
                        <option>NOS</option><option>KGS</option><option>LTR</option><option>BOX</option>
                      </select>
                   </div>

                   <div><label style={modalLabel}>HSN Code</label><input style={modalInput} value={newItem.hsnCode} onChange={e => setNewItem({...newItem, hsnCode: e.target.value})} /></div>
                   <div><label style={modalLabel}>GST Tax %</label>
                      <select style={modalInput} value={newItem.taxPercent} onChange={e => setNewItem({...newItem, taxPercent: e.target.value})}>
                        <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                      </select>
                   </div>

                   <div><label style={modalLabel}>Standard Rate / Price (₹)</label><input type="number" required style={modalInput} value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} /></div>
                   <div><label style={modalLabel}>Minimum Stock Alert</label><input type="number" style={modalInput} value={newItem.minStock} onChange={e => setNewItem({...newItem, minStock: e.target.value})} /></div>
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={newItem.isBatchTracked} onChange={e => setNewItem({...newItem, isBatchTracked: e.target.checked})} />
                   <span style={{ fontWeight: '700', color: theme.textMain }}>Enable Batch & Expiry Tracking (Pharma/FMCG Mode)</span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button type="button" onClick={() => setShowItemModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                   <button type="submit" style={{ flex: 2, padding: '16px', borderRadius: '14px', border: 'none', background: theme.primary, color: 'white', fontWeight: '800', cursor: 'pointer' }}>Save Item Master</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* GRN MODAL */}
      {showGRNModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '800px' }}>
             <h2 style={{ marginBottom: '8px', fontSize: '1.75rem', fontWeight: '800', color: theme.textMain }}>Goods Receipt Note (GRN)</h2>
             <p style={{ color: theme.textMuted, marginBottom: '32px', fontSize: '0.9rem' }}>Record inbound stock, perform QC, and assign to warehouse bins.</p>
             
             <form onSubmit={handleProcessGRN} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                   <div><label style={modalLabel}>Purchase Order Link ID</label><input type="number" required style={modalInput} value={grnData.poId} onChange={e => setGrnData({...grnData, poId: e.target.value})} /></div>
                   <div><label style={modalLabel}>Target Warehouse</label>
                      <select required style={modalInput} value={grnData.warehouseId} onChange={e => setGrnData({...grnData, warehouseId: e.target.value})}>
                        <option value="">Select Warehouse</option>
                        <option value="1">Main DC (Warehouse 1)</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                   </div>
                </div>

                <div>
                   <h4 style={{ margin: '0 0 12px 0', color: theme.textMain, fontWeight: '800' }}>Inbound Items (Putaway)</h4>
                   {grnData.items.map((item, index) => (
                     <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr', gap: '12px', marginBottom: '12px' }}>
                        <select required style={modalInput} value={item.productId} onChange={e => {
                          const newItems = [...grnData.items]; newItems[index].productId = e.target.value; setGrnData({...grnData, items: newItems});
                        }}>
                          <option value="">Select Product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.productName}</option>)}
                        </select>
                        <input type="number" required placeholder="Good Qty" style={modalInput} value={item.receivedQty} onChange={e => {
                          const newItems = [...grnData.items]; newItems[index].receivedQty = e.target.value; setGrnData({...grnData, items: newItems});
                        }} />
                        <input type="number" placeholder="Reject Qty" style={{...modalInput, borderColor: theme.danger}} value={item.damagedQty} onChange={e => {
                          const newItems = [...grnData.items]; newItems[index].damagedQty = e.target.value; setGrnData({...grnData, items: newItems});
                        }} />
                        <input placeholder="Bin ID" style={modalInput} value={item.binId} onChange={e => {
                          const newItems = [...grnData.items]; newItems[index].binId = e.target.value; setGrnData({...grnData, items: newItems});
                        }} />
                        <input placeholder="Batch No (Opt)" style={modalInput} value={item.batchNumber} onChange={e => {
                          const newItems = [...grnData.items]; newItems[index].batchNumber = e.target.value; setGrnData({...grnData, items: newItems});
                        }} />
                     </div>
                   ))}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                   <button type="button" onClick={() => setShowGRNModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                   <button type="submit" style={{ flex: 2, padding: '16px', borderRadius: '14px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                     <CheckCircle size={18} /> Post GRN to Ledger
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}

const Badge = ({ text, color, bg }) => (
  <span style={{ fontSize: '0.7rem', fontWeight: '800', color, background: bg, padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</span>
);

const btnStyle = { padding: '12px 24px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const cardStyle = { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const statLabel = { margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#64748b' };
const statValue = { margin: '8px 0 0', fontSize: '2rem', fontWeight: '800', color: '#0f172a' };
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' };
const modalContent = { background: 'white', width: '100%', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalLabel = { display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', fontWeight: '600', color: '#0f172a' };
