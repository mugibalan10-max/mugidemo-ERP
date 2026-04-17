import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { Card, Button, Input, Table, Badge } from '../../components/UI';
import api from '../../lib/api';
import { 
  Building2, 
  Package, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  FileCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function CreatePO() {
  const [step, setStep] = useState(1);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vendorId: '',
    expectedDate: '',
    remarks: '',
    items: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [vRes, pRes] = await Promise.all([
        api.get('/procurement/vendors'),
        api.get('/inventory/products')
      ]);
      setVendors(vRes.data);
      setProducts(pRes.data);
    } catch (err) {}
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, unitPrice: 0, taxPercent: 18 }]
    });
  };

  const removeItem = (idx) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/procurement/po', formData);
      alert("✅ Purchase Order Created & Queued for Approval");
      window.location.href = '/purchase-view';
    } catch (err) {
      alert("Failed to create PO");
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxPercent / 100)), 0);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Workflow Header */}
          <header style={{ marginBottom: '48px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Procurement Wizard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               {[
                 { n: 1, t: 'Vendor Selection' },
                 { n: 2, t: 'Line Items' },
                 { n: 3, t: 'Review & Post' }
               ].map((s, i) => (
                 <React.Fragment key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div style={{ 
                         width: '32px', height: '32px', borderRadius: '50%', 
                         background: step >= s.n ? '#6366f1' : '#e2e8f0', 
                         color: '#white', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         fontWeight: '800', fontSize: '0.85rem'
                       }}>
                         {step > s.n ? <CheckCircle2 size={18} color="white" /> : <span style={{ color: 'white' }}>{s.n}</span>}
                       </div>
                       <span style={{ fontWeight: '700', fontSize: '0.9rem', color: step >= s.n ? '#1e293b' : '#94a3b8' }}>{s.t}</span>
                    </div>
                    {i < 2 && <div style={{ width: '40px', height: '2px', background: step > s.n ? '#6366f1' : '#e2e8f0' }} />}
                 </React.Fragment>
               ))}
            </div>
          </header>

          <Card>
            {/* Step 1: Vendor Selection */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                   <div>
                      <label style={labelStyle}>SELECT SUPPLIER</label>
                      <select 
                        style={selectStyle} 
                        value={formData.vendorId} 
                        onChange={e => setFormData({...formData, vendorId: e.target.value})}
                      >
                         <option value="">Choose a Vendor...</option>
                         {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName} ({v.vendorCode})</option>)}
                      </select>
                   </div>
                   <Input 
                     label="EXPECTED DELIVERY DATE" 
                     type="date"
                     value={formData.expectedDate}
                     onChange={e => setFormData({...formData, expectedDate: e.target.value})}
                   />
                </div>
                <div style={{ marginTop: '24px' }}>
                   <label style={labelStyle}>REMARKS / SHIPMENT NOTES</label>
                   <textarea 
                    placeholder="E.g. Handle with care, Payment via Net 30..."
                    style={{ ...selectStyle, height: '120px', resize: 'none' }}
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                   />
                </div>
              </div>
            )}

            {/* Step 2: Line Items */}
            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                 <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Item Management</h3>
                    <Button variant="outline" icon={<Plus size={16} />} onClick={addItem}>Add Line Item</Button>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {formData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 40px', gap: '12px', alignItems: 'flex-end', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                         <div>
                            <label style={labelStyle}>PRODUCT</label>
                            <select style={selectStyle} value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}>
                               <option value="">Select Item...</option>
                               {products.map(p => <option key={p.id} value={p.id}>{p.productName} ({p.sku})</option>)}
                            </select>
                         </div>
                         <div>
                            <label style={labelStyle}>QTY</label>
                            <input type="number" style={selectStyle} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                         </div>
                         <div>
                            <label style={labelStyle}>UNIT PRICE</label>
                            <input type="number" style={selectStyle} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                         </div>
                         <div>
                            <label style={labelStyle}>TAX (%)</label>
                            <select style={selectStyle} value={item.taxPercent} onChange={e => updateItem(idx, 'taxPercent', e.target.value)}>
                               <option value="0">0%</option>
                               <option value="5">5%</option>
                               <option value="12">12%</option>
                               <option value="18">18%</option>
                            </select>
                         </div>
                         <button onClick={() => removeItem(idx)} style={{ color: '#ef4444', border: 'none', background: 'transparent', paddingBottom: '12px' }}>
                            <Trash2 size={20} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <div>
                       <h4 style={{ color: '#64748b', marginBottom: '16px' }}>Summary Details</h4>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ fontWeight: '600' }}>Vendor:</span>
                             <span>{vendors.find(v => v.id === formData.vendorId)?.vendorName}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span style={{ fontWeight: '600' }}>Expected:</span>
                             <span>{formData.expectedDate || 'Not specified'}</span>
                          </div>
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                             <p style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem', color: '#6366f1' }}>₹{(calculateSubtotal() + calculateTax()).toLocaleString()}</p>
                             <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Total Payable (Incl. GST)</p>
                          </div>
                       </div>
                    </div>
                    <div style={{ background: '#f0f9ff', padding: '24px', borderRadius: '24px', border: '1px solid #bae6fd' }}>
                       <div style={{ display: 'flex', gap: '12px', color: '#0369a1' }}>
                          <AlertCircle size={24} />
                          <div>
                             <p style={{ margin: 0, fontWeight: '800' }}>Corporate Policy Reminder</p>
                             <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>This PO will be sent to the Finance Department for approval before issuance.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
               <Button 
                variant="outline" 
                icon={<ChevronLeft size={18} />} 
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
               >
                 Back
               </Button>
               {step < 3 ? (
                 <Button 
                  icon={<ChevronRight size={18} />} 
                  onClick={() => setStep(step + 1)}
                 >
                   Continue
                 </Button>
               ) : (
                 <Button 
                  loading={loading}
                  icon={<FileCheck size={18} />} 
                  onClick={handleSubmit}
                 >
                   Post Purchase Order
                 </Button>
               )}
            </div>
          </Card>

        </div>
      </main>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' };
const selectStyle = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' };
