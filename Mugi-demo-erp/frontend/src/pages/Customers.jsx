import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Card, Table, Badge, Button, Input } from '../components/UI';
import api from '../lib/api';
import { Users, Plus, Search, Mail, Phone, MoreHorizontal, Download, Filter } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/leads/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
                 <span>CRM</span>
                 <span>/</span>
                 <span style={{ color: '#6366f1' }}>Customers</span>
              </nav>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#0f172a' }}>Client Directory</h1>
              <p style={{ color: '#64748b' }}>Manage your global client accounts, communication preferences, and billing history.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <Button variant="outline" icon={<Download size={18} />}>Export CSV</Button>
               <Button icon={<Plus size={18} />}>Register Client</Button>
            </div>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
               <Input placeholder="Search by client name, email, or GSTIN..." icon={<Search size={18} />} />
            </div>
            <Button variant="outline" icon={<Filter size={18} />}>Advanced Filters</Button>
          </div>

          {/* Customers Table */}
          <Table 
            headers={['Client Profile', 'Primary Contact', 'Status', 'GST Details', 'Actions']}
            data={customers}
            renderRow={(customer) => (
              <>
                <td style={{ padding: '20px 24px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem' }}>
                         {customer.name.charAt(0)}
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

        </div>
      </main>
    </div>
  );
}
