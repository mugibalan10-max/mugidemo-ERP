import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  Briefcase, CheckCircle2, Clock, AlertCircle, Plus, 
  BarChart2, Users, Calendar, ArrowRight, Kanban, Filter, ArrowLeft
} from 'lucide-react';

/**
 * Enterprise Task & Project Management Dashboard
 * Zen Finance ERP Standard
 */
export default function TaskManager() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    openTasks: 0,
    completedTasks: 0,
    activeSprints: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ 
    name: '', description: '', priority: 'Medium', clientName: '', managerId: '', startDate: '', endDate: '' 
  });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', description: '', priority: 'Medium', projectId: '', assigneeId: '', dueDate: '', estimatedHours: '' 
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, usersRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/task-manager'),
        api.get('/api/admin/users').catch(() => ({ data: [] }))
      ]);
      setProjects(projRes.data);
      setTasks(taskRes.data);
      setUsers(usersRes.data || []);
      
      setStats({
        totalProjects: projRes.data.length,
        openTasks: taskRes.data.filter(t => t.status !== 'Done' && t.status !== 'Completed').length,
        completedTasks: taskRes.data.filter(t => t.status === 'Done' || t.status === 'Completed').length,
        activeSprints: 0
      });
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProject.name) return alert("Project Name is required.");
    try {
      await api.post('/api/projects', newProject);
      setShowProjectModal(false);
      setNewProject({ name: '', description: '', priority: 'Medium', clientName: '', managerId: '', startDate: '', endDate: '' });
      fetchData();
    } catch (err) {
      alert("Failed to create project. Ensure all fields are valid.");
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.projectId) return alert("Task Title and Project are required.");
    try {
      await api.post('/api/task-manager', newTask);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'Medium', projectId: '', assigneeId: '', dueDate: '', estimatedHours: '' });
      fetchData();
    } catch (err) {
      alert("Failed to create task");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.patch(`/api/task-manager/${taskId}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Status update failed or invalid transition");
    }
  };

  const theme = {
    primary: '#6366f1', secondary: '#8b5cf6', success: '#10b981', warning: '#f59e0b',
    danger: '#ef4444', bg: '#f8fafc', card: '#ffffff', textMain: '#1e293b',
    textMuted: '#64748b', border: '#e2e8f0'
  };

  const KANBAN_COLUMNS = [
    { id: 'Backlog', label: 'Backlog', color: '#94a3b8' },
    { id: 'Todo', label: 'To Do', color: '#6366f1' },
    { id: 'In_Progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'Code_Review', label: 'Review', color: '#8b5cf6' },
    { id: 'Testing', label: 'Testing', color: '#ec4899' },
    { id: 'Done', label: 'Done', color: '#10b981' }
  ];

  if (loading) {
     return (
       <div style={{ display: 'flex', height: '100vh', background: theme.bg }}>
         <Sidebar />
         <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="animate-spin" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: theme.primary, borderRadius: '50%' }}></div>
         </div>
       </div>
     );
  }

  // Kanban Board Render
  if (selectedProject) {
    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
             <button onClick={() => setSelectedProject(null)} style={{ padding: '10px 16px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
               <ArrowLeft size={16} /> Back
             </button>
             <div>
               <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: theme.textMain, margin: 0 }}>{selectedProject.name}</h1>
               <p style={{ color: theme.textMuted, margin: '4px 0 0', fontSize: '0.9rem' }}>Project Board ({selectedProject.projectCode})</p>
             </div>
             <div style={{ flex: 1 }} />
             <button 
                onClick={() => { setNewTask({ ...newTask, projectId: selectedProject.id }); setShowTaskModal(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: theme.primary, color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add Task to Board
             </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '24px', minHeight: 'calc(100vh - 200px)' }}>
             {KANBAN_COLUMNS.map(col => {
               const colTasks = projectTasks.filter(t => t.status === col.id);
               return (
                 <div key={col.id} style={{ minWidth: '300px', width: '300px', background: '#f1f5f9', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 8px' }}>
                       <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: col.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} /> {col.label}
                       </h4>
                       <span style={{ fontSize: '0.75rem', fontWeight: '800', color: theme.textMuted, background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>{colTasks.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                       {colTasks.map(task => (
                         <div key={task.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: `1px solid ${theme.border}`, cursor: 'grab' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                               <span style={{ fontSize: '0.65rem', fontWeight: '800', color: theme.primary, background: '#6366f115', padding: '2px 6px', borderRadius: '4px' }}>{task.taskCode}</span>
                               <select 
                                 value={task.status} 
                                 onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                 style={{ fontSize: '0.65rem', fontWeight: '700', border: 'none', background: 'transparent', outline: 'none', color: theme.textMuted, cursor: 'pointer' }}
                               >
                                 {KANBAN_COLUMNS.map(c => <option key={c.id} value={c.id}>Move to {c.label}</option>)}
                               </select>
                            </div>
                            <h5 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: '700', color: theme.textMain, lineHeight: '1.4' }}>{task.title}</h5>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px dashed ${theme.border}`, paddingTop: '12px', marginTop: '12px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                 <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.secondary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                   {task.assignee?.name?.charAt(0) || 'U'}
                                 </div>
                                 {task.dueDate && <span style={{ fontSize: '0.7rem', color: new Date(task.dueDate) < new Date() ? theme.danger : theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>}
                               </div>
                               <span style={{ fontSize: '0.7rem', fontWeight: '800', color: task.priority === 'High' ? theme.danger : theme.textMuted }}>{task.priority}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               );
             })}
          </div>
        </main>

        {/* Reusing existing Modals */}
        {showTaskModal && (
          <div style={modalOverlay}>
            <div style={modalContent}>
               <h2 style={{ marginBottom: '24px' }}>Create New Task in {selectedProject.name}</h2>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                 <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Task Title *</label><input style={modalInput} placeholder="e.g. Implement Login API" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} /></div>
                 <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Description</label><textarea style={{ ...modalInput, height: '80px', resize: 'none' }} placeholder="Briefly describe the task..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} /></div>
                 <div><label style={modalLabel}>Assignee</label><select style={modalInput} value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}><option value="">-- Unassigned --</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                 <div><label style={modalLabel}>Due Date</label><input type="date" style={modalInput} value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} /></div>
                 <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Priority</label><select style={modalInput} value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                 <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button onClick={() => setShowTaskModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={createTask} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Create Task</button>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Dashboard Render (No Project Selected)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar />
      
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: theme.textMain }}>Task Management</h1>
              <p style={{ color: theme.textMuted, marginTop: '4px' }}>Manage enterprise deliverables and team velocity.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
               <button 
                onClick={() => setShowTaskModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: 'white', color: theme.primary, border: `2px solid ${theme.primary}`, fontWeight: '700', cursor: 'pointer' }}
              >
                <Plus size={18} /> Global Task
              </button>
               <button 
                onClick={() => setShowProjectModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', background: theme.primary, color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}
              >
                <Plus size={18} /> New Project
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={cardStyle}>
              <div style={{ ...iconBtn, background: '#6366f115', color: '#6366f1' }}><Briefcase size={20} /></div>
              <h4 style={statLabel}>Total Projects</h4>
              <p style={statValue}>{stats.totalProjects}</p>
            </div>
            <div style={cardStyle}>
              <div style={{ ...iconBtn, background: '#f59e0b15', color: '#f59e0b' }}><Clock size={20} /></div>
              <h4 style={statLabel}>Open Tasks</h4>
              <p style={statValue}>{stats.openTasks}</p>
            </div>
            <div style={cardStyle}>
              <div style={{ ...iconBtn, background: '#10b98115', color: '#10b981' }}><CheckCircle2 size={20} /></div>
              <h4 style={statLabel}>Completed</h4>
              <p style={statValue}>{stats.completedTasks}</p>
            </div>
            <div style={cardStyle}>
              <div style={{ ...iconBtn, background: '#8b5cf615', color: '#8b5cf6' }}><Users size={20} /></div>
              <h4 style={statLabel}>Team Resources</h4>
              <p style={statValue}>{users.length || 18} Active</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Active Projects</h3>
                <Filter size={20} style={{ color: theme.textMuted, cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {projects.map(prj => (
                  <div key={prj.id} style={{ ...prjCard, borderLeft: `6px solid ${prj.priority === 'High' ? theme.danger : prj.priority === 'Medium' ? theme.warning : theme.success}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: theme.textMuted }}>{prj.projectCode}</span>
                      <span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', color: theme.textMain, fontWeight: '700' }}>{prj.status}</span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{prj.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: theme.textMuted, marginBottom: '24px', lineHeight: '1.5' }}>{prj.description || 'No description provided.'}</p>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px' }}>
                        <span>Progress</span><span>{prj.completionPercentage || 0}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${prj.completionPercentage || 0}%`, height: '100%', background: theme.primary, borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <Clock size={14} style={{ color: theme.textMuted }} />
                         <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{prj.totalTasks || 0} Tasks</span>
                      </div>
                      <button 
                        onClick={() => setSelectedProject(prj)} 
                        style={{ padding: '8px 16px', borderRadius: '10px', background: '#f1f5f9', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Open Board <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '20px' }}>Recent Tasks Across Projects</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: '0.8rem' }}>
                      <th style={{ padding: '12px' }}>TASK</th><th style={{ padding: '12px' }}>ASSIGNEE</th><th style={{ padding: '12px' }}>STATUS</th><th style={{ padding: '12px' }}>PRIORITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 8).map(t => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${theme.bg}` }}>
                        <td style={{ padding: '16px 12px' }}><span style={{ fontSize: '0.7rem', fontWeight: '700', color: theme.primary }}>{t.taskCode}</span><p style={{ margin: '4px 0 0', fontWeight: '600', fontSize: '0.9rem' }}>{t.title}</p></td>
                        <td style={{ padding: '16px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.primary, color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.assignee?.name?.charAt(0) || 'U'}</div><span style={{ fontSize: '0.85rem' }}>{t.assignee?.name || 'Unassigned'}</span></div></td>
                        <td style={{ padding: '16px 12px' }}><span style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', background: '#f1f5f9', color: theme.textMain }}>{t.status.replace('_', ' ')}</span></td>
                        <td style={{ padding: '16px 12px' }}><span style={{ fontSize: '0.7rem', fontWeight: '700', color: t.priority === 'High' ? theme.danger : theme.textMuted }}>{t.priority}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside>
              <div style={{ ...sideCard, marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Urgent / Overdue Tasks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tasks.filter(t => (t.priority === 'High' || (t.dueDate && new Date(t.dueDate) < new Date())) && t.status !== 'Done').map(t => (
                    <div key={t.id} style={{ display: 'flex', gap: '12px' }}>
                       <div style={{ minWidth: '4px', borderRadius: '2px', background: theme.danger }}></div>
                       <div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: theme.textMain }}>{t.title}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textMuted }}>{t.taskCode} • Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}</p>
                       </div>
                    </div>
                  ))}
                  {tasks.length === 0 && <p style={{ fontSize: '0.85rem', color: theme.textMuted, textAlign: 'center' }}>No critical tasks.</p>}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showProjectModal && (
        <div style={modalOverlay}>
           <div style={modalContent}>
              <h2 style={{ marginBottom: '24px' }}>Create New Project</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Project Name *</label><input style={modalInput} placeholder="e.g. ERP Cloud Migration" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Description</label><textarea style={{ ...modalInput, height: '80px', resize: 'none' }} placeholder="Briefly describe the project goals..." value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} /></div>
                <div><label style={modalLabel}>Client Name (Optional)</label><input style={modalInput} placeholder="e.g. Acme Corp" value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} /></div>
                <div><label style={modalLabel}>Project Manager</label><select style={modalInput} value={newProject.managerId} onChange={e => setNewProject({...newProject, managerId: e.target.value})}><option value="">-- Unassigned --</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <div><label style={modalLabel}>Start Date</label><input type="date" style={modalInput} value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} /></div>
                <div><label style={modalLabel}>Deadline</label><input type="date" style={modalInput} value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Priority</label><select style={modalInput} value={newProject.priority} onChange={e => setNewProject({...newProject, priority: e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button onClick={() => setShowProjectModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={createProject} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Create Project</button>
                </div>
              </div>
           </div>
        </div>
      )}

      {showTaskModal && (
        <div style={modalOverlay}>
           <div style={modalContent}>
              <h2 style={{ marginBottom: '24px' }}>Create Global Task</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Task Title *</label><input style={modalInput} placeholder="e.g. Implement Login API" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={modalLabel}>Description</label><textarea style={{ ...modalInput, height: '80px', resize: 'none' }} placeholder="Briefly describe the task..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} /></div>
                <div><label style={modalLabel}>Project *</label><select style={modalInput} value={newTask.projectId} onChange={e => setNewTask({...newTask, projectId: e.target.value})}><option value="">-- Select Project --</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label style={modalLabel}>Assignee</label><select style={modalInput} value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}><option value="">-- Unassigned --</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <div><label style={modalLabel}>Due Date</label><input type="date" style={modalInput} value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} /></div>
                <div><label style={modalLabel}>Priority</label><select style={modalInput} value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button onClick={() => setShowTaskModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={createTask} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Create Task</button>
                </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const cardStyle = { background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const iconBtn = { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' };
const statLabel = { margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#64748b' };
const statValue = { margin: '4px 0 0', fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' };
const prjCard = { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' };
const sideCard = { background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { background: 'white', width: '100%', maxWidth: '650px', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' };
const modalLabel = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' };
