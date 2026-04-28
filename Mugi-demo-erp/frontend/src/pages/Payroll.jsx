import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { Download, CheckCircle, Clock, Search, X } from 'lucide-react';

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payroll States
  const [payrollMonth, setPayrollMonth] = useState(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(new Date().getFullYear());
  const [payrollReport, setPayrollReport] = useState({ payrolls: [], summary: {} });
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPayrollReport();
  }, [payrollMonth, payrollYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const empRes = await api.get('/api/hr/employees').catch(() => ({ data: [] }));
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollReport = async () => {
    try {
      const res = await api.get(`/api/payroll/report?month=${payrollMonth}&year=${payrollYear}`);
      setPayrollReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const exportBankFile = () => {
    if (!payrollReport.payrolls || payrollReport.payrolls.length === 0) return alert("No payrolls processed for this month.");
    const headers = ["Beneficiary Name", "Account Number", "IFSC", "Amount", "Transfer Date"];
    const rows = payrollReport.payrolls.filter(p => p.status !== 'Draft').map(p => {
        return [p.employee.name, "XXXX-XXXX", "HDFC0001", p.netSalary, new Date().toISOString().split('T')[0]];
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NEFT_Salary_Transfer_${payrollMonth}_${payrollYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const theme = {
    primary: '#4f46e5',
    success: '#10b981',
    danger: '#ef4444',
    textMain: '#1e293b',
    border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: theme.textMain, margin: 0 }}>Payroll Engine</h1>
                <p style={{ color: '#475569', fontSize: '1.1rem', marginTop: '8px' }}>Global MNC-level automated payroll processing, compliance, and bank integration.</p>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <button onClick={exportBankFile} style={{ padding: '16px 24px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <Download size={20} /> Generate NEFT File
                    </button>
                </div>
            </header>

            {/* Run Controls */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', background: 'white', padding: '24px', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '8px', color: '#64748b' }}>PAYROLL MONTH</label>
                    <select value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${theme.border}`, fontWeight: '700' }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Month {m}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', marginBottom: '8px', color: '#64748b' }}>YEAR</label>
                    <input type="number" value={payrollYear} onChange={e => setPayrollYear(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${theme.border}`, fontWeight: '700' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                    <button onClick={async () => {
                        for (const emp of employees) {
                            try {
                                await api.post('/api/payroll/structure', { employeeId: emp.id, basicSalary: emp.salary || 0, hra: 0, allowances: 0, pfEnabled: true, taxPercent: 0 });
                                await api.post('/api/payroll/generate', { employeeId: emp.id, month: payrollMonth, year: payrollYear });
                            } catch (e) {}
                        }
                        fetchPayrollReport();
                        alert("Global Payroll Run Completed.");
                    }} style={{ width: '100%', padding: '14px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}>Execute Global Run</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div style={{ padding: '24px', background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Gross Payroll</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', marginTop: '8px' }}>₹{payrollReport.summary?.totalGross?.toLocaleString() || 0}</div>
                </div>
                <div style={{ padding: '24px', background: 'white', borderRadius: '24px', border: `2px solid ${theme.success}`, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.success, textTransform: 'uppercase' }}>Total Net Payout</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.success, marginTop: '8px' }}>₹{payrollReport.summary?.totalNet?.toLocaleString() || 0}</div>
                </div>
                <div style={{ padding: '24px', background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.danger, textTransform: 'uppercase' }}>Total Tax Deducted</div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: theme.danger, marginTop: '8px' }}>₹{payrollReport.summary?.totalTax?.toLocaleString() || 0}</div>
                </div>
            </div>

            {/* Employee Ledger */}
            <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '20px 24px' }}>Employee</th>
                            <th style={{ padding: '20px' }}>Base CTC</th>
                            <th style={{ padding: '20px' }}>Calculated Net</th>
                            <th style={{ padding: '20px' }}>Status</th>
                            <th style={{ padding: '20px 24px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => {
                            const p = payrollReport.payrolls?.find(pr => pr.employeeId === emp.id);
                            return (
                            <tr key={emp.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                <td style={{ padding: '20px 24px', fontWeight: '800' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>{emp.name.charAt(0)}</div>
                                        <div>
                                            <div>{emp.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>EMP-{emp.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px', fontWeight: '600', color: '#475569' }}>₹{parseFloat(emp.salary || 0).toLocaleString()}</td>
                                <td style={{ padding: '20px', color: p ? theme.success : '#94a3b8', fontWeight: '800', fontSize: '1.1rem' }}>{p ? `₹${parseFloat(p.netSalary).toLocaleString()}` : '-'}</td>
                                <td style={{ padding: '20px' }}>
                                    <span style={{ padding: '6px 12px', background: p ? (p.status === 'Paid' ? '#d1fae5' : '#fef3c7') : '#f1f5f9', color: p ? (p.status === 'Paid' ? '#059669' : '#b45309') : '#64748b', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>
                                        {p ? p.status : 'Pending Run'}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        {!p && (
                                            <button onClick={async () => {
                                                try {
                                                    await api.post('/api/payroll/structure', { employeeId: emp.id, basicSalary: emp.salary || 0, hra: 0, allowances: 0, pfEnabled: true, taxPercent: 0 });
                                                    await api.post('/api/payroll/generate', { employeeId: emp.id, month: payrollMonth, year: payrollYear });
                                                    fetchPayrollReport();
                                                } catch (err) { alert('Payroll failed'); }
                                            }} style={{ padding: '8px 16px', background: 'white', border: `2px solid ${theme.primary}`, color: theme.primary, borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Process</button>
                                        )}
                                        {p && (
                                            <>
                                                <button onClick={async () => {
                                                    try {
                                                        const res = await api.get(`/api/payroll/payslip?employeeId=${emp.id}&month=${payrollMonth}&year=${payrollYear}`);
                                                        setSelectedPayslip(res.data);
                                                    } catch(err) {}
                                                }} style={{ padding: '8px 16px', background: 'white', border: `1px solid ${theme.border}`, color: theme.textMain, borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>View Payslip</button>
                                                
                                                {p.status !== 'Paid' && (
                                                    <button onClick={async () => {
                                                        try {
                                                            await api.post('/api/payroll/pay', { payrollId: p.id, paymentMode: 'NEFT' });
                                                            fetchPayrollReport();
                                                        } catch(err){}
                                                    }} style={{ padding: '8px 16px', background: theme.success, border: 'none', color: 'white', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16}/> Paid</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )})}
                        {employees.length === 0 && !loading && (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No employees provisioned yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* PAYSLIP MODAL */}
      {selectedPayslip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <h2 style={{ margin: 0, fontWeight: '900', color: theme.textMain }}>Official Payslip</h2>
                    <button onClick={() => setSelectedPayslip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
                </div>
                
                <div style={{ padding: '40px' }} id="payslip-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ margin: 0, color: theme.primary, fontWeight: '900', letterSpacing: '-1px' }}>MUGI CORP INC.</h1>
                            <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>Global Headquarters, Finance Tower</div>
                            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Corporate ID: MUGI-ERP-9912</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '900', fontSize: '1.2rem', color: theme.textMain }}>PAYSLIP FOR {selectedPayslip.month}/{selectedPayslip.year}</div>
                            <div style={{ color: '#64748b', marginTop: '4px', fontSize: '0.85rem' }}>Generated on: {new Date().toLocaleDateString()}</div>
                            <div style={{ marginTop: '12px' }}>
                                <span style={{ padding: '6px 16px', background: selectedPayslip.status === 'Paid' ? '#d1fae5' : '#fef3c7', color: selectedPayslip.status === 'Paid' ? '#059669' : '#b45309', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '800' }}>
                                    STATUS: {selectedPayslip.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', marginBottom: '40px' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Employee Name</div>
                            <div style={{ fontWeight: '800', fontSize: '1.1rem', color: theme.textMain }}>{selectedPayslip.employee?.name}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Employee ID</div>
                            <div style={{ fontWeight: '800', color: theme.textMain }}>EMP-{selectedPayslip.employee?.id}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>PAN Number</div>
                            <div style={{ fontWeight: '800', fontFamily: 'monospace', color: theme.textMain }}>{selectedPayslip.employee?.panNumber || '-'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>UAN (PF Number)</div>
                            <div style={{ fontWeight: '800', fontFamily: 'monospace', color: theme.textMain }}>{selectedPayslip.employee?.uanNumber || '-'}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '32px' }}>
                        {/* Earnings */}
                        <div style={{ flex: 1 }}>
                            <div style={{ background: '#f1f5f9', padding: '16px', fontWeight: '900', borderBottom: '3px solid #cbd5e1', color: theme.textMain }}>EARNINGS</div>
                            {selectedPayslip.details?.filter(d => d.type === 'Earning').map(d => (
                                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                    <span style={{ fontWeight: '700' }}>{d.componentName}</span>
                                    <span style={{ fontWeight: '600' }}>₹{parseFloat(d.amount).toLocaleString()}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 12px', background: '#f8fafc', fontWeight: '900', color: theme.textMain, fontSize: '1.1rem' }}>
                                <span>GROSS EARNINGS</span>
                                <span>₹{parseFloat(selectedPayslip.grossSalary).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div style={{ flex: 1 }}>
                            <div style={{ background: '#fef2f2', padding: '16px', fontWeight: '900', borderBottom: '3px solid #fca5a5', color: '#991b1b' }}>DEDUCTIONS</div>
                            {selectedPayslip.details?.filter(d => d.type === 'Deduction').map(d => (
                                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                    <span style={{ fontWeight: '700' }}>{d.componentName}</span>
                                    <span style={{ fontWeight: '600' }}>₹{parseFloat(d.amount).toLocaleString()}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 12px', background: '#fef2f2', fontWeight: '900', color: '#991b1b', fontSize: '1.1rem' }}>
                                <span>TOTAL DEDUCTIONS</span>
                                <span>₹{parseFloat(selectedPayslip.totalDeductions).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', background: '#ecfdf5', border: '2px solid #10b981', padding: '32px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#065f46' }}>NET PAYOUT</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#065f46', letterSpacing: '-1px' }}>₹{parseFloat(selectedPayslip.netSalary).toLocaleString()}</div>
                    </div>
                    
                    {selectedPayslip.status === 'Paid' && (
                        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
                            <CheckCircle size={16} color="#10b981" style={{ verticalAlign: 'middle', marginRight: '8px' }}/>
                            Transferred via {selectedPayslip.paymentMode || 'Bank Transfer'} on {new Date(selectedPayslip.paymentDate).toLocaleString()}
                        </div>
                    )}
                </div>
                
                <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: '#f8fafc' }}>
                    <button onClick={() => {
                        window.print();
                    }} style={{ padding: '14px 32px', background: '#0f172a', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}>Print Official PDF</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
