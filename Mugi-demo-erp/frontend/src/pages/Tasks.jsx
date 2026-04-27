import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', assigned_to: '' });
  const [loading, setLoading] = useState(true);

  const theme = {
    primary: '#6366f1',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#f1f5f9',
    pending: '#f59e0b',
    progress: '#3b82f6',
    done: '#10b981'
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [taskRes, empRes] = await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/employees')
      ]);
      const taskData = taskRes.data;
      const empData = empRes.data;
      
      if (Array.isArray(taskData)) {
        setTasks(taskData);
      } else {
        console.error("Tasks data is not an array:", taskData);
        setTasks([]);
      }

      if (Array.isArray(empData)) {
        setEmployees(empData);
      } else {
        console.error("Employees data is not an array:", empData);
        setEmployees([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setTasks([]);
      setEmployees([]);
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assigned_to) return;

    try {
      await api.post('/api/tasks', newTask);
      setNewTask({ title: '', assigned_to: '' });
      fetchData();
    } catch (err) {
      console.error("Add error:", err);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Done': return theme.done;
      case 'In Progress': return theme.progress;
      default: return theme.pending;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: theme.textMain, marginBottom: '8px' }}>Task Management</h1>
            <p style={{ color: theme.textMuted }}>Assign work to employees and track productivity in real-time.</p>
          </header>

          {/* Add Task Card */}
          <div style={{ 
            background: theme.card, 
            padding: '32px', 
            borderRadius: '24px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginBottom: '40px',
            border: `1px solid ${theme.border}`
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px' }}>Assign New Task</h2>
            <form onSubmit={addTask} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Task Title (e.g. Prepare Quarter Report)"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                style={{ flex: 2, padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
              <select 
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                style={{ flex: 1, padding: '14px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
              >
                <option value="">Assign Employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <button 
                type="submit"
                style={{ 
                  padding: '14px 32px', 
                  borderRadius: '12px', 
                  background: theme.primary, 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Assign Task
              </button>
            </form>
          </div>

          {/* Task List */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {loading ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No tasks assigned yet. Get started above!</p>
            ) : tasks.map(task => (
              <div key={task.id} style={{ 
                background: theme.card, 
                padding: '24px', 
                borderRadius: '20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                border: `1px solid ${theme.border}`
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: theme.textMain }}>{task.title}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: theme.textMuted }}>
                    assigned to <span style={{ color: theme.primary, fontWeight: '600' }}>{task.employee_name || 'Unassigned'}</span>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    padding: '8px 16px', 
                    borderRadius: '99px', 
                    background: `${getStatusColor(task.status)}15`, 
                    color: getStatusColor(task.status),
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    border: `1px solid ${getStatusColor(task.status)}30`
                  }}>
                    {task.status}
                  </div>
                  
                  <select 
                    value={task.status}
                    onChange={(e) => updateStatus(task.id, e.target.value)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: '10px', 
                      border: '1px solid #e2e8f0', 
                      background: '#fff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Pending">Set Pending</option>
                    <option value="In Progress">Set Progress</option>
                    <option value="Done">Set Done</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
