import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { grievanceService } from '../services/api';
import GrievanceCard from '../components/common/GrievanceCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

const STATUS_TABS = [
  'All',
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

const CATEGORIES = [
  'All',
  'Roads',
  'Waste Management',
  'Water Supply',
  'Electricity',
  'Street Lighting',
  'Drainage',
  'Public Safety',
  'Environment',
  'Other',
];

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

const MyGrievancesPage = () => {
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedPriority !== 'All') params.priority = selectedPriority;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await grievanceService.getMyGrievances(params);
      if (res.success) {
        setGrievances(res.grievances || []);
        setStats(res.stats || {});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch grievances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, [selectedStatus, selectedCategory, selectedPriority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGrievances();
  };

  const handleResetFilters = () => {
    setSelectedStatus('All');
    setSelectedCategory('All');
    setSelectedPriority('All');
    setSearchQuery('');
  };

  return (
    <div className="app-container main-content">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>My Public Grievances</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Monitor and track real-time resolution progress of your complaints.
          </p>
        </div>

        <Link to="/grievances/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>File New Grievance</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
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
          {STATUS_TABS.map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Controls */}
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
                placeholder="Search by title, address, or tracking ID..."
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

          {/* Category Dropdown */}
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            className="form-select"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
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
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Showing <strong>{grievances.length}</strong> grievance(s)
        </span>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <LoadingState message="Fetching your grievances..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchGrievances} />
      ) : grievances.length === 0 ? (
        <EmptyState
          title="No Matching Grievances"
          description="We couldn't find any grievances matching your selected filters or search query."
          actionText="File New Grievance"
          actionLink="/grievances/new"
        />
      ) : (
        <div className="grievances-grid">
          {grievances.map((grievance) => (
            <GrievanceCard key={grievance._id} grievance={grievance} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGrievancesPage;
