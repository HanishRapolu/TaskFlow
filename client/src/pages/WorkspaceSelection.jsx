import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Zap, Crown, ShieldCheck, User, Building2, Info, Sparkles } from 'lucide-react';
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
  const [companies, setCompanies] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [companyError, setCompanyError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/users/me/workspaces');
        setCompanies(data?.companies || []);
        setWorkspaces(data?.workspaces || []);
      } catch (err) {
        console.error('Failed to fetch workspaces', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setCompanyError('');
    if (!companyName.trim()) {
      setCompanyError('Company name is required.');
      return;
    }
    setCreatingCompany(true);
    try {
      const { data } = await api.post('/companies', { name: companyName.trim() });
      setCompanies((prev) => [
        ...prev,
        { companyId: data.data._id, name: data.data.name, role: 'owner' },
      ]);
      setCompanyName('');
      setShowCreateCompany(false);
    } catch (err) {
      setCompanyError(err.response?.data?.message || 'Could not create the company.');
    } finally {
      setCreatingCompany(false);
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

  if (loading) return <Spinner label="Loading your organization..." />;

  const hasCompany = companies.length > 0;
  const hasWorkspaces = workspaces.length > 0;

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
        <h1 className="ws-title">
          Welcome, <span className="ws-title-gradient">{user?.name?.split(' ')[0] || 'there'}</span>
        </h1>
        <p className="ws-subtitle">Your company and the projects you belong to</p>
      </div>

      {!hasCompany && !hasWorkspaces ? (
        <div className="glass-card ws-empty">
          <div className="empty-state-icon">
            <Building2 size={36} />
          </div>
          <h3>You don't have a company yet</h3>
          <p>Create your own organization to start building projects with your team.</p>
          <button className="modern-btn primary" onClick={() => setShowCreateCompany(true)}>
            <Sparkles size={18} /> Create your company
          </button>
        </div>
      ) : (
        <div className="ws-sections">
          {hasCompany && (
            <section className="ws-section">
              <div className="ws-section-head">
                <h2 className="ws-section-title">Your Company</h2>
                <span className="badge role-owner">
                  <Crown size={12} /> Owner
                </span>
              </div>
              <div className="ws-grid">
                {companies.map((c) => (
                  <div
                    key={c.companyId}
                    className="ws-card glass-card"
                    onClick={() => navigate(`/c/${c.companyId}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/c/${c.companyId}`)}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="ws-avatar company-avatar">
                      <Building2 size={36} />
                    </div>
                    <span className="ws-name">{c.name}</span>
                    {getRoleBadge(c.role)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasWorkspaces && (
            <section className="ws-section">
              <div className="ws-section-head">
                <h2 className="ws-section-title">Projects you're in</h2>
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
            </section>
          )}
        </div>
      )}

      <Modal
        open={showCreateCompany}
        onClose={() => {
          setShowCreateCompany(false);
          setCompanyError('');
        }}
        title="Create your company"
        icon={<Building2 size={20} />}
        footer={
          <>
            <button
              className="modern-btn secondary"
              onClick={() => {
                setShowCreateCompany(false);
                setCompanyError('');
              }}
            >
              Cancel
            </button>
            <button
              className="modern-btn primary"
              type="submit"
              form="create-company-form"
              disabled={creatingCompany}
            >
              {creatingCompany ? <span className="spinner sm"></span> : <Sparkles size={17} />}
              {creatingCompany ? 'Creating...' : 'Create company'}
            </button>
          </>
        }
      >
        {companyError && (
          <div className="auth-error">
            <Info size={18} />
            <span>{companyError}</span>
          </div>
        )}
        <form id="create-company-form" onSubmit={handleCreateCompany} className="invite-form">
          <div className="field">
            <label className="field-label"><Building2 size={14} /> Company name</label>
            <input
              type="text"
              placeholder="e.g. Acme Inc."
              className="modern-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Your company groups the projects (workspaces) you create. You can create projects
            inside your company and invite teammates to them by email.
          </p>
        </form>
      </Modal>

      {!hasCompany && hasWorkspaces && (
        <button
          className="modern-btn ghost create-company-link"
          onClick={() => setShowCreateCompany(true)}
        >
          <Building2 size={16} /> Create your own company
        </button>
      )}
    </div>
  );
}
