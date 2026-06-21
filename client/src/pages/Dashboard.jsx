import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Dashboard for Workspace: {workspaceId}</h1>
      <button 
        onClick={() => navigate('/select-workspace')}
        style={{ 
          marginTop: '1rem', 
          padding: '0.5rem 1rem', 
          cursor: 'pointer',
          background: 'var(--card-hover)',
          color: 'var(--text-primary)',
          border: '1px solid var(--text-secondary)',
          borderRadius: '4px'
        }}
      >
        Switch Workspace
      </button>
    </div>
  );
}
