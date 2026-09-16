import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  FileText,
  Cpu,
  Building,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (role) => {
    try {
      await demoLogin(role);
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          color: 'white',
          padding: '5rem 0 6rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background ambient lighting */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(37,99,235,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <Sparkles size={16} color="#fbbf24" />
              <span>AI-04: Next-Gen Public Grievance Redressal</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                color: 'white',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                fontWeight: 800,
              }}
            >
              Empowering Citizens.{' '}
              <span style={{ color: '#93c5fd' }}>Accelerating Governance.</span>
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                color: '#dbeafe',
                lineHeight: 1.6,
                marginBottom: '2.5rem',
                maxWidth: '680px',
                margin: '0 auto 2.5rem',
              }}
            >
              CivicAI streamlines civic complaint reporting with automated department
              routing, transparent real-time tracking, and verified resolutions for
              cleaner, safer, and smarter communities.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '3rem',
              }}
            >
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary btn-lg"
                  style={{ backgroundColor: 'white', color: 'var(--primary)' }}
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg"
                    style={{ backgroundColor: 'white', color: 'var(--primary)' }}
                  >
                    <span>Report a Grievance</span>
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-secondary btn-lg"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>

            {/* Quick 1-Click Evaluation Login Pills */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🚀 1-Click Demo Access for Hackathon Judges
              </span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={() => handleQuickDemo('citizen')}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#2563eb', color: 'white', border: '1px solid #60a5fa' }}
                >
                  <Users size={14} />
                  <span>Demo Citizen (Aarav)</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('admin')}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#7c3aed', color: 'white', border: '1px solid #a78bfa' }}
                >
                  <ShieldCheck size={14} />
                  <span>Demo Admin (Dr. Vikram)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
              How CivicAI Works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              From submission to resolution, every grievance is tracked transparently.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Step 1 */}
            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Citizen Reports Issue</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Submit grievance with location details, category, photos, and priority. Unique tracking ID is generated instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--secondary-light)',
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Department Assignment</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Complaint is automatically routed to the responsible municipal department (Roads, Water, Power, Sanitation).
              </p>
            </div>

            {/* Step 3 */}
            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Officer Execution</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Field officer reviews inspection data, dispatches maintenance crews, and updates real-time progress history.
              </p>
            </div>

            {/* Step 4 */}
            <div className="card">
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                4
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Verified Resolution</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Resolution proof and action taken remarks are published for citizen verification and administrative audit.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
