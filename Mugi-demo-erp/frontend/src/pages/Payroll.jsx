import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

/**
 * Payroll Page for Mugi Demo ERP
 * Handles Salary Calculations and Payroll Processing.
 */
export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [form, setForm] = useState({ 
    employeeId: '', 
    month: new Date().toLocaleString('default', { month: 'long' }), 
    year: new Date().getFullYear(),
    bonus: 0,
    manualDeductions: 0
  });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchPayroll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error("Employees data is not an array:", data);
        setEmployees([]);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      setEmployees([]);
    }
  };

  const fetchPayroll = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/payroll");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPayrollHistory(data);
      } else {
        console.error("Payroll data is not an array:", data);
        setPayrollHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch payroll:", err);
      setPayrollHistory([]);
    }
  };

  const calculatePayroll = async (e) => {
    e.preventDefault();
    if (!form.employeeId) return alert("Select an employee");
    
    try {
      const res = await fetch("http://localhost:5000/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setCalcResult(data);
        fetchPayroll();
      } else {
        alert("Calculation failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Calculation failed due to network error");
    }
  };

  const theme = {
    primary: '#6366f1',
    success: '#10b981',
    danger: '#ef4444',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: theme.textMain, marginBottom: '32px' }}>Payroll Processing</h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            
            {/* Calculation Form */}
            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ marginBottom: '24px' }}>Generate Payslip</h3>
              <form onSubmit={calculatePayroll} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Select Employee</label>
                  <select 
                    value={form.employeeId} 
                    onChange={e => setForm({...form, employeeId: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }}
                  >
                    <option value="">Choose...</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Month</label>
                    <input value={form.month} onChange={e => setForm({...form, month: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Year</label>
                    <input type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Bonus (₹)</label>
                    <input type="number" value={form.bonus} onChange={e => setForm({...form, bonus: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Deductions (₹)</label>
                    <input type="number" value={form.manualDeductions} onChange={e => setForm({...form, manualDeductions: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}` }} />
                  </div>
                </div>
                <button type="submit" style={{ padding: '14px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>
                  Calculate & Finalize
                </button>
              </form>

              {calcResult && (
                <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 16px', color: theme.success }}>✅ Calculation Complete</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Basic Salary:</span>
                    <span style={{ fontWeight: '700' }}>₹{calcResult.payroll.basicSalary}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Auto Deductions (Absents):</span>
                    <span style={{ color: theme.danger }}>-₹{calcResult.breakdown.autoDeductions.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Bonus:</span>
                    <span style={{ color: theme.success }}>+₹{calcResult.payroll.bonus}</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '16px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800' }}>
                    <span>Net Payable:</span>
                    <span>₹{calcResult.payroll.netSalary}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payroll History */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ marginBottom: '24px' }}>Payroll History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {payrollHistory.map(p => (
                  <div key={p.id} style={{ padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1rem' }}>Employee ID: {p.employeeId}</div>
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{p.month} {p.year} • Status: {p.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '1.2rem', color: theme.primary }}>₹{p.netSalary}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed on {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
