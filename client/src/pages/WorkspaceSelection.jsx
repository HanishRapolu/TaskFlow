import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './WorkspaceSelection.css';

export default function WorkspaceSelection() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await api.get('/users/me/workspaces');
        setWorkspaces(data);
      } catch (err) {
        console.error('Failed to fetch workspaces', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkspaces();
  }, [navigate]);

  const handleSelect = (id) => {
    navigate(`/w/${id}`);
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'W';

  if (loading) {
    return (
      <div className="ws-container">
        <div className="ws-loader">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-container">
      {/* Animated Background */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="ws-logo-placeholder stagger-1">
        <div className="app-logo">TaskFlow</div>
      </div>
      
      <div className="ws-header stagger-2">
        <h1 className="ws-title">Which Project?</h1>
        <p className="ws-subtitle">Select a project to enter your dashboard.</p>
      </div>
      
      <div className="ws-grid">
        {workspaces.map((ws, index) => (
          <div 
            key={ws.workspaceId} 
            className={`ws-card glass-card stagger-card`}
            style={{ animationDelay: `${0.2 + (index * 0.1)}s` }}
            onClick={() => handleSelect(ws.workspaceId)}
            tabIndex={0}
          >
            <div className="ws-avatar pulse-hover">
              {getInitial(ws.name)}
            </div>
            <span className="ws-name">{ws.name}</span>
            <span className="ws-role-badge">{ws.role}</span>
          </div>
        ))}

        <div 
          className="ws-card ws-add-card glass-card stagger-card" 
          style={{ animationDelay: `${0.2 + (workspaces.length * 0.1)}s` }}
          onClick={() => console.log('Create new project')} 
          tabIndex={0}
        >
          <div className="ws-avatar-add">
            <Plus size={32} color="#f8fafc" />
          </div>
          <span className="ws-name">Add Project</span>
        </div>
      </div>
      
      <div className="ws-footer stagger-footer">
        <div className="user-greeting">Logged in as {user?.name || 'User'}</div>
        <button className="modern-btn secondary logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
