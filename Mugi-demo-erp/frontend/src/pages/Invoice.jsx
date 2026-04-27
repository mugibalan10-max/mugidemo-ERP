import React, { useState, useEffect } from "react";
import api from "../lib/api";
import Sidebar from "../components/Sidebar";

/**
 * React Invoice Page — Enterprise Refactor
 * Features multi-item billing, inventory validation, and real-time reconciliation.
 */
export default function Invoice() {
  const [formData, setFormData] = useState({
    customerId: "",
    items: [{ productId: "", quantity: 1, price: 0 }]
  });
  
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Totals Calculation
  const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
  const gst_amount = (subtotal * 18) / 100; // Standard 18% GST
  const total = subtotal + gst_amount;

  useEffect(() => {
    fetchInitialData();
    fetchInvoices();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/products")
      ]);
      setCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/api/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: "", quantity: 1, price: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill price if product is selected
    if (field === "productId") {
      const selectedProd = products.find(p => String(p.id) === String(value));
      if (selectedProd) {
        newItems[index].price = selectedProd.price;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const createInvoice = async () => {
    if (!formData.customerId || formData.items.some(i => !i.productId)) {
      return setError("Please select a customer and products for all items.");
    }
    
    setLoading(true);
    setError("");
    try {
      const payload = {
        customerId: parseInt(formData.customerId),
        items: formData.items.map(i => ({
            productId: parseInt(i.productId),
            quantity: parseInt(i.quantity),
            price: parseFloat(i.price)
        }))
      };

      const res = await api.post("/api/invoices", payload);
      alert("✅ Invoice Created Successfully!");
      setFormData({ customerId: "", items: [{ productId: "", quantity: 1, price: 0 }] });
      fetchInvoices();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create invoice. Please check stock levels.";
      setError(msg);
      alert("❌ " + msg);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f172a',
    color: '#f1f5f9',
    fontFamily: "'Inter', sans-serif"
  };

  const mainStyle = {
    flex: 1,
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    overflowY: 'auto'
  };

  const glassCardStyle = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    padding: '40px',
    borderRadius: '28px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    marginBottom: '40px'
  };

  const inputStyle = {
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    width: '100%',
    fontSize: '0.9rem',
    outline: 'none'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    display: 'block'
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Raise Sales Invoice</h1>
          <p style={{ color: '#94a3b8' }}>Multi-item billing with automated inventory and Tally synchronization.</p>
        </div>

        <div style={glassCardStyle}>
          {error && <div style={{ background: '#ef444422', border: '1px solid #ef444455', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '700' }}>⚠️ {error}</div>}
          
          {/* Customer Selection */}
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Select Client</label>
            <select 
                style={{ ...inputStyle, padding: '16px' }}
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
            </select>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 50px', gap: '16px', padding: '0 8px 8px' }}>
                <span style={labelStyle}>Product / SKU</span>
                <span style={labelStyle}>Qty</span>
                <span style={labelStyle}>Unit Price (₹)</span>
                <span></span>
            </div>
            
            {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 50px', gap: '16px', marginBottom: '12px' }}>
                    <select 
                        style={inputStyle}
                        value={item.productId}
                        onChange={(e) => updateItem(index, "productId", e.target.value)}
                    >
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.productName} (Stock: {p.quantity})</option>
                        ))}
                    </select>
                    <input 
                        type="number" 
                        style={inputStyle} 
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    />
                    <input 
                        type="number" 
                        style={inputStyle} 
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", e.target.value)}
                    />
                    <button 
                        onClick={() => removeItem(index)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                    >✕</button>
                </div>
            ))}
            
            <button 
                onClick={addItem}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: '#94a3b8', padding: '12px', borderRadius: '10px', width: '100%', cursor: 'pointer', fontWeight: '700', marginTop: '8px' }}
            >+ Add Line Item</button>
          </div>

          <div style={{ 
            marginTop: '40px', 
            padding: '24px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            borderRadius: '20px', 
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>GST (18% Included)</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>₹{gst_amount.toFixed(2)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Total Payable Amount</p>
              <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#6366f1' }}>₹{total.toFixed(2)}</p>
            </div>
          </div>

          <button 
            onClick={createInvoice} 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '32px', 
              padding: '18px', 
              borderRadius: '16px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              color: 'white', 
              border: 'none', 
              fontSize: '1.1rem', 
              fontWeight: '800', 
              cursor: 'pointer',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Validating Stock & Syncing...' : 'Generate Invoice Record'}
          </button>
        </div>

        {/* Recent Invoices List */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Recent Invoices</h2>
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          backdropFilter: 'blur(10px)', 
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '20px' }}>VOUCHER</th>
                <th style={{ padding: '20px' }}>CUSTOMER</th>
                <th style={{ padding: '20px' }}>STATUS</th>
                <th style={{ padding: '20px' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '20px', fontWeight: '700', color: '#6366f1' }}>{inv.invoiceNo}</td>
                  <td style={{ padding: '20px', fontWeight: '600' }}>{inv.customer?.name}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800', 
                        background: inv.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: inv.status === 'Paid' ? '#10b981' : '#ef4444'
                    }}>
                        {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '20px', fontWeight: '800', color: '#f1f5f9' }}>₹{inv.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
