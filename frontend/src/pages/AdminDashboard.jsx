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

  // Modal review state
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await adminService.getStats();
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
  ]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
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

      {/* 1. Metric Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* 2. Visual Analytics & Charts */}
      <AdminCharts stats={stats} />

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
