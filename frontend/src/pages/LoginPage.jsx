import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Info,
  User,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else if (res.user.role === 'officer') {
          navigate('/officer');
        } else {
          navigate(redirectPath === '/admin' || redirectPath === '/officer' ? '/dashboard' : redirectPath);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid email or password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '620px',
        margin: '2.5rem auto',
        padding: '0 1rem',
      }}
    >
      <div className="card-elevated">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem', fontWeight: 800 }}>
            Welcome to CivicAI
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sign in to submit and track your public grievances
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Universal Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail
                size={16}
                color="var(--text-subtle)"
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                required
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock
                size={16}
                color="var(--text-subtle)"
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Minimal Hackathon Evaluation Note */}
        <div
          style={{
            marginTop: '1.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            textAlign: 'center',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
            <Info size={13} color="#4f46e5" />
            <span
              style={{
                fontSize: '0.725rem',
                color: '#4f46e5',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              FOR HACKATHON EVALUATION
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Quick Demo Access: Demo credentials are provided in the documentation.
          </p>
        </div>

        {/* Registration Options Section */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              marginBottom: '1rem',
              fontWeight: 700,
            }}
          >
            Don't have an account?
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.85rem',
              alignItems: 'stretch',
            }}
          >
            {/* 1. Citizen Registration */}
            <Link
              to="/register/citizen"
              className="register-role-card citizen"
              aria-label="Register as Citizen"
            >
              <div
                className="role-icon-box"
                style={{
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #dbeafe',
                }}
              >
                <User size={20} />
              </div>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  lineHeight: '1.2',
                }}
              >
                Register as Citizen
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.35',
                  marginTop: '0.35rem',
                }}
              >
                Create a public citizen account
              </span>
            </Link>

            {/* 2. Field Officer Registration */}
            <Link
              to="/register/officer"
              className="register-role-card officer"
              aria-label="Register as Field Officer"
            >
              <div
                className="role-icon-box"
                style={{
                  backgroundColor: '#f0fdfa',
                  color: '#0d9488',
                  border: '1px solid #ccfbf1',
                }}
              >
                <Wrench size={20} />
              </div>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  lineHeight: '1.2',
                }}
              >
                Register as Field Officer
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.35',
                  marginTop: '0.35rem',
                }}
              >
                Register for official field operations
              </span>
            </Link>

            {/* 3. Administrator Registration */}
            <Link
              to="/register/admin"
              className="register-role-card admin"
              aria-label="Register as Administrator"
            >
              <div
                className="role-icon-box"
                style={{
                  backgroundColor: '#eef2ff',
                  color: '#4f46e5',
                  border: '1px solid #e0e7ff',
                }}
              >
                <ShieldAlert size={20} />
              </div>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  lineHeight: '1.2',
                }}
              >
                Register as Administrator
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.35',
                  marginTop: '0.35rem',
                }}
              >
                Secure administrator registration
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;