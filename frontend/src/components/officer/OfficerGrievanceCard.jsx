import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  User,
  Phone,
  Sparkles,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

const OfficerGrievanceCard = ({ grievance, onOpenAction }) => {
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
        borderLeft:
          grievance.priority === 'Critical'
            ? '4px solid #ef4444'
            : grievance.priority === 'High'
            ? '4px solid #f59e0b'
            : undefined,
      }}
    >
      <div>
        {/* Top Meta Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--primary)',
                background: 'var(--primary-light)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {grievance.trackingId}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-subtle)',
                padding: '0.15rem 0.45rem',
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
            lineHeight: '1.35',
            marginBottom: '0.5rem',
            color: 'var(--text-main)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {grievance.title}
        </h4>

        {/* Citizen Contact & Location */}
        <div
          style={{
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={13} color="var(--primary)" />
            <span>
              {grievance.citizenId?.name || 'Citizen'} • {grievance.citizenId?.phone || 'No phone'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
            <MapPin size={13} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {grievance.location?.address} (Ward: {grievance.location?.ward || 'General'})
            </span>
          </div>
        </div>

        {/* AI Suggested Action snippet if present */}
        {grievance.aiAnalysis?.suggestedAction && (
          <div
            style={{
              backgroundColor: '#f5f3ff',
              border: '1px solid #ddd6fe',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.775rem',
              color: '#4c1d95',
              marginBottom: '1rem',
              lineHeight: '1.4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, marginBottom: '0.15rem' }}>
              <Sparkles size={12} color="var(--accent)" />
              <span>AI Suggested Action:</span>
            </div>
            <span>{grievance.aiAnalysis.suggestedAction}</span>
          </div>
        )}
      </div>

      {/* Card Footer: Status & Actions */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.85rem',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <StatusBadge status={grievance.status} size="sm" />
          <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
            {formatDate(grievance.createdAt)}
          </span>
        </div>

        {/* Officer Action Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {grievance.status === 'Assigned' && (
            <button
              type="button"
              onClick={() => onOpenAction(grievance, 'start')}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              <Wrench size={13} />
              <span>Start Work</span>
            </button>
          )}

          {grievance.status === 'Under Review' && (
            <button
              type="button"
              onClick={() => onOpenAction(grievance, 'start')}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              <Wrench size={13} />
              <span>Start Work</span>
            </button>
          )}

          {grievance.status === 'In Progress' && (
            <>
              <button
                type="button"
                onClick={() => onOpenAction(grievance, 'progress')}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.775rem' }}
              >
                <FileText size={13} />
                <span>Log Progress</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAction(grievance, 'resolve')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  padding: '0.35rem 0.5rem',
                  fontSize: '0.775rem',
                  backgroundColor: '#059669',
                  color: 'white',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Resolve</span>
              </button>
            </>
          )}

          <Link
            to={`/officer/grievances/${grievance._id}`}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            title="Full inspection view"
          >
            <span>Inspect</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfficerGrievanceCard;