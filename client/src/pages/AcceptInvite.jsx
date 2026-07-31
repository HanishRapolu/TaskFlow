import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Building2, ShieldCheck, LogOut, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, registerInvited, logout } = useContext(AuthContext);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const { data } = await api.get(`/auth/invites/${token}`);
        setInviteData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invite link.');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleLogoutAndRetry = async () => {
    await logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await registerInvited({ name: name.trim(), password, token });
      toast.success(`Welcome to ${inviteData.workspaceName}, ${data.name}!`);
      navigate('/select-workspace');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not accept the invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Verifying invitation..." />;

  if (user) {
    return (
      <div className="auth-page">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="glass-card auth-card">
          <h2 className="auth-title" style={{ fontSize: '1.6rem' }}>Already signed in</h2>
          <div className="auth-error" style={{ marginTop: '1rem' }}>
            <AlertCircle size={18} />
            <span>
              You are logged in as <strong>{user.name}</strong>. Log out first to accept this invitation.
            </span>
          </div>
          <div className="modal-footer" style={{ borderTop: 'none', padding: '1.25rem 0 0' }}>
            <button className="modern-btn secondary" onClick={handleLogoutAndRetry}>
              <LogOut size={18} /> Log out
            </button>
            <button className="modern-btn primary" onClick={() => navigate('/select-workspace')}>
              Go to my projects <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="glass-card auth-card">
        <div className="auth-logo">
          <div className="auth-logo-badge">
            <Sparkles size={24} />
          </div>
        </div>

        {error && !inviteData ? (
          <>
            <h2 className="auth-title" style={{ fontSize: '1.6rem' }}>Invitation unavailable</h2>
            <div className="auth-error" style={{ marginTop: '1rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', padding: '1.25rem 0 0', justifyContent: 'center' }}>
              <Link to="/login" className="modern-btn secondary">Go to Sign in</Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="auth-title" style={{ fontSize: '1.6rem' }}>You're invited!</h2>
            <p className="auth-subtitle" style={{ marginBottom: '1.4rem' }}>
              Join <strong style={{ color: 'var(--accent-blue)' }}>{inviteData.workspaceName}</strong> on TaskFlow
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.4rem' }}>
              <div className="chip" style={{ justifyContent: 'flex-start', padding: '0.5rem 0.9rem', fontSize: '0.85rem', maxWidth: 'none' }}>
                <Building2 size={16} style={{ color: 'var(--accent-blue)' }} />
                <span>Workspace: {inviteData.workspaceName}</span>
              </div>
              <div className="chip" style={{ justifyContent: 'flex-start', padding: '0.5rem 0.9rem', fontSize: '0.85rem', maxWidth: 'none' }}>
                <ShieldCheck size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Role: {inviteData.role}</span>
              </div>
              {inviteData.userExists && (
                <div className="auth-success" style={{ marginBottom: 0 }}>
                  <Sparkles size={18} />
                  <span>Welcome back! Enter your password to accept.</span>
                </div>
              )}
            </div>

            {error && (
              <div className="auth-error" style={{ marginBottom: '0.9rem' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field">
                <label className="field-label">Invited email</label>
                <div className="input-wrap">
                  <span className="input-icon"><Mail size={18} /></span>
                  <input type="email" value={inviteData.email} className="modern-input" disabled />
                </div>
              </div>

              {!inviteData.userExists && (
                <div className="field">
                  <label className="field-label">Full name</label>
                  <div className="input-wrap">
                    <span className="input-icon"><User size={18} /></span>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="modern-input"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="field">
                <label className="field-label">{inviteData.userExists ? 'Your password' : 'Create a password'}</label>
                <div className="input-wrap">
                  <span className="input-icon"><Lock size={18} /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={inviteData.userExists ? 'Enter your password' : 'At least 6 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="modern-input"
                    required
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ position: 'absolute', right: '0.45rem', width: '34px', height: '34px' }}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="modern-btn primary" disabled={isSubmitting}>
                {isSubmitting ? <span className="spinner sm"></span> : <ArrowRight size={18} />}
                {isSubmitting
                  ? 'Joining...'
                  : inviteData.userExists
                    ? 'Sign in & join'
                    : 'Create account & join'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
