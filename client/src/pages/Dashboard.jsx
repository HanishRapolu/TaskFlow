import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Dashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const wsRes = await api.get(`/workspaces/${workspaceId}`);
        setProject(wsRes.data.data);
        
        const tasksRes = await api.get(`/workspaces/${workspaceId}/tasks`);
        setTasks(tasksRes.data);
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load project dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [workspaceId]);

  const handleTaskAction = async (taskId, action, payload = {}) => {
    try {
      if (action === 'delete') {
        await api.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
        setTasks(tasks.filter(t => t._id !== taskId));
      } else if (action === 'approve') {
        const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${taskId}/approve`);
        setTasks(tasks.map(t => t._id === taskId ? data : t));
      } else if (action === 'status') {
        const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${taskId}/status`, payload);
        setTasks(tasks.map(t => t._id === taskId ? data : t));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading project...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  const role = project.role;
  const canManageMembers = role === 'admin' || role === 'owner';
  const canManageSettings = role === 'owner';

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>{project.name}</h2>
          <span className={`role-badge role-${role}`}>{role}</span>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          
          {canManageMembers && (
            <button 
              className={`nav-item ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              Members & Invites
            </button>
          )}

          {canManageSettings && (
            <button 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <button className="modern-btn secondary" onClick={() => navigate('/select-workspace')}>
            Switch Project
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'tasks' && (
          <div className="boards-view">
            <div className="view-header">
              <h2>Project Tasks</h2>
              <button className="modern-btn primary">+ Create Task</button>
            </div>
            
            <div className="boards-grid">
              {tasks.length === 0 ? (
                <p>No tasks found. Create one to get started!</p>
              ) : (
                tasks.map(task => (
                  <div key={task._id} className="board-card" style={{ borderLeft: task.isApproved ? '3px solid var(--accent-blue)' : '3px solid orange' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3>{task.title}</h3>
                      <span style={{ fontSize: '0.8rem', color: task.isApproved ? '#10b981' : '#f59e0b' }}>
                        {task.status}
                      </span>
                    </div>
                    <p>{task.description || 'No description'}</p>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {!task.isApproved && canManageMembers && (
                        <button className="modern-btn secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleTaskAction(task._id, 'approve')}>Approve</button>
                      )}
                      {canManageMembers && (
                        <button className="modern-btn secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#ef4444' }} onClick={() => handleTaskAction(task._id, 'delete')}>Delete</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && canManageMembers && (
          <div className="members-view">
            <h2>Manage Members</h2>
            <p>Here you can invite new members via email or update existing roles.</p>
          </div>
        )}

        {activeTab === 'settings' && canManageSettings && (
          <div className="settings-view">
            <h2>Project Settings</h2>
            <p>Update project name, description, and billing details.</p>
          </div>
        )}
      </main>
    </div>
  );
}
