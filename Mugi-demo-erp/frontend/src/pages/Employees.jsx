import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { Users, UserPlus, FileText, CheckCircle, ShieldAlert, Award, Search, X, Briefcase, DollarSign, Download, Plus } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // directory, compliance, attendance
  
  const [newEmp, setNewEmp] = useState({
    name: '', email: '', phone: '', departmentId: '', designationId: '', managerId: '',
    panNumber: '', uanNumber: '', esiNumber: '', salary: 0, joiningDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Create departments/designations if they don't exist
      await api.get('/api/health'); // Ping to ensure server is ready
      
      const empRes = await api.get('/api/hr/employees').catch(() => ({ data: [] }));
      setEmployees(empRes.data);
      
      // We will mock departments and designations for now if the API doesn't exist yet, 
      // but ideally we fetch them:
      setDepartments([
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'Finance & Accounts' },
        { id: 3, name: 'Human Resources' },
        { id: 4, name: 'Sales & Marketing' }
      ]);
      setDesignations([
        { id: 1, title: 'Software Engineer', level: 1 },
        { id: 2, title: 'Senior Software Engineer', level: 2 },
        { id: 3, title: 'Finance Manager', level: 3 },
        { id: 4, title: 'HR Executive', level: 1 },
        { id: 5, title: 'VP of Sales', level: 5 }
      ]);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newEmp.name,
        email: newEmp.email,
        phone: newEmp.phone,
        departmentId: newEmp.departmentId || null,
        designationId: newEmp.designationId || null,
        managerId: newEmp.managerId || null,
        panNumber: newEmp.panNumber,
        uanNumber: newEmp.uanNumber,
        esiNumber: newEmp.esiNumber,
        salary: Number(newEmp.salary),
        joiningDate: newEmp.joiningDate
      };
      // For now, post to the updated endpoint. Note: The backend route currently maps `role` and `department` as strings.
      // We are passing new schema fields. If the backend fails, it's because hrRoutes needs to map these correctly.
      await api.post('/api/hr/employees', payload);
      alert("✅ Employee Provisioned Successfully");
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to provision employee. Ensure backend is synced.");
    }
  };

  const exportEmployeeData = () => {
    const headers = ["Emp Code", "Name", "Email", "Department", "Designation", "Status", "PAN", "UAN"];
    const rows = employees.map(e => [
      e.empCode, e.name, e.email, e.department, e.role, e.status, e.panNumber || '-', e.uanNumber || '-'
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Employee_Master_Directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const theme = {
    primary: '#4f46e5',
    secondary: '#8b5cf6',
    success: '#10b981',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#0f172a',
    border: '#cbd5e1'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: theme.secondary, textTransform: 'uppercase', letterSpacing: '1px' }}>HRMS Module</span>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: theme.textMain, margin: 0 }}>Employee Master</h1>
              <p style={{ color: '#475569', fontSize: '1.1rem', marginTop: '8px' }}>Centralized hub for organization structure, compliance, and onboarding.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                onClick={exportEmployeeData}
                style={{ padding: '16px 24px', borderRadius: '12px', background: 'white', color: theme.textMain, border: `1px solid ${theme.border}`, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                <Download size={20} /> Export Directory
                </button>
                <button 
                onClick={() => setShowAddModal(true)}
                style={{ padding: '16px 24px', borderRadius: '12px', background: theme.primary, color: 'white', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' }}
                >
                <UserPlus size={20} /> Provision Employee
                </button>
            </div>
          </header>

          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
             <div style={statCard}>
                <div style={statIconBox}><Users size={24} color={theme.primary} /></div>
                <div>
                   <p style={statLabel}>Total Headcount</p>
                   <h2 style={statValue}>{employees.length}</h2>
                </div>
             </div>
             <div style={statCard}>
                <div style={{...statIconBox, background: '#ecfdf5'}}><CheckCircle size={24} color={theme.success} /></div>
                <div>
                   <p style={statLabel}>Active Employees</p>
                   <h2 style={statValue}>{employees.filter(e => e.status !== 'Terminated').length}</h2>
                </div>
             </div>
             <div style={statCard}>
                <div style={{...statIconBox, background: '#fef2f2'}}><ShieldAlert size={24} color="#ef4444" /></div>
                <div>
                   <p style={statLabel}>Missing PF/UAN Data</p>
                   <h2 style={statValue}>{employees.filter(e => !e.uanNumber).length}</h2>
                </div>
             </div>
             <div style={statCard}>
                <div style={{...statIconBox, background: '#fef3c7'}}><Briefcase size={24} color="#f59e0b" /></div>
                <div>
                   <p style={statLabel}>Open Job Postings</p>
                   <h2 style={statValue}>0</h2>
                </div>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: `2px solid ${theme.border}`, paddingBottom: '16px', overflowX: 'auto' }}>
              <button onClick={() => setActiveTab('directory')} style={{ ...tabStyle, ...(activeTab === 'directory' ? activeTabStyle(theme.primary) : {}) }}>Directory & Roles</button>
              <button onClick={() => setActiveTab('compliance')} style={{ ...tabStyle, ...(activeTab === 'compliance' ? activeTabStyle(theme.primary) : {}) }}>Compliance (PF/ESI)</button>
              <button onClick={() => setActiveTab('attendance')} style={{ ...tabStyle, ...(activeTab === 'attendance' ? activeTabStyle(theme.primary) : {}) }}>Biometric Attendance</button>
          </div>

          {/* Directory Tab */}
          {activeTab === 'directory' && (
            <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '20px 24px' }}>Employee</th>
                    <th style={{ padding: '20px' }}>Department & Role</th>
                    <th style={{ padding: '20px' }}>Reporting Manager</th>
                    <th style={{ padding: '20px' }}>Status</th>
                    <th style={{ padding: '20px 24px', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: theme.primary, fontSize: '1.2rem' }}>
                                    {emp.name.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '800', color: theme.textMain, fontSize: '1.1rem' }}>{emp.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>{emp.empCode || `EMP-${emp.id}`}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{emp.email}</div>
                                </div>
                            </div>
                        </td>
                        <td style={{ padding: '24px' }}>
                            <div style={{ fontWeight: '700' }}>{emp.department?.name || 'Unassigned'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{emp.designation?.title || 'Unassigned'}</div>
                        </td>
                        <td style={{ padding: '24px' }}>
                            {emp.manager ? (
                                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: theme.primary }}>{emp.manager.name}</div>
                            ) : (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                            )}
                        </td>
                        <td style={{ padding: '24px' }}>
                            <span style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '99px', background: emp.status === 'Active' ? '#d1fae5' : '#f1f5f9', color: emp.status === 'Active' ? theme.success : '#64748b', fontWeight: '800' }}>
                                {emp.status}
                            </span>
                        </td>
                        <td style={{ padding: '24px', textAlign: 'right' }}>
                            <button 
                              onClick={() => setSelectedEmployee(emp)}
                              style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer', color: theme.primary }}
                            >
                              View Profile
                            </button>
                        </td>
                    </tr>
                    ))}
                    {employees.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No employees found. Provision a new employee to start.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '20px 24px' }}>Employee</th>
                    <th style={{ padding: '20px' }}>PAN Number</th>
                    <th style={{ padding: '20px' }}>UAN (PF)</th>
                    <th style={{ padding: '20px' }}>ESI Number</th>
                    <th style={{ padding: '20px 24px' }}>Base Salary</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: '20px 24px', fontWeight: '700' }}>{emp.name}</td>
                        <td style={{ padding: '20px', fontFamily: 'monospace', fontWeight: '800', color: emp.panNumber ? theme.textMain : '#cbd5e1' }}>{emp.panNumber || 'MISSING'}</td>
                        <td style={{ padding: '20px', fontFamily: 'monospace', fontWeight: '800', color: emp.uanNumber ? theme.textMain : '#cbd5e1' }}>{emp.uanNumber || 'MISSING'}</td>
                        <td style={{ padding: '20px', fontFamily: 'monospace', fontWeight: '800', color: emp.esiNumber ? theme.textMain : '#cbd5e1' }}>{emp.esiNumber || 'MISSING'}</td>
                        <td style={{ padding: '20px 24px', fontWeight: '800', color: theme.success }}>₹{parseFloat(emp.salary || 0).toLocaleString()}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${theme.border}`, overflow: 'hidden', padding: '32px' }}>
                <h2 style={{ marginTop: 0 }}>Biometric Attendance Terminal</h2>
                <p style={{ color: '#64748b' }}>Select an employee to log manual punch-in/out if biometric sync fails.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
                    {employees.map(emp => (
                        <div key={emp.id} style={{ padding: '20px', border: `1px solid ${theme.border}`, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: '800' }}>{emp.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{emp.empCode || `EMP-${emp.id}`}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={async () => {
                                    await api.post('/api/hr/attendance/punch-in', { employeeId: emp.id });
                                    alert('Punched In');
                                }} style={{ padding: '8px 16px', background: '#ecfdf5', color: theme.success, border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>IN</button>
                                <button onClick={async () => {
                                    // Hack: Assuming we fetch their active punch, but for now we just show UI
                                    alert('Select active attendance record to punch out (Need robust state for UI).');
                                }} style={{ padding: '8px 16px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>OUT</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}


        </div>
      </main>

      {/* PROVISION EMPLOYEE MODAL */}
      {showAddModal && (
        <div style={modalOverlay}>
           <div style={{...modalContent, maxWidth: '900px'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 style={{ margin: 0, fontWeight: '900', fontSize: '2rem' }}>Provision New Employee</h2>
                  <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={28} color="#64748b" /></button>
              </div>
              
              <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                {/* Personal Section */}
                <div>
                    <h3 style={sectionTitle}>1. Personal Information</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div><label style={labelStyle}>Full Name</label><input required style={inputStyle} value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} /></div>
                        <div><label style={labelStyle}>Corporate Email</label><input type="email" required style={inputStyle} value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} /></div>
                        <div><label style={labelStyle}>Phone Number</label><input style={inputStyle} value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} /></div>
                        <div><label style={labelStyle}>Date of Joining</label><input type="date" required style={inputStyle} value={newEmp.joiningDate} onChange={e => setNewEmp({...newEmp, joiningDate: e.target.value})} /></div>
                    </div>
                </div>

                {/* Organization Section */}
                <div>
                    <h3 style={sectionTitle}>2. Organization Structure</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={labelStyle}>Department</label>
                            <select style={inputStyle} value={newEmp.departmentId} onChange={e => setNewEmp({...newEmp, departmentId: e.target.value})}>
                                <option value="">Select...</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Designation / Role</label>
                            <select style={inputStyle} value={newEmp.designationId} onChange={e => setNewEmp({...newEmp, designationId: e.target.value})}>
                                <option value="">Select...</option>
                                {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Reporting Manager</label>
                            <select style={inputStyle} value={newEmp.managerId} onChange={e => setNewEmp({...newEmp, managerId: e.target.value})}>
                                <option value="">None (Top Level)</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Payroll & Compliance Section */}
                <div>
                    <h3 style={sectionTitle}>3. Payroll & Statutory Compliance (India)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div><label style={labelStyle}>PAN Number</label><input style={{...inputStyle, textTransform: 'uppercase'}} placeholder="ABCDE1234F" value={newEmp.panNumber} onChange={e => setNewEmp({...newEmp, panNumber: e.target.value.toUpperCase()})} /></div>
                        <div><label style={labelStyle}>UAN (Provident Fund)</label><input style={inputStyle} placeholder="12-digit UAN" value={newEmp.uanNumber} onChange={e => setNewEmp({...newEmp, uanNumber: e.target.value})} /></div>
                        <div><label style={labelStyle}>ESI Number</label><input style={inputStyle} placeholder="17-digit ESI" value={newEmp.esiNumber} onChange={e => setNewEmp({...newEmp, esiNumber: e.target.value})} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Monthly CTC (Base Salary)</label><div style={{ display: 'flex', alignItems: 'center' }}><span style={{ padding: '14px 16px', background: '#e2e8f0', borderRadius: '12px 0 0 12px', fontWeight: '800', border: '1px solid #cbd5e1', borderRight: 'none' }}>₹</span><input type="number" required style={{...inputStyle, borderRadius: '0 12px 12px 0'}} value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: e.target.value})} /></div></div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                   <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '18px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', fontWeight: '800', fontSize: '1.1rem' }}>Cancel</button>
                   <button type="submit" style={{ flex: 2, padding: '18px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}>Deploy Employee to Master</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* VIEW PROFILE MODAL */}
      {selectedEmployee && (
        <div style={modalOverlay}>
           <div style={{...modalContent, maxWidth: '800px', padding: '0', overflow: 'hidden'}}>
              {/* Header Banner */}
              <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)', padding: '40px', color: 'white', position: 'relative' }}>
                  <button onClick={() => setSelectedEmployee(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><X size={20} /></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', color: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '900', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                          {selectedEmployee.name.charAt(0)}
                      </div>
                      <div>
                          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900' }}>{selectedEmployee.name}</h2>
                          <div style={{ fontSize: '1.1rem', opacity: 0.9, marginTop: '4px', fontWeight: '600' }}>{selectedEmployee.designation?.title || 'Unassigned'} • {selectedEmployee.department?.name || 'Unassigned'}</div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', backdropFilter: 'blur(4px)' }}>{selectedEmployee.empCode || `EMP-${selectedEmployee.id}`}</span>
                              <span style={{ padding: '4px 12px', background: selectedEmployee.status === 'Active' ? '#10b981' : 'rgba(255,255,255,0.2)', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', backdropFilter: 'blur(4px)' }}>{selectedEmployee.status}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Profile Body */}
              <div style={{ padding: '40px', background: '#f8fafc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                      
                      {/* Contact & Personal */}
                      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus size={18}/> Contact Information</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Email Address</span><div style={{ fontWeight: '600', color: theme.textMain }}>{selectedEmployee.email}</div></div>
                              <div><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Phone Number</span><div style={{ fontWeight: '600', color: theme.textMain }}>{selectedEmployee.phone || 'Not Provided'}</div></div>
                              <div><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Date of Joining</span><div style={{ fontWeight: '600', color: theme.textMain }}>{new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
                          </div>
                      </div>

                      {/* Hierarchy & Organization */}
                      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18}/> Hierarchy</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Reporting Manager</span>
                                <div style={{ fontWeight: '700', color: theme.primary, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    {selectedEmployee.manager ? (
                                        <><div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{selectedEmployee.manager.name.charAt(0)}</div> {selectedEmployee.manager.name}</>
                                    ) : 'No Manager (Top Level)'}
                                </div>
                              </div>
                              <div><span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Department</span><div style={{ fontWeight: '600', color: theme.textMain }}>{selectedEmployee.department?.name || 'N/A'}</div></div>
                          </div>
                      </div>

                      {/* Financial & Compliance */}
                      <div style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: theme.textMain, display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={18}/> Compensation & Compliance</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
                              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Monthly CTC</span><div style={{ fontWeight: '900', color: theme.success, fontSize: '1.2rem' }}>₹{parseFloat(selectedEmployee.salary || 0).toLocaleString()}</div></div>
                              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>PAN Number</span><div style={{ fontWeight: '700', color: theme.textMain, fontFamily: 'monospace' }}>{selectedEmployee.panNumber || 'MISSING'}</div></div>
                              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>UAN (PF)</span><div style={{ fontWeight: '700', color: theme.textMain, fontFamily: 'monospace' }}>{selectedEmployee.uanNumber || 'MISSING'}</div></div>
                              <div><span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>ESI Number</span><div style={{ fontWeight: '700', color: theme.textMain, fontFamily: 'monospace' }}>{selectedEmployee.esiNumber || 'MISSING'}</div></div>
                          </div>
                      </div>

                  </div>
              </div>
              <div style={{ padding: '24px 40px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                  <button onClick={() => setSelectedEmployee(null)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Close Profile</button>
                  <button style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Edit Details</button>
              </div>
           </div>
        </div>
      )}

      )}
    </div>
  );
}

// STYLES
const statCard = { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' };
const statIconBox = { width: '56px', height: '56px', borderRadius: '16px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statLabel = { margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const statValue = { margin: '4px 0 0', fontSize: '1.8rem', fontWeight: '900', color: '#0f172a' };

const tabStyle = { padding: '12px 24px', background: 'none', border: 'none', fontSize: '1rem', fontWeight: '700', color: '#64748b', cursor: 'pointer', borderRadius: '12px' };
const activeTabStyle = (color) => ({ background: 'white', color: color, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' });

const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '40px' };
const modalContent = { background: 'white', width: '100%', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', margin: 'auto' };
const sectionTitle = { fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f1f5f9' };
const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '800', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#0f172a', background: 'white' };
