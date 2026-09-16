import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  RotateCcw,
  Building2,
  UserCheck,
  Sparkles,
  AlertOctagon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { officerService } from '../services/api';
import OfficerStatsCards from '../components/officer/OfficerStatsCards';
import OfficerGrievanceCard from '../components/officer/OfficerGrievanceCard';
import OfficerActionModal from '../components/officer/OfficerActionModal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

const STATUS_TABS = [
  { id: 'All', label: 'All Tasks' },
  { id: 'Assigned', label: 'Pending Review' },
  { id: 'Under Review', label: 'Under Review' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low'];

const OfficerDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({});
  const [grievances, setGrievances] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Modal
  const [modalGrievance, setModalGrievance] = useState(null);
  const [modalActionType, setModalActionType] = useState('start');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch stats
      const statsRes = await officerService.getStats();
      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      // 2. Fetch assigned grievances
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedPriority !== 'All') params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const grievancesRes = await officerService.getGrievances(params);
      if (grievancesRes.success) {
        setGrievances(grievancesRes.grievances || []);
        setCounts(grievancesRes.counts || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load officer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStatus, selectedPriority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleResetFilters = () => {
    setSelectedStatus('All');
    setSelectedPriority('All');
    setSearchQuery('');
  };

  const handleOpenAction = (grievance, actionType) => {
    setModalGrievance(grievance);
    setModalActionType(actionType);
  };

  const handleActionCompleted = (updatedGrievance) => {
    setModalGrievance(null);
    fetchDashboardData();
  };

  if (loading && Object.keys(stats).length === 0) {
    return <LoadingState message="Loading Field Officer Workspace..." />;
  }

  if (error && Object.keys(stats).length === 0) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="app-container main-content">
      {/* Officer Header */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
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
            FIELD OFFICER WORKSPACE • {user?.department || 'Municipal Services'}
          </span>
          <h1
            style={{
              color: 'white',
              fontSize: '1.85rem',
              marginTop: '0.6rem',
              marginBottom: '0.3rem',
            }}
          >
            Welcome, {user?.name}!
          </h1>
          <p style={{ color: '#ccfbf1', fontSize: '0.95rem' }}>
            {user?.designation || 'Senior Executive Engineer'} • Redressal Duty
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboardData}
          className="btn btn-sm"
          style={{ backgroundColor: 'white', color: 'var(--secondary)', fontWeight: 600 }}
        >
          <RotateCcw size={14} />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* 1. Stats Cards */}
      <OfficerStatsCards stats={stats} />

      {/* 2. Filter & Search Bar */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem' }}>
        {/* Status Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {STATUS_TABS.map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--secondary)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'var(--secondary-light)' : 'transparent',
                  color: isSelected ? 'var(--secondary)' : 'var(--text-muted)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Priority Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ gridColumn: 'span 2' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by title, location, tracking ID, or citizen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
              />
              <Search
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
          </form>

          {/* Priority Dropdown */}
          <select
            className="form-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-secondary btn-sm"
            style={{ height: '38px' }}
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Showing <strong>{grievances.length}</strong> assigned task(s)
        </span>
      </div>

      {/* Grievance Cards Grid */}
      {grievances.length === 0 ? (
        <EmptyState
          title="No Assigned Grievances"
          description="You have no grievances currently assigned matching the selected status or priority filter."
          actionText="Refresh Live Queue"
          actionLink="#"
        />
      ) : (
        <div className="grievances-grid">
          {grievances.map((grievance) => (
            <OfficerGrievanceCard
              key={grievance._id}
              grievance={grievance}
              onOpenAction={handleOpenAction}
            />
          ))}
        </div>
      )}

      {/* Action Modal */}
      {modalGrievance && (
        <OfficerActionModal
          grievance={modalGrievance}
          actionType={modalActionType}
          onClose={() => setModalGrievance(null)}
          onUpdated={handleActionCompleted}
        />
      )}
    </div>
  );
};

export default OfficerDashboard;