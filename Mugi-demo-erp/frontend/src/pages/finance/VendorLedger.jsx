import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../lib/api';
import { BookOpen, Search, ArrowUpRight, ArrowDownRight, FileText, Download } from 'lucide-react';

export default function VendorLedger() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/api/procurement/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    }
  };

  const fetchStatement = async (vId) => {
    if (!vId) return setStatement(null);
    setLoading(true);
    try {
      const res = await api.get(`/api/finance/ledger/${vId}`);
      setStatement(res.data);
    } catch (err) {
      console.error("Failed to fetch statement", err);
      alert("Failed to fetch statement");
    } finally {
      setLoading(false);
    }
  };

  const exportStatementCSV = () => {
    if (!statement || !statement.transactions) return;

    const headers = ["Date", "Description", "Reference", "Debit (Payment)", "Credit (Bill)", "Running Balance"];
    
    const rows = statement.transactions.map(t => [
      new Date(t.transactionDate).toLocaleDateString(),
      `"${t.narration || ''}"`,
      `${t.referenceType} #${t.referenceId}`,
      t.debit,
      t.credit,
      t.runningBalance
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const vendorName = vendors.find(v => v.id === parseInt(selectedVendor))?.vendorName || "Vendor";
    link.setAttribute("download", `${vendorName.replace(/\s+/g, '_')}_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain }}>Vendor Ledger</h1>
              <p style={{ color: '#64748b' }}>Detailed account statements and transaction history for suppliers.</p>
            </div>
            <div style={{ width: '300px' }}>
               <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', fontSize: '0.75rem', color: '#64748b' }}>SELECT VENDOR</label>
               <select 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${theme.border}`, outline: 'none' }}
                onChange={(e) => { setSelectedVendor(e.target.value); fetchStatement(e.target.value); }}
               >
                 <option value="">Choose Supplier...</option>
                 {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName} ({v.vendorCode})</option>)}
               </select>
            </div>
          </header>

          {statement ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
              
              {/* Summary Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                 <div style={statCard}>
                    <p style={statLabel}>Current Balance Payable</p>
                    <h2 style={{ ...statValue, color: '#1e293b' }}>₹{parseFloat(statement.ledger?.currentBalance || 0).toLocaleString()}</h2>
                 </div>
                 <div style={statCard}>
                    <p style={statLabel}>Total Credit (Bills)</p>
                    <h2 style={{ ...statValue, color: '#6366f1' }}>₹{statement.transactions.reduce((s,t) => s + parseFloat(t.credit), 0).toLocaleString()}</h2>
                 </div>
                 <div style={statCard}>
                    <p style={statLabel}>Total Debit (Payments)</p>
                    <h2 style={{ ...statValue, color: '#10b981' }}>₹{statement.transactions.reduce((s,t) => s + parseFloat(t.debit), 0).toLocaleString()}</h2>
                 </div>
              </div>

              {/* Transactions Table */}
              <div style={{ background: 'white', borderRadius: '28px', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                 <div style={{ padding: '24px 32px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recent Transactions</h3>
                    <button onClick={exportStatementCSV} style={{ padding: '10px 20px', borderRadius: '10px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <Download size={16} /> Export Statement
                    </button>
                 </div>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                       <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '20px 32px' }}>DATE</th>
                          <th style={{ padding: '20px' }}>DESCRIPTION</th>
                          <th style={{ padding: '20px' }}>DEBIT (PAYMENT)</th>
                          <th style={{ padding: '20px' }}>CREDIT (BILL)</th>
                          <th style={{ padding: '20px 32px' }}>BALANCE</th>
                       </tr>
                    </thead>
                    <tbody>
                       {statement.transactions.map((t, idx) => (
                         <tr key={t.id} style={{ borderBottom: `1px solid #f1f5f9` }}>
                            <td style={{ padding: '20px 32px', fontSize: '0.9rem' }}>{new Date(t.transactionDate).toLocaleDateString()}</td>
                            <td style={{ padding: '20px' }}>
                               <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {t.credit > 0 ? <ArrowUpRight size={14} color="#6366f1" /> : <ArrowDownRight size={14} color="#10b981" />}
                                  {t.narration}
                                </div>
                               <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ref: {t.referenceType} #{t.referenceId}</div>
                            </td>
                            <td style={{ padding: '20px', color: '#10b981', fontWeight: '700' }}>{parseFloat(t.debit) > 0 ? `₹${parseFloat(t.debit).toLocaleString()}` : '-'}</td>
                            <td style={{ padding: '20px', color: '#6366f1', fontWeight: '700' }}>{parseFloat(t.credit) > 0 ? `₹${parseFloat(t.credit).toLocaleString()}` : '-'}</td>
                            <td style={{ padding: '20px 32px', fontWeight: '800' }}>₹{parseFloat(t.runningBalance).toLocaleString()}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

            </div>
          ) : (
            <div style={{ padding: '100px', textAlign: 'center', background: 'white', borderRadius: '32px', border: `1px solid ${theme.border}` }}>
               <BookOpen size={64} style={{ color: '#e2e8f0', marginBottom: '24px' }} />
               <h3 style={{ color: '#1e293b' }}>Select a vendor to view their Account Statement</h3>
               <p style={{ color: '#64748b' }}>Real-time transaction history sync from Ledger Engine.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const statCard = {
  background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0'
};
const statLabel = { margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const statValue = { margin: '8px 0 0', fontSize: '1.75rem', fontWeight: '900' };
