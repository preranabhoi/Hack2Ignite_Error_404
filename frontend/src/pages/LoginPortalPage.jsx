import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Wrench,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

const LoginPortalPage = () => {
  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '2.5rem auto',
        padding: '0 1rem',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          Welcome to CivicAI
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>
          Select your account type to continue.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* 1. CITIZEN CARD */}
        <div
          className="card-elevated"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--primary)',
            padding: '2rem 1.5rem',
          }}
        >
          <div>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '1px solid #dbeafe',
              }}
            >
              <User size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Citizen
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', minHeight: '42px' }}>
              Submit and track public grievances in your local community.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.75rem' }}>
            <Link
              to="/login/citizen"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}
            >
              <span>Sign In as Citizen</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register/citizen"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
            >
              <span>Register as Citizen</span>
            </Link>
          </div>
        </div>

        {/* 2. FIELD OFFICER CARD */}
        <div
          className="card-elevated"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid #0d9488',
            padding: '2rem 1.5rem',
          }}
        >
          <div>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f0fdfa',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '1px solid #ccfbf1',
              }}
            >
              <Wrench size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Field Officer
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', minHeight: '42px' }}>
              Manage assigned grievances and field operations across municipal departments.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.75rem' }}>
            <Link
              to="/login/officer"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                backgroundColor: '#0d9488',
                color: 'white',
                fontWeight: 700,
              }}
            >
              <span>Sign In as Field Officer</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register/officer"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
            >
              <span>Register as Field Officer</span>
            </Link>
          </div>
        </div>

        {/* 3. ADMINISTRATOR CARD */}
        <div
          className="card-elevated"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid #4338ca',
            padding: '2rem 1.5rem',
          }}
        >
          <div>
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eef2ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '1px solid #e0e7ff',
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Administrator
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', minHeight: '42px' }}>
              Manage grievances, officers, departments, and overarching system operations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.75rem' }}>
            <Link
              to="/login/admin"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                backgroundColor: '#4338ca',
                color: 'white',
                fontWeight: 700,
              }}
            >
              <span>Sign In as Administrator</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/register/admin"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
            >
              <span>Register as Administrator</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPortalPage;
