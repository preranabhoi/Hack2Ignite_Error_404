import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPinned, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import GrievanceMap from '../components/common/GrievanceMap';
import AdminReviewModal from '../components/admin/AdminReviewModal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const CATEGORIES = ['All', 'Roads', 'Waste Management', 'Water Supply', 'Electricity', 'Street Lighting', 'Drainage', 'Public Safety', 'Environment', 'Other'];
const DEPARTMENTS = ['All', 'Public Works & Roads', 'Waste Management', 'Water Supply & Sanitation', 'Electricity & Power', 'Health & Environment', 'Traffic & Transport', 'General Administration'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

const AdminMapPage = () => {
  const [grievances, setGrievances] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', department: 'All', priority: 'All', status: 'All' });
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrievances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getGrievances({ limit: 500, sortBy: 'createdAt', sortOrder: 'desc' });
      if (response.success) setGrievances(response.grievances || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load grievances for the map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const filteredGrievances = useMemo(() => grievances.filter((grievance) => (
    (filters.category === 'All' || grievance.category === filters.category) &&
    (filters.department === 'All' || grievance.department === filters.department) &&
    (filters.priority === 'All' || grievance.priority === filters.priority) &&
    (filters.status === 'All' || grievance.status === filters.status)
  )), [filters, grievances]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  if (loading) return <LoadingState message="Loading grievance locations..." />;
  if (error) return <ErrorState message={error} onRetry={fetchGrievances} />;

  return (
    <div className="app-container main-content">
      <div className="page-heading-row">
        <div>
          <Link to="/admin" className="back-link"><ArrowLeft size={16} /> Back to Admin Dashboard</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' }}>
            <MapPinned size={24} color="var(--primary)" />
            <h1 style={{ fontSize: '1.85rem' }}>Grievance Map</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>Explore reported grievances across the civic service area.</p>
        </div>
        <button type="button" onClick={fetchGrievances} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Locations
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Category</span>
            <select className="form-select" value={filters.category} onChange={(event) => handleFilterChange('category', event.target.value)}>
              {CATEGORIES.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Department</span>
            <select className="form-select" value={filters.department} onChange={(event) => handleFilterChange('department', event.target.value)}>
              {DEPARTMENTS.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Priority</span>
            <select className="form-select" value={filters.priority} onChange={(event) => handleFilterChange('priority', event.target.value)}>
              {PRIORITIES.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="form-group" style={{ margin: 0 }}>
            <span className="form-label">Status</span>
            <select className="form-select" value={filters.status} onChange={(event) => handleFilterChange('status', event.target.value)}>
              {STATUSES.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Location Overview</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filteredGrievances.length} matching grievance{filteredGrievances.length === 1 ? '' : 's'}</p>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OpenStreetMap data</span>
        </div>
        <GrievanceMap grievances={filteredGrievances} onMarkerClick={setSelectedGrievance} />
      </div>

      {selectedGrievance && (
        <AdminReviewModal
          grievance={selectedGrievance}
          onClose={() => setSelectedGrievance(null)}
          onUpdated={() => { setSelectedGrievance(null); fetchGrievances(); }}
        />
      )}
    </div>
  );
};

export default AdminMapPage;
