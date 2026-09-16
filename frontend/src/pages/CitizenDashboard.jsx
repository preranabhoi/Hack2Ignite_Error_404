import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Search,
  PhoneCall,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { grievanceService } from '../services/api';
import GrievanceCard from '../components/common/GrievanceCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trackInput, setTrackInput] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceService.getMyGrievances();
      if (res.success) {
        setStats(res.stats || {});
        setRecentGrievances((res.grievances || []).slice(0, 4));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTrackDirect = (e) => {
    e.preventDefault();
    if (trackInput.trim()) {
      navigate(`/grievances/${trackInput.trim().toUpperCase()}`);
    }
  };

  if (loading) {
    return <LoadingState message="Loading your civic dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="app-container main-content">
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Citizen Redressal Portal
          </span>
          <h1
            style={{
              color: 'white',
              fontSize: '1.85rem',
              marginTop: '0.6rem',
              marginBottom: '0.3rem',
            }}
          >
            Welcome back, {user?.name}!
          </h1>
          <p style={{ color: '#dbeafe', fontSize: '0.95rem' }}>
            Track your submitted complaints or report a new civic issue in your ward.
          </p>
        </div>

        <Link
          to="/grievances/new"
          className="btn btn-primary btn-lg"
          style={{
            backgroundColor: 'white',
            color: 'var(--primary)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          }}
        >
          <PlusCircle size={20} />
          <span>File New Grievance</span>
        </Link>
      </div>

      {/* Quick Tracking Bar */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={20} color="var(--primary)" />
          <div>
            <h4 style={{ fontSize: '0.95rem' }}>Quick Tracking by ID</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Know your reference number? Enter it directly (e.g., CIVIC-2026-1042)
            </p>
          </div>
        </div>

        <form
          onSubmit={handleTrackDirect}
          style={{ display: 'flex', gap: '0.5rem', flex: '1', maxWidth: '380px' }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="CIVIC-2026-XXXX"
            value={trackInput}
            onChange={(e) => setTrackInput(e.target.value)}
            style={{ textTransform: 'uppercase' }}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Track
          </button>
        </form>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}
          >
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Filed</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: '#fffbeb', color: '#d97706' }}
          >
            <Wrench size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.inProgress + stats.assigned}</div>
            <div className="stat-label">In Progress / Assigned</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.submitted + stats.underReview}</div>
            <div className="stat-label">Under Review / New</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved Issues</div>
          </div>
        </div>
      </div>

      {/* Recent Grievances Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Recent Grievance Reports</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Latest updates on your reported public issues
            </p>
          </div>

          {recentGrievances.length > 0 && (
            <Link to="/grievances" className="btn btn-secondary btn-sm">
              <span>View All ({stats.total})</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {recentGrievances.length === 0 ? (
          <EmptyState
            title="No Grievances Submitted Yet"
            description="You haven't reported any civic complaints yet. Notice a pothole, broken streetlight, or water issue in your neighborhood? Let the authorities know!"
            actionText="File Your First Grievance"
            actionLink="/grievances/new"
          />
        ) : (
          <div className="grievances-grid">
            {recentGrievances.map((grievance) => (
              <GrievanceCard key={grievance._id} grievance={grievance} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
