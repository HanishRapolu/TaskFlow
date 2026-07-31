import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Plus, LogOut, Sparkles, Info, Inbox,
  Crown, ShieldCheck, User, AlertTriangle,
} from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

const ROLE_META = {
  owner: { icon: Crown, className: 'role-owner', label: 'Owner' },
  admin: { icon: ShieldCheck, className: 'role-admin', label: 'Admin' },
  member: { icon: User, className: 'role-member', label: 'Member' },
};

export default function CompanyView() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [company, setCompany] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = useCallback(async () => {
    const [companyRes, wsRes] = await Promise.all([
      api.get(`/companies/${companyId}`),
      api.get(`/companies/${companyId}/workspaces`),
    ]);
    return { company: companyRes.data.data, workspaces: wsRes.data.data || [] };
  }, [companyId]);

  useEffect(() => {
    let active = true;
    loadData()
      .then(({ company: c, workspaces: w }) => {
        if (!active) return;
        setCompany(c);
        setWorkspaces(w);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load your company');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newWorkspace.name.trim()) {
      setCreateError('Workspace name is required.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post(`/companies/${companyId}/workspaces`, {
        name: newWorkspace.name.trim(),
        description: newWorkspace.description.trim(),
      });
      setWorkspaces((prev) => [
        ...prev,
        {
          workspaceId: data.data._id,
          name: data.data.name,
          description: data.data.description,
          role: 'owner',
        },
      ]);
      setNewWorkspace({ name: '', description: '' });
      setCreateOpen(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create the workspace.');
    } finally {
      setCreating(false);
    }
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

  if (loading) return <Spinner label="Loading your company..." />;

  if (error) {
    return (
      <div className="auth-page">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="glass-card auth-card">
          <h2 className="auth-title" style={{ fontSize: '1.5rem' }}>Something went wrong</h2>
          <div className="auth-error" style={{ marginTop: '1rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <div className="modal-footer" style={{ borderTop: 'none', padding: '1.25rem 0 0' }}>
            <button className="modern-btn primary" onClick={() => navigate('/select-workspace')}>
              <ArrowLeft size={18} /> Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="ws-topbar">
        <div className="auth-logo">
          <div className="auth-logo-badge" style={{ width: 40, height: 40 }}>
            <Building2 size={22} />
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

      <div className="company-header stagger-1">
        <button
          className="modern-btn secondary company-back"
          onClick={() => navigate('/select-workspace')}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="company-title-row">
          <div className="ws-avatar company-avatar">
            <Building2 size={36} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 className="ws-title" style={{ marginBottom: '0.3rem' }}>{company.name}</h1>
            <p className="ws-subtitle">
              {company.description || `Your organization — manage the projects inside it.`}
            </p>
          </div>
        </div>

        <button className="modern-btn primary" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> Create Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="glass-card ws-empty">
          <div className="empty-state-icon">
            <Inbox size={36} />
          </div>
          <h3>No workspaces yet</h3>
          <p>Create your first project workspace inside {company.name} to get the team moving.</p>
          <button className="modern-btn primary" onClick={() => setCreateOpen(true)}>
            <Plus size={18} /> Create your first workspace
          </button>
        </div>
      ) : (
        <div className="ws-section" style={{ width: '100%', maxWidth: 860, alignItems: 'center' }}>
          <div className="ws-section-head">
            <h2 className="ws-section-title">Workspaces</h2>
            <span className="ws-section-count">{workspaces.length}</span>
          </div>
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
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateError('');
        }}
        title="Create a new workspace"
        icon={<Sparkles size={20} />}
        footer={
          <>
            <button
              className="modern-btn secondary"
              onClick={() => {
                setCreateOpen(false);
                setCreateError('');
              }}
            >
              Cancel
            </button>
            <button
              className="modern-btn primary"
              type="submit"
              form="create-workspace-form"
              disabled={creating}
            >
              {creating ? <span className="spinner sm"></span> : <Plus size={17} />}
              {creating ? 'Creating...' : 'Create workspace'}
            </button>
          </>
        }
      >
        {createError && (
          <div className="auth-error">
            <AlertTriangle size={18} />
            <span>{createError}</span>
          </div>
        )}
        <form id="create-workspace-form" onSubmit={handleCreateWorkspace} className="invite-form">
          <div className="field">
            <label className="field-label"><Building2 size={14} /> Workspace name</label>
            <input
              type="text"
              placeholder="e.g. Marketing"
              className="modern-input"
              value={newWorkspace.name}
              onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label"><Info size={14} /> Description</label>
            <textarea
              placeholder="What is this project about?"
              className="modern-textarea"
              value={newWorkspace.description}
              onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            You'll be the <strong style={{ color: 'var(--text-primary)' }}>Owner</strong> of this
            workspace. Invite teammates by email from inside it.
          </p>
        </form>
      </Modal>
    </div>
  );
}
