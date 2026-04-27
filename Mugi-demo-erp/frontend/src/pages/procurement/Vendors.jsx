import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { Users, Plus, Search, Mail, Phone, MapPin, Trash2, Edit } from 'lucide-react';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ vendorName: '', gstNumber: '', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/api/procurement/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error("Fetch error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/procurement/vendors', form);
      setShowModal(false);
      setForm({ vendorName: '', gstNumber: '', phone: '', email: '', address: '' });
      fetchVendors();
    } catch (err) {
      alert("Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      try {
        await api.delete(`/api/procurement/vendors/${id}`);
        fetchVendors();
      } catch (err) {
        alert(err.response?.data?.error || "Failed to delete vendor");
      }
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
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Supplier Relations</h1>
              <p style={{ color: '#64748b' }}>Manage your global vendor network and procurement contacts.</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              style={{ padding: '12px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={20} /> Add New Vendor
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {vendors.map(v => (
              <div key={v.id} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: theme.primary, background: `${theme.primary}10`, padding: '4px 8px', borderRadius: '6px' }}>{v.vendorCode}</span>
                    <h3 style={{ margin: '12px 0 4px', fontSize: '1.25rem', fontWeight: '700' }}>{v.vendorName}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>GST: {v.gstNumber || 'N/A'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                     <button style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}><Edit size={16} /></button>
                     <button 
                      onClick={() => handleDelete(v.id)}
                      style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#fff1f2', color: '#e11d48', cursor: 'pointer' }}
                     >
                      <Trash2 size={16} />
                     </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: `1px solid ${theme.border}`, paddingTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                    <Mail size={14} /> {v.email || 'No email'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                    <Phone size={14} /> {v.phone || 'No phone'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#475569' }}>
                    <MapPin size={14} /> {v.address || 'No address'}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Register Vendor</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#64748b' }}>VENDOR NAME</label>
                <input required style={inputStyle} value={form.vendorName} onChange={e => setForm({...form, vendorName: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#64748b' }}>GST NUMBER</label>
                    <input style={inputStyle} value={form.gstNumber} onChange={e => setForm({...form, gstNumber: e.target.value})} />
                 </div>
                 <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#64748b' }}>PHONE</label>
                    <input style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                 </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#64748b' }}>EMAIL ADDRESS</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.85rem', color: '#64748b' }}>OFFICE ADDRESS</label>
                <textarea style={{ ...inputStyle, height: '80px' }} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>{loading ? 'Registering...' : 'Add Vendor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '1rem'
};
