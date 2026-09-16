import React from 'react';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
  UserCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

const STATUS_OPTIONS = [
  'All',
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

const CATEGORY_OPTIONS = [
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

const DEPARTMENT_OPTIONS = [
  'All',
  'Public Works & Roads',
  'Waste Management',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Health & Environment',
  'Traffic & Transport',
  'General Administration',
];

const PRIORITY_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low'];

const AdminGrievanceTable = ({
  grievances = [],
  totalCount = 0,
  filters = {},
  onFilterChange,
  onResetFilters,
  onOpenReview,
}) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Table Header & Search Filter Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
            Grievance Redressal Records ({totalCount})
          </h3>

          <button
            type="button"
            onClick={onResetFilters}
            className="btn btn-secondary btn-sm"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Filter Controls Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search title, tracking ID, citizen, or location..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
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

          {/* Status Dropdown */}
          <select
            className="form-select"
            value={filters.status || 'All'}
            onChange={(e) => onFilterChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>

          {/* Department Dropdown */}
          <select
            className="form-select"
            value={filters.department || 'All'}
            onChange={(e) => onFilterChange('department', e.target.value)}
          >
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                Dept: {dept}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            className="form-select"
            value={filters.priority || 'All'}
            onChange={(e) => onFilterChange('priority', e.target.value)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            className="form-select"
            value={filters.sortOrder || 'desc'}
            onChange={(e) => onFilterChange('sortOrder', e.target.value)}
          >
            <option value="desc">Date: Newest First</option>
            <option value="asc">Date: Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderBottom: '2px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <th style={{ padding: '0.75rem 1rem' }}>Tracking ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Grievance & Citizen</th>
              <th style={{ padding: '0.75rem 1rem' }}>Department & Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Assigned Officer</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {grievances.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  No grievances found matching the current search & filter criteria.
                </td>
              </tr>
            ) : (
              grievances.map((g) => (
                <tr
                  key={g._id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* Tracking ID */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'var(--primary)',
                        }}
                      >
                        {g.trackingId}
                      </span>
                      {g.aiAnalysis?.status === 'completed' && (
                        <span
                          style={{
                            fontSize: '0.675rem',
                            color: 'var(--accent)',
                            fontWeight: 700,
                          }}
                        >
                          ✨ AI Analyzed
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Title & Citizen */}
                  <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        lineHeight: '1.3',
                        marginBottom: '0.2rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {g.title}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Citizen: {g.citizenId?.name || 'Anonymous'} {g.citizenId?.phone ? `(${g.citizenId.phone})` : ''}
                    </div>
                  </td>

                  {/* Department & Category */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem' }}>
                      {g.department}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {g.category}
                    </div>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <PriorityBadge priority={g.priority} size="sm" />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <StatusBadge status={g.status} size="sm" />
                  </td>

                  {/* Assigned Officer */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {g.assignedOfficer ? (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                          {g.assignedOfficer.name}
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          {g.assignedOfficer.designation || 'Officer'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.775rem', color: '#dc2626', fontWeight: 600 }}>
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDate(g.createdAt)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => onOpenReview(g)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.35rem 0.75rem' }}
                    >
                      <UserCheck size={14} />
                      <span>Review & Assign</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGrievanceTable;
