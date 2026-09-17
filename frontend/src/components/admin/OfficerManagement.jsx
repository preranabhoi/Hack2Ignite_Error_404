import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Building,
  Shield,
  Briefcase,
  AlertCircle,
  Loader2,
  MapPin,
  FileText,
} from 'lucide-react';
import { adminService } from '../../services/api';
import CreateOfficerModal from './CreateOfficerModal';
import EditOfficerModal from './EditOfficerModal';
import OfficerDetailModal from './OfficerDetailModal';

const DEPARTMENTS = [
  'All Departments',
  'Public Works & Roads',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Waste Management',
  'Drainage & Sewerage',
  'Street Lighting',
  'Public Safety',
  'Environment',
  'Health & Environment',
  'Traffic & Transport',
  'General Administration',
];

const OFFICER_TYPES = [
  'All Officer Types',
  'Field Officer',
  'Road Maintenance Officer',
  'Water Supply Officer',
  'Electrical Officer',
  'Sanitation Officer',
  'Drainage Officer',
  'Street Lighting Inspector',
  'Public Safety Officer',
  'Environmental Officer',
];

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Active Only', value: 'active' },
  { label: 'Inactive Only', value: 'inactive' },
];

const OfficerManagement = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [officerType, setOfficerType] = useState('All Officer Types');
  const [status, setStatus] = useState('All');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewOfficerId, setViewOfficerId] = useState(null);
  const [editOfficer, setEditOfficer] = useState(null);

  // Status toggle action loading
  const [togglingId, setTogglingId] = useState(null);

  const fetchOfficers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (department !== 'All Departments') params.department = department;
      if (officerType !== 'All Officer Types') params.officerType = officerType;
      if (status !== 'All') params.status = status;

      const res = await adminService.getOfficers(params);
      if (res.success) {
        setOfficers(res.officers || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load officer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [department, officerType, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOfficers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDepartment('All Departments');
    setOfficerType('All Officer Types');
    setStatus('All');
  };

  const handleToggleStatus = async (officer) => {
    const isCurrentlyActive = officer.status === 'active' || officer.isActive !== false;
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionText = isCurrentlyActive ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${actionText} officer "${officer.name}"?`)) {
      return;
    }

    setTogglingId(officer._id);
    try {
      const res = await adminService.updateOfficerStatus(officer._id, newStatus);
      if (res.success) {
        setSuccessToast(`Officer "${officer.name}" ${actionText}d successfully.`);
        setTimeout(() => setSuccessToast(''), 3000);
        // Update local state directly
        setOfficers((prev) =>
          prev.map((o) => (o._id === officer._id ? { ...o, status: newStatus, isActive: newStatus === 'active' } : o))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionText} officer`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.725rem',
                letterSpacing: '0.04em',
              }}
            >
              FIELD FORCE ADMINISTRATION
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Municipal Public Services
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }}>
            Officer Management Directory
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Provision, manage, and monitor municipal field officers and department assignments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={fetchOfficers}
            className="btn btn-secondary btn-sm"
            title="Refresh Directory"
          >
            <RotateCcw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ fontWeight: 600 }}
          >
            <PlusCircle size={16} />
            <span>+ Add Field Officer</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            color: '#065f46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            color: '#991b1b',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              alignItems: 'end',
            }}
          >
            {/* Search Input */}
            <div className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Search Officers</span>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Name, email, or employee ID..."
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                />
                <Search
                  size={15}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Department</span>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer Type Filter */}
            <div className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Officer Type</span>
              <select
                className="form-select"
                value={officerType}
                onChange={(e) => setOfficerType(e.target.value)}
              >
                {OFFICER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="form-group" style={{ margin: 0 }}>
              <span className="form-label">Account Status</span>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                <Filter size={14} />
                <span>Filter</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Officers Table / Directory List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem 0', textAlign: 'center' }}>
            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading field officer directory...</p>
          </div>
        ) : officers.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Users size={28} color="#94a3b8" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
              No field officers found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
              {search || department !== 'All Departments' || status !== 'All'
                ? 'No officers match your current search and filter criteria. Try resetting filters.'
                : 'No field officers have been created yet. Provision your first officer account to begin delegating civic grievances.'}
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <PlusCircle size={15} />
              <span>+ Add Field Officer</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid var(--border-subtle)',
                    textAlign: 'left',
                  }}
                >
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Officer Name</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Employee ID</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Department</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Officer Type / Designation</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ward / Area</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Workload</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => {
                  const isActive = officer.status === 'active' || officer.isActive !== false;
                  return (
                    <tr
                      key={officer._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isActive ? 'transparent' : '#fafafa',
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {officer.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {officer.email}
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            padding: '0.15rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                          }}
                        >
                          {officer.employeeId || 'N/A'}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                          {officer.department}
                        </span>
                      </td>

                      {/* Officer Type / Designation */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#4338ca', fontSize: '0.825rem' }}>
                          {officer.officerType || 'Field Officer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {officer.designation || 'Field Officer'}
                        </div>
                      </td>

                      {/* Ward */}
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                        {officer.ward || 'All Wards'}
                      </td>

                      {/* Assigned Grievance Count */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: (officer.activeGrievancesCount || 0) > 0 ? '#ea580c' : '#059669',
                            }}
                          >
                            {officer.activeGrievancesCount || 0} active
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({officer.totalAssigned || 0} total)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? '#ecfdf5' : '#fef2f2',
                            color: isActive ? '#047857' : '#b91c1c',
                            border: `1px solid ${isActive ? '#a7f3d0' : '#fecaca'}`,
                          }}
                        >
                          {isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setViewOfficerId(officer._id)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title="View Officer Details"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditOfficer(officer)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            title="Edit Officer"
                          >
                            <Edit size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(officer)}
                            disabled={togglingId === officer._id}
                            className="btn btn-sm"
                            style={{
                              padding: '0.3rem 0.55rem',
                              fontSize: '0.75rem',
                              backgroundColor: isActive ? '#fff1f2' : '#f0fdf4',
                              color: isActive ? '#e11d48' : '#16a34a',
                              borderColor: isActive ? '#fecdd3' : '#bbf7d0',
                            }}
                            title={isActive ? 'Deactivate Officer' : 'Activate Officer'}
                          >
                            <Power size={13} />
                            <span>{isActive ? 'Disable' : 'Activate'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Officer Modal */}
      {showCreateModal && (
        <CreateOfficerModal
          onClose={() => setShowCreateModal(false)}
          onOfficerCreated={(newOfficer) => {
            fetchOfficers();
          }}
        />
      )}

      {/* Edit Officer Modal */}
      {editOfficer && (
        <EditOfficerModal
          officer={editOfficer}
          onClose={() => setEditOfficer(null)}
          onUpdated={(updatedOfficer) => {
            fetchOfficers();
          }}
        />
      )}

      {/* View Officer Detail Modal */}
      {viewOfficerId && (
        <OfficerDetailModal
          officerId={viewOfficerId}
          onClose={() => setViewOfficerId(null)}
          onEdit={(officer) => {
            setViewOfficerId(null);
            setEditOfficer(officer);
          }}
        />
      )}
    </div>
  );
};

export default OfficerManagement;
