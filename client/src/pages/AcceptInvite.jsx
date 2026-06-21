import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import '../pages/WorkspaceSelection.css'; // Reuse glass styles

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState(null);
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If they are already logged in, they should logout first to accept a new invite
    // Or we could auto-accept, but keeping it simple: require logout
    if (user) {
      setError('You are already logged in. Please log out first to accept a new invitation.');
      setLoading(false);
      return;
    }

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
  }, [token, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/auth/register-invited', {
        name,
        password,
        token
      });
      // Registration successful, token is now set via cookie/response.
      // Easiest way is to just redirect to login so they can log in normally.
      // Wait, our backend auto-logged them in and set cookies, but we aren't updating AuthContext manually here.
      // Redirecting to /login or /select-workspace (and forcing a reload) is safest.
      window.location.href = '/select-workspace';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="login-container">
        <div className="ws-loader">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="glass-card login-card" style={{ maxWidth: '450px' }}>
        <h2 className="login-title" style={{ fontSize: '2rem' }}>Accept Invitation</h2>
        
        {error ? (
          <div>
            <div className="login-error" style={{ marginBottom: '2rem' }}>{error}</div>
            <button className="modern-btn secondary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <p className="login-subtitle">
              You've been invited to join <strong>{inviteData.workspaceName}</strong> as an <strong>{inviteData.role}</strong>.
              <br />
              {inviteData.userExists && <span style={{ color: 'var(--accent-blue)' }}>Welcome back! Enter your password to accept.</span>}
            </p>
            
            <form onSubmit={handleSubmit} className="login-form">
              <input 
                type="email" 
                value={inviteData.email}
                className="modern-input"
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              {!inviteData.userExists && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="modern-input"
                  required
                />
              )}
              <input 
                type="password" 
                placeholder={inviteData.userExists ? "Enter your password" : "Create Password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="modern-input"
                required
              />
              <button type="submit" className="modern-btn primary" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : (inviteData.userExists ? 'Login & Join' : 'Create Account & Join')}
              </button>
            </form>
          </>
        )}
      </div>
      
      {/* Animated background elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
    </div>
  );
}
