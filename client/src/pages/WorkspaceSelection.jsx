import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Zap, Crown, ShieldCheck, User, Info, ArrowRight, Inbox, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const ROLE_META = {
  owner: { icon: Crown, className: 'role-owner', label: 'Owner' },
  admin: { icon: ShieldCheck, className: 'role-admin', label: 'Admin' },
  member: { icon: User, className: 'role-member', label: 'Member' },
};

export default function WorkspaceSelection() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await api.get('/users/me/workspaces');
        setWorkspaces(data || []);
      } catch (err) {
        console.error('Failed to fetch workspaces', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'W');
  const getRoleBadge = (role) => {
    const meta = ROLE_META[role] || ROLE_META.member;
    const Icon = meta.icon;
    return (
      <span className={`badge ${meta.className}`}>
        <Icon size={12} />
        {meta.label}
      </span>
    );
  };

  if (loading) return <Spinner label="Loading your projects..." />;

  return (
    <div className="ws-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="ws-topbar">
        <div className="auth-logo">
          <div className="auth-logo-badge" style={{ width: 40, height: 40 }}>
            <Zap size={22} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>TaskFlow</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div className="ws-user-chip">
            <div className="ws-user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user?.name || 'User'}</span>
          </div>
          <button className="icon-btn" onClick={handleLogout} aria-label="Sign out" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="ws-header stagger-1">
        <h1 className="ws-title">Choose your <span className="ws-title-gradient">project</span></h1>
        <p className="ws-subtitle">Select a project to open your dashboard</p>
      </div>

      {workspaces.length === 0 ? (
        <div className="glass-card ws-empty">
          <div className="empty-state-icon">
            <Inbox size={36} />
          </div>
          <h3>No projects yet</h3>
          <p>Registering a new owner account automatically creates a personal workspace for you.</p>
        </div>
      ) : (
        <div className="ws-grid">
          {workspaces.map((ws) => (
            <div
              key={ws.workspaceId}
              className="ws-card glass-card"
              onClick={() => navigate(`/w/${ws.workspaceId}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/w/${ws.workspaceId}`)}
              tabIndex={0}
              role="button"
            >
              <div className="ws-avatar">{getInitial(ws.name)}</div>
              <span className="ws-name">{ws.name}</span>
              {getRoleBadge(ws.role)}
            </div>
          ))}

          <div
            className="ws-card ws-add-card glass-card"
            onClick={() => setShowAddModal(true)}
            onKeyDown={(e) => e.key === 'Enter' && setShowAddModal(true)}
            tabIndex={0}
            role="button"
          >
            <div className="ws-add-icon">
              <Plus size={34} />
            </div>
            <span className="ws-name">Add Project</span>
            <span className="badge role-member" style={{ marginTop: '0.2rem' }}>
              <Info size={12} /> How it works
            </span>
          </div>
        </div>
      )}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create a new project"
        icon={<Sparkles size={20} />}
      >
        <div className="info-banner">
          <Info size={18} />
          <span>
            New projects (workspaces) are created automatically when a new <strong>Owner account</strong> is
            registered on TaskFlow. Each owner gets their own workspace named after them.
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Once your project exists, you can invite teammates by email as <strong>Admins</strong> or{' '}
          <strong>Members</strong> from inside the dashboard. Admins and Owners can create tasks, approve
          pending work and manage the team.
        </p>
        <div className="modal-footer" style={{ borderTop: 'none', padding: '0.5rem 0 0' }}>
          <button
            className="modern-btn primary"
            onClick={() => {
              setShowAddModal(false);
              navigate('/register');
            }}
          >
            Register an Owner account <ArrowRight size={18} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
