import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  PlusCircle,
  FileText,
  LayoutDashboard,
  LogOut,
  User,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="app-container navbar-container">
        {/* Brand */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div className="nav-brand">
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>Civic</span>
                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>AI</span>
                <span className="nav-brand-tag">PORTAL</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
                Smart Grievance Redressal
              </span>
            </div>
          </div>
        </Link>

        {/* Navigation Links for Authenticated Users */}
        {isAuthenticated && (
          <nav>
            <ul className="nav-links">
              {role === 'citizen' && (
                <>
                  <li>
                    <NavLink
                      to="/dashboard"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/grievances"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <FileText size={16} />
                      <span>My Grievances</span>
                    </NavLink>
                  </li>
                  <li>
                    <Link to="/grievances/new" className="btn btn-primary btn-sm">
                      <PlusCircle size={16} />
                      <span>File Grievance</span>
                    </Link>
                  </li>
                </>
              )}

              {role === 'officer' && (
                <>
                  <li>
                    <NavLink
                      to="/officer"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <Wrench size={16} />
                      <span>Officer Tasks</span>
                    </NavLink>
                  </li>
                </>
              )}

              {role === 'admin' && (
                <>
                  <li>
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                      <LayoutDashboard size={16} />
                      <span>Admin Oversight</span>
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        )}

        {/* User Profile / Auth Actions */}
        <div className="user-menu">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <NotificationBell />
              <div className="user-pill">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user?.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--primary)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {role} • {user?.department !== 'None' ? user?.department : 'Citizen'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;