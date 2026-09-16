import React from 'react';
import { Check, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ALL_STATUSES = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

const StatusTimeline = ({ history = [], currentStatus = 'Submitted' }) => {
  const isRejected = currentStatus === 'Rejected';

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
        Redressal Progression Timeline
      </h3>

      {isRejected ? (
        <div className="card" style={{ borderLeft: '4px solid var(--status-rejected)', background: 'var(--status-rejected-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <StatusBadge status="Rejected" size="lg" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {history.length > 0 && formatDate(history[history.length - 1].timestamp)}
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#991b1b' }}>
            {history.length > 0 && history[history.length - 1].comment
              ? history[history.length - 1].comment
              : 'This grievance was reviewed and rejected by the administrative authority.'}
          </p>
        </div>
      ) : (
        <div className="timeline-container">
          {history.map((item, index) => {
            const isLast = index === history.length - 1;
            return (
              <div key={index} className="timeline-item">
                <div className={`timeline-dot ${isLast ? 'active' : 'completed'}`}>
                  {isLast ? <Clock size={12} color="white" /> : <Check size={12} color="white" />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <StatusBadge status={item.status} size="sm" />
                      {item.changedBy && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          by {item.changedBy.name} ({item.changedBy.role})
                        </span>
                      )}
                    </div>
                    <span className="timeline-time">{formatDate(item.timestamp)}</span>
                  </div>
                  {item.comment && <p className="timeline-desc">{item.comment}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusTimeline;
