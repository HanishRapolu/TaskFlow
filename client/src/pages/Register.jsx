import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await api.post('/auth/register', {
        name,
        email,
        password
      });
      // Registration successful (this creates their personal default workspace too)
      window.location.href = '/login'; // Or we could auto-login
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card" style={{ maxWidth: '450px' }}>
        <h2 className="login-title">Create Account</h2>
        <p className="login-subtitle">Start your own workspace</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="modern-input"
            required
          />
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="modern-input"
            required
          />
          <input 
            type="password" 
            placeholder="Create Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modern-input"
            required
          />
          <button type="submit" className="modern-btn primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Sign Up as Owner'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Login</Link>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
    </div>
  );
}
