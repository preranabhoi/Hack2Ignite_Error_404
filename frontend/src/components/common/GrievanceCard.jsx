import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Building2,
  ChevronRight,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const GrievanceCard = ({ grievance }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div>
        {/* Top meta: Tracking ID & Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--primary-border)',
              }}
            >
              {grievance.trackingId}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
              }}
            >
              {grievance.category}
            </span>
          </div>
          <PriorityBadge priority={grievance.priority} size="sm" />
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: '1.05rem',
            marginBottom: '0.6rem',
            color: 'var(--text-main)',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {grievance.title}
        </h4>

        {/* Description Snippet */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {grievance.description}
        </p>

        {/* Metadata info rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={14} color="var(--primary)" />
            <span style={{ fontWeight: 500 }}>Dept:</span>
            <span style={{ color: 'var(--text-main)' }}>{grievance.department}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <MapPin size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {grievance.location?.address}
            </span>
          </div>

          {grievance.images && grievance.images.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ImageIcon size={14} color="var(--secondary)" />
              <span>{grievance.images.length} attachment(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Status & Action */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <StatusBadge status={grievance.status} size="sm" />
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
            {formatDate(grievance.createdAt)}
          </span>
        </div>

        <Link
          to={`/grievances/${grievance._id}`}
          className="btn btn-outline btn-sm"
          style={{ gap: '0.25rem' }}
        >
          <span>Track Status</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default GrievanceCard;
