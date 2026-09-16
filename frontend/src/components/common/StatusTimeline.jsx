import React from 'react';
import { Check, Clock, AlertCircle, Loader, CheckCircle2, Eye, UserCheck, Zap, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ALL_STATUS_FLOW = [
  { key: 'Submitted', label: 'Submitted', icon: Zap, color: '#3b82f6', bg: '#eff6ff' },
  { key: 'Under Review', label: 'Under Review', icon: Eye, color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'Assigned', label: 'Assigned', icon: UserCheck, color: '#0284c7', bg: '#f0f9ff' },
  { key: 'In Progress', label: 'In Progress', icon: Loader, color: '#d97706', bg: '#fffbeb' },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
];

const StatusTimeline = ({ history = [], currentStatus = 'Submitted' }) => {
  const isRejected = currentStatus === 'Rejected';

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

  const currentIdx = ALL_STATUS_FLOW.findIndex((s) => s.key === currentStatus);

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 700 }}>
        Redressal Progression Timeline
      </h3>

      {/* Visual Step Tracker (always shown unless rejected) */}
      {!isRejected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '2rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
        >
          {/* Connector Line */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'var(--border-strong)',
              zIndex: 0,
            }}
          />
          {/* Progress fill */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '10%',
              width: currentIdx >= 0 ? `${(currentIdx / (ALL_STATUS_FLOW.length - 1)) * 80}%` : '0%',
              height: '2px',
              background: 'linear-gradient(90deg, #2563eb, #10b981)',
              zIndex: 1,
              transition: 'width 0.6s ease',
            }}
          />

          {ALL_STATUS_FLOW.map((step, idx) => {
            const isDone = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flex: 1,
                  position: 'relative',
                  zIndex: 2,
                  minWidth: '70px',
                }}
              >
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDone
                      ? '#10b981'
                      : isCurrent
                      ? step.color
                      : 'var(--bg-surface)',
                    border: `2px solid ${isDone ? '#10b981' : isCurrent ? step.color : 'var(--border-strong)'}`,
                    boxShadow: isCurrent ? `0 0 0 4px ${step.bg}` : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isDone ? (
                    <Check size={14} color="white" />
                  ) : (
                    <Icon size={14} color={isCurrent ? 'white' : 'var(--text-muted)'} />
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isDone
                      ? '#10b981'
                      : isCurrent
                      ? step.color
                      : 'var(--text-muted)',
                    textAlign: 'center',
                    lineHeight: '1.2',
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejected State */}
      {isRejected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <XCircle size={24} color="#ef4444" />
          <div>
            <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.95rem' }}>
              Grievance Rejected
            </div>
            <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.2rem' }}>
              {history.length > 0 && history[history.length - 1].comment
                ? history[history.length - 1].comment
                : 'This grievance was reviewed and rejected by the administrative authority.'}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Activity Log */}
      {history.length > 0 && (
        <div className="timeline-container">
          {history.map((item, index) => {
            const isLast = index === history.length - 1;
            const isProgressNote = item.comment?.startsWith('[Progress Update]');
            const displayComment = isProgressNote
              ? item.comment.replace('[Progress Update]', '').trim()
              : item.comment;

            return (
              <div key={index} className="timeline-item">
                <div className={`timeline-dot ${isLast ? 'active' : 'completed'}`}>
                  {isLast ? <Clock size={10} color="white" /> : <Check size={10} color="white" />}
                </div>
                <div
                  className="timeline-content"
                  style={{
                    borderLeft: isProgressNote
                      ? '3px solid #d97706'
                      : isLast
                      ? '3px solid var(--primary)'
                      : '3px solid var(--border-strong)',
                    background: isProgressNote
                      ? '#fffbeb'
                      : isLast
                      ? 'var(--primary-light)'
                      : 'var(--bg-surface)',
                  }}
                >
                  <div className="timeline-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {isProgressNote ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#b45309',
                            background: '#fde68a',
                            padding: '0.1rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            letterSpacing: '0.03em',
                          }}
                        >
                          📋 PROGRESS UPDATE
                        </span>
                      ) : (
                        <StatusBadge status={item.status} size="sm" />
                      )}
                      {item.changedBy && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          by <strong style={{ color: 'var(--text-main)' }}>{item.changedBy.name}</strong>
                          <span
                            style={{
                              marginLeft: '0.25rem',
                              fontSize: '0.7rem',
                              background: 'var(--bg-subtle)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              textTransform: 'capitalize',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.changedBy.role}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="timeline-time">{formatDate(item.timestamp)}</span>
                  </div>
                  {displayComment && (
                    <p className="timeline-desc" style={{ marginTop: '0.3rem', fontSize: '0.875rem' }}>
                      {displayComment}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {history.length === 0 && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No status history recorded yet.
        </p>
      )}
    </div>
  );
};

export default StatusTimeline;
