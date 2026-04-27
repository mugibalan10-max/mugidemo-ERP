import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';

/**
 * Employees Page for Mugi Demo ERP
 * Handles Employee Management and Attendance tracking.
 */
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', role: '', salary: '' });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employees");
      if (Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        console.error("Employees data is not an array:", res.data);
        setEmployees([]);
      }
    } catch (err) {
      console.error("Error fetching employees");
      setEmployees([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/api/attendance");
      if (Array.isArray(res.data)) {
        setAttendanceRecords(res.data);
      } else {
        console.error("Attendance data is not an array:", res.data);
        setAttendanceRecords([]);
      }
    } catch (err) {
      console.error("Error fetching attendance");
      setAttendanceRecords([]);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/employees", newEmployee);
      if (res.status === 201 || res.status === 200) {
        setShowAddModal(false);
        setNewEmployee({ name: '', email: '', role: '', salary: '' });
        fetchEmployees();
      }
    } catch (err) {
      alert("Failed to add employee");
    }
  };

  const markAttendance = async (employeeId, status) => {
    try {
      await api.post("/api/attendance", { employeeId, status, date: attendanceDate });
      fetchAttendance();
    } catch (err) {
      alert("Failed to record attendance");
    }
  };

  const theme = {
    primary: '#6366f1',
    secondary: '#a855f7',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', color: theme.textMain, margin: 0 }}>Employee Management</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px' }}>Manage workforce and track daily attendance</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{ padding: '12px 24px', background: theme.primary, color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
            >
              + Add Employee
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            
            {/* Employee List */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: `1px solid ${theme.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Staff Members</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, textAlign: 'left' }}>
                    <th style={{ padding: '16px', color: theme.textMuted }}>ID</th>
                    <th style={{ padding: '16px', color: theme.textMuted }}>Name</th>
                    <th style={{ padding: '16px', color: theme.textMuted }}>Role</th>
                    <th style={{ padding: '16px', color: theme.textMuted }}>Attendance ({attendanceDate})</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '16px', fontWeight: '600' }}>#{emp.id}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '700' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>{emp.email}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600' }}>{emp.role}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => markAttendance(emp.id, 'Present')}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#ecfdf5', color: theme.success, fontWeight: '700', cursor: 'pointer' }}>
                            P
                          </button>
                          <button 
                            onClick={() => markAttendance(emp.id, 'Absent')}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: theme.danger, fontWeight: '700', cursor: 'pointer' }}>
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attendance Logs */}
            <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: `1px solid ${theme.border}` }}>
              <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Attendance Date</h3>
              <input 
                type="date" 
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '32px' }}
              />

              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Recent Records</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {attendanceRecords.slice(0, 10).map((record, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid #f1f5f9` }}>
                    <div>
                      <span style={{ fontWeight: '700' }}>ID: {record.employeeId}</span>
                      <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>{new Date(record.date).toLocaleDateString()}</div>
                    </div>
                    <span style={{ 
                      fontWeight: '800', 
                      color: record.status === 'Present' ? theme.success : theme.danger,
                      fontSize: '0.8rem' 
                    }}>{record.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '400px' }}>
            <h2>New Employee</h2>
            <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <input placeholder="Name" required value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}` }} />
              <input placeholder="Email" required type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}` }} />
              <input placeholder="Role" required value={newEmployee.role} onChange={e => setNewEmployee({...newEmployee, role: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}` }} />
              <input placeholder="Basic Salary" required type="number" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}` }} />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600' }}>Save</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
