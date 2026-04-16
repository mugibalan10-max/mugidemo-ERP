import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

/**
 * Inventory Page — Step 3
 * Features real-time stock monitoring and premium UI.
 */
export default function Inventory() {
  const [product, setProduct] = useState({
    product_name: "",
    sku: "",
    quantity: "",
    min_stock: 10,
    price: ""
  });
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products`);
      setProductsList(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const addProduct = async () => {
    if (!product.product_name || !product.sku || !product.price) {
      return alert("Please fill in required fields.");
    }
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/products`, product);
      alert("✅ Product added to inventory");
      setProduct({
        product_name: "",
        sku: "",
        quantity: "",
        min_stock: 10,
        price: ""
      });
      fetchProducts();
    } catch (err) {
      alert("❌ Error: Probably duplicate SKU");
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
    padding: '32px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '40px'
  };

  const inputStyle = {
    padding: '14px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#fff',
    width: '100%',
    fontSize: '0.95rem',
    marginTop: '8px',
    outline: 'none'
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainStyle}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Inventory Management</h1>
          <p style={{ color: '#94a3b8' }}>Monitor stock levels, manage SKUs, and set low-stock triggers.</p>
        </div>

        <div style={glassCardStyle}>
          <h3 style={{ marginBottom: '24px', fontSize: '1.2rem', fontWeight: '700' }}>Add New Product</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>PRODUCT NAME</label>
              <input
                placeholder="Product Name"
                style={inputStyle}
                value={product.product_name}
                onChange={(e) => setProduct({ ...product, product_name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>SKU (UNIQUE)</label>
              <input
                placeholder="SKU-001"
                style={inputStyle}
                value={product.sku}
                onChange={(e) => setProduct({ ...product, sku: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>PRICE (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                style={inputStyle}
                value={product.price}
                onChange={(e) => setProduct({ ...product, price: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>QUANTITY</label>
              <input
                type="number"
                placeholder="0"
                style={inputStyle}
                value={product.quantity}
                onChange={(e) => setProduct({ ...product, quantity: e.target.value })}
              />
            </div>
          </div>
          <button 
            onClick={addProduct} 
            disabled={loading}
            style={{ 
              width: '100%', 
              marginTop: '24px', 
              padding: '16px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              color: 'white', 
              border: 'none', 
              fontWeight: '700', 
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Add to Inventory'}
          </button>
        </div>

        {/* Inventory List */}
        <div style={{ ...glassCardStyle, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', fontSize: '0.8rem' }}>
                <th style={{ padding: '20px' }}>PRODUCT</th>
                <th style={{ padding: '20px' }}>SKU</th>
                <th style={{ padding: '20px' }}>STOCK STATUS</th>
                <th style={{ padding: '20px' }}>PRICE</th>
              </tr>
            </thead>
            <tbody>
              {productsList.map((item) => {
                const isLowStock = Number(item.quantity) <= Number(item.minStock);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '20px', fontWeight: '700' }}>{item.productName}</td>
                    <td style={{ padding: '20px', color: '#94a3b8' }}>{item.sku}</td>
                    <td style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <span style={{ 
                            fontSize: '1rem', 
                            fontWeight: '800', 
                            color: isLowStock ? '#ef4444' : '#10b981' 
                          }}>{item.quantity} units</span>
                         {isLowStock && <span style={{ fontSize: '0.7rem', background: '#ef444422', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ef444444' }}>LOW STOCK</span>}
                      </div>
                    </td>
                    <td style={{ padding: '20px', fontWeight: '800', color: '#6366f1' }}>₹{item.price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
