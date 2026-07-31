import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      toast.success('Account created! Your workspace is ready.');
      navigate('/select-workspace');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <div className="glass-card auth-card">
        <div className="auth-logo">
          <div className="auth-logo-badge">
            <Zap size={24} />
          </div>
        </div>

        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">
          Register as an Owner — your personal workspace is created automatically
        </p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="field-label">Full name</label>
            <div className="input-wrap">
              <span className="input-icon"><User size={18} /></span>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="modern-input"
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Email address</label>
            <div className="input-wrap">
              <span className="input-icon"><Mail size={18} /></span>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="modern-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="input-wrap">
              <span className="input-icon"><Lock size={18} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modern-input"
                autoComplete="new-password"
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
            {isSubmitting ? <span className="spinner sm"></span> : <UserPlus size={18} />}
            {isSubmitting ? 'Creating account...' : 'Sign up as Owner'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', alignItems: 'center' }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          Owners get full access to settings and team invitations
        </div>

        <div className="auth-alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
