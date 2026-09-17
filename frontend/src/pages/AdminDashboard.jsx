import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building,
  RotateCcw,
  Sparkles,
  Download,
  PlusCircle,
} from 'lucide-react';
import { adminService } from '../services/api';
import AdminStatsCards from '../components/admin/AdminStatsCards';
import AdminCharts from '../components/admin/AdminCharts';
import AdminGrievanceTable from '../components/admin/AdminGrievanceTable';
import AdminReviewModal from '../components/admin/AdminReviewModal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import GrievanceMap from '../components/common/GrievanceMap';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [grievances, setGrievances] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for Table
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    category: 'All',
    department: 'All',
    priority: 'All',
    sortOrder: 'desc',
    sortBy: 'createdAt',
  });
  const [analyticsFilters, setAnalyticsFilters] = useState({
    range: '7d',
    startDate: '',
    endDate: '',
    department: 'All',
  });

  // Modal review state
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await adminService.getStats(analyticsFilters);
      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      // 2. Fetch Grievances with filters
      const grievancesRes = await adminService.getGrievances(filters);
      if (grievancesRes.success) {
        setGrievances(grievancesRes.grievances);
        setTotalCount(grievancesRes.totalCount);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load administrator dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [
    filters.status,
    filters.category,
    filters.department,
    filters.priority,
    filters.sortOrder,
    analyticsFilters.range,
    analyticsFilters.startDate,
    analyticsFilters.endDate,
    analyticsFilters.department,
  ]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAnalyticsFilterChange = (field, value) => {
    setAnalyticsFilters((prev) => ({ ...prev, [field]: value }));
    if (field === 'department') {
      setFilters((prev) => ({ ...prev, department: value }));
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'All',
      category: 'All',
      department: 'All',
      priority: 'All',
      sortOrder: 'desc',
      sortBy: 'createdAt',
    });
  };

  const handleGrievanceUpdated = (updatedGrievance) => {
    // Refresh table and stats
    setSelectedGrievance(null);
    fetchDashboardData();
  };

  if (loading && Object.keys(stats).length === 0) {
    return <LoadingState message="Loading Municipal Administration Command Center..." />;
  }

  if (error && Object.keys(stats).length === 0) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="app-container main-content">
      {/* Top Admin Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span
              style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
              }}
            >
              ADMINISTRATIVE CONTROL CENTER
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              BMC Central Governance
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem' }}>Grievance Redressal Oversight</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={14} />
            <span>Refresh Live Data</span>
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Analytics period</span>
            <select className="form-select" value={analyticsFilters.range} onChange={(e) => handleAnalyticsFilterChange('range', e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Department</span>
            <select className="form-select" value={analyticsFilters.department} onChange={(e) => handleAnalyticsFilterChange('department', e.target.value)}>
              <option>All</option>
              <option>Public Works & Roads</option>
              <option>Waste Management</option>
              <option>Water Supply & Sanitation</option>
              <option>Electricity & Power</option>
              <option>Health & Environment</option>
              <option>Traffic & Transport</option>
              <option>General Administration</option>
            </select>
          </label>
          {analyticsFilters.range === 'custom' && (
            <>
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">Start date</span>
                <input type="date" className="form-input" value={analyticsFilters.startDate} onChange={(e) => handleAnalyticsFilterChange('startDate', e.target.value)} />
              </label>
              <label className="form-group" style={{ margin: 0 }}>
                <span className="form-label">End date</span>
                <input type="date" className="form-input" value={analyticsFilters.endDate} onChange={(e) => handleAnalyticsFilterChange('endDate', e.target.value)} />
              </label>
            </>
          )}
        </div>
      </div>

      {/* 1. Metric Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* 2. Visual Analytics & Charts */}
      <AdminCharts stats={stats} />

      {/* Location-based overview */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Location-Based Overview</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current filtered grievance locations</p>
          </div>
          <Link to="/admin/map" className="btn btn-secondary btn-sm">Open Grievance Map</Link>
        </div>
        <GrievanceMap grievances={grievances} height="300px" compact />
      </div>

      {/* 3. Grievance Management Records Table */}
      <AdminGrievanceTable
        grievances={grievances}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onOpenReview={(g) => setSelectedGrievance(g)}
      />

      {/* 4. Interactive Review & Assignment Modal */}
      {selectedGrievance && (
        <AdminReviewModal
          grievance={selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
          onUpdated={handleGrievanceUpdated}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
