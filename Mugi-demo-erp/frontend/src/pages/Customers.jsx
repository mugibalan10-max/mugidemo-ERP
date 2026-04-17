import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Card, Table, Badge, Button, Input } from '../components/UI';
import api from '../lib/api';
import { Users, Plus, Search, Mail, Phone, MoreHorizontal, Download, Filter } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', gstNumber: '', address: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/leads/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newClient.name) return alert("Client name is required");
    try {
      await api.post('/api/leads/customers', newClient);
      setShowModal(false);
      setNewClient({ name: '', email: '', phone: '', gstNumber: '', address: '' });
      fetchCustomers();
      alert("Client registered successfully!");
    } catch (err) {
      alert("Failed to register client");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.gstNumber && c.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <nav style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '12px', fontWeight: 'bold' }}>
                 <span>CRM</span>
                 <span>/</span>
                 <span style={{ color: '#6366f1' }}>Customers</span>
              </nav>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Client Directory</h1>
              <p style={{ color: '#64748b' }}>Manage your global client accounts, communication preferences, and billing history.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <Button 
                variant="outline" 
                icon={<Download size={18} />}
                onClick={() => alert("Exporting Client Directory to CSV...")}
               >Export CSV</Button>
               <Button 
                icon={<Plus size={18} />}
                onClick={() => setShowModal(true)}
               >Register Client</Button>
            </div>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
               <Input 
                 placeholder="Search by client name, email, or GSTIN..." 
                 icon={<Search size={18} />} 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <Button variant="outline" icon={<Filter size={18} />}>Advanced Filters</Button>
          </div>

          {/* Customers Table */}
          <Table 
            headers={['Client Profile', 'Primary Contact', 'Status', 'GST Details', 'Actions']}
            data={filteredCustomers}
            renderRow={(customer) => (
              <>
                <td style={{ padding: '20px 24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
                         {customer.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                         <p style={{ margin: 0, fontWeight: '700', color: '#1e293b' }}>{customer.name}</p>
                         <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>ID: CUST-{String(customer.id).padStart(4, '0')}</p>
                      </div>
                   </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                         <Mail size={14} color="#94a3b8" /> {customer.email || 'N/A'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                         <Phone size={14} color="#94a3b8" /> {customer.phone || 'N/A'}
                      </div>
                   </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <Badge variant="success">Active Partner</Badge>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', color: '#475569', fontWeight: '600' }}>
                      {customer.gstNumber || 'UNREGISTERED'}
                   </code>
                </td>
                <td style={{ padding: '20px 24px' }}>
                   <button style={{ padding: '10px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                      <MoreHorizontal size={20} />
                   </button>
                </td>
              </>
            )}
          />

          {/* Register Client Modal */}
          {showModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Register New Client</h2>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Establish a new recurring commercial relationship.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                 </div>

                 <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                       <Input label="COMPANY NAME" placeholder="e.g. Acme Corp" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                       <Input label="EMAIL ADDRESS" placeholder="billing@acme.com" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                       <Input label="PHONE NUMBER" placeholder="+91 00000 00000" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                       <Input label="GSTIN NUMBER" placeholder="22AAAAA0000A1Z5" value={newClient.gstNumber} onChange={e => setNewClient({...newClient, gstNumber: e.target.value})} />
                    </div>
                    <Input label="OFFICE ADDRESS" placeholder="Plot 44, Industrial Area..." value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
                    
                    <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                       <Button type="button" variant="outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Button>
                       <Button type="submit" style={{ flex: 2 }}>Initialize Account</Button>
                    </div>
                 </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
