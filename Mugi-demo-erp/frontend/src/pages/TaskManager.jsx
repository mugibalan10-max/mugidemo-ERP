import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';
import { 
  Briefcase, CheckCircle2, Clock, AlertCircle, Plus, 
  BarChart2, Users, Calendar, ArrowRight, Kanban, Filter
} from 'lucide-react';

/**
 * Enterprise Task & Project Management Dashboard
 * Zen Finance ERP Standard
 */
export default function TaskManager() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    openTasks: 0,
    completedTasks: 0,
    activeSprints: 0
  });
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', priority: 'Medium' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/task-manager')
      ]);
      setProjects(projRes.data);
      setTasks(taskRes.data);
      
      setStats({
        totalProjects: projRes.data.length,
        openTasks: taskRes.data.filter(t => t.status !== 'Completed').length,
        completedTasks: taskRes.data.filter(t => t.status === 'Completed').length,
        activeSprints: 0 // Logic to be implemented
      });
    } catch (err) {
      console.error("Fetch Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      await api.post('/api/projects', newProject);
      setShowProjectModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to create project");
    }
  };

  const handleApproveTask = async (id) => {
    try {
      await api.patch(`/api/task-manager/${id}/approve`);
      alert("✅ Task officially approved!");
      fetchData();
    } catch (err) {
      alert("Approval failed");
    }
  };

  const theme = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    bg: '#f8fafc',
    card: '#ffffff',
    textMain: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0'
  };

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
                onClick={() => setShowProjectModal(true)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '12px 24px', borderRadius: '14px', background: theme.primary, 
                  color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                }}
              >
                <Plus size={18} /> New Project
              </button>
            </div>
          </header>

          {/* Stats Grid */}
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
              <p style={statValue}>18 Active</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            
            {/* Project List */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Active Projects</h3>
                <Filter size={20} style={{ color: theme.textMuted, cursor: 'pointer' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {projects.map(prj => (
                  <div key={prj.id} style={{ 
                    ...prjCard, 
                    borderLeft: `6px solid ${prj.priority === 'High' ? theme.danger : prj.priority === 'Medium' ? theme.warning : theme.success}` 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: theme.textMuted }}>{prj.projectCode}</span>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', 
                        background: '#f1f5f9', color: theme.textMain, fontWeight: '700' 
                      }}>{prj.status}</span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>{prj.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: theme.textMuted, marginBottom: '24px', lineHeight: '1.5' }}>{prj.description || 'No description provided.'}</p>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px' }}>
                        <span>Progress</span>
                        <span>{prj.completionPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${prj.completionPercent}%`, height: '100%', background: theme.primary, borderRadius: '4px' }}></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                         <Clock size={14} style={{ color: theme.textMuted }} />
                         <span style={{ fontSize: '0.75rem', color: theme.textMuted }}>{prj._count?.tasks || 0} Tasks</span>
                      </div>
                      <button style={{ 
                        padding: '8px 16px', borderRadius: '10px', background: '#f1f5f9', 
                        border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        Open Board <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Table */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: `1px solid ${theme.border}` }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '20px' }}>Recent Tasks Across Projects</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: '0.8rem' }}>
                      <th style={{ padding: '12px' }}>TASK</th>
                      <th style={{ padding: '12px' }}>ASSIGNEE</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px' }}>PRIORITY</th>
                      <th style={{ padding: '12px' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${theme.bg}` }}>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: theme.primary }}>{t.taskCode}</span>
                          <p style={{ margin: '4px 0 0', fontWeight: '600', fontSize: '0.9rem' }}>{t.title}</p>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: theme.primary, color: 'white', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {t.assignee?.name?.charAt(0) || 'U'}
                            </div>
                            <span style={{ fontSize: '0.85rem' }}>{t.assignee?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                           <span style={{ 
                             fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: '800',
                             background: t.status === 'Completed' ? '#10b98115' : '#6366f115',
                             color: t.status === 'Completed' ? theme.success : theme.primary
                           }}>{t.status}</span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                           <span style={{ 
                             fontSize: '0.7rem', fontWeight: '700', 
                             color: t.priority === 'P1' ? theme.danger : t.priority === 'P2' ? theme.warning : theme.textMuted
                           }}>{t.priority}</span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                           {t.approvalStatus === 'Pending' && (
                             <button 
                              onClick={() => handleApproveTask(t.id)}
                              style={{ 
                                padding: '4px 10px', borderRadius: '6px', border: 'none', 
                                background: theme.primary, color: 'white', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer' 
                              }}
                             >
                               Approve
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Sidebar: Recent Activity & Sprints */}
            <aside>
              <div style={sideCard}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} /> Active Sprints
                </h3>
                <div style={{ padding: '20px', borderRadius: '16px', background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '1rem', color: theme.primary }}>Sprint 23 - Q4 Launch</p>
                  <p style={{ margin: '4px 0 16px', fontSize: '0.8rem', color: theme.textMuted }}>Ends in 4 days • 12 Tasks remaining</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Kanban size={16} style={{ color: theme.primary }} />
                     <span style={{ fontSize: '0.85rem', fontWeight: '600', color: theme.primary, cursor: 'pointer' }}>View Sprint Board</span>
                  </div>
                </div>
              </div>

              <div style={{ ...sideCard, marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Urgent Tasks</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tasks.filter(t => t.priority === 'P1' || t.priority === 'Critical').map(t => (
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

      {/* New Project Modal */}
      {showProjectModal && (
        <div style={modalOverlay}>
           <div style={modalContent}>
              <h2 style={{ marginBottom: '24px' }}>Create New Project</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={modalLabel}>Project Name</label>
                  <input 
                    style={modalInput} 
                    placeholder="e.g. Tally Integration" 
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label style={modalLabel}>Description</label>
                  <textarea 
                    style={{ ...modalInput, height: '100px', resize: 'none' }} 
                    placeholder="Briefly describe the project goals..."
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                  />
                </div>
                <div>
                  <label style={modalLabel}>Priority</label>
                  <select style={modalInput} onChange={e => setNewProject({...newProject, priority: e.target.value})}>
                    <option>Low</option>
                    <option selected>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                   <button onClick={() => setShowProjectModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={createProject} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: theme.primary, color: 'white', fontWeight: '700', cursor: 'pointer' }}>Create Project</button>
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

const cardStyle = {
  background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};
const iconBtn = {
  width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
};
const statLabel = { margin: 0, fontSize: '0.85rem', fontWeight: '600', color: '#64748b' };
const statValue = { margin: '4px 0 0', fontSize: '1.75rem', fontWeight: '800', color: '#1e293b' };
const prjCard = {
  background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer'
};
const sideCard = {
  background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0'
};
const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContent = {
  background: 'white', width: '100%', maxWidth: '500px', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
};
const modalLabel = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' };
const modalInput = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' };
