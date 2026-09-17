import React from 'react';
import {
  FileText,
  Clock,
  Search,
  UserCheck,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Percent,
} from 'lucide-react';

const AdminStatsCards = ({ stats = {} }) => {
  const cards = [
    {
      label: 'Total Grievances',
      value: stats.total || 0,
      icon: FileText,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
    },
    {
      label: 'New Submitted',
      value: stats.submitted || 0,
      icon: Clock,
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      label: 'Under Review',
      value: stats.underReview || 0,
      icon: Search,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      label: 'Officer Assigned',
      value: stats.assigned || 0,
      icon: UserCheck,
      color: '#0284c7',
      bg: '#f0f9ff',
    },
    {
      label: 'In Progress',
      value: stats.inProgress || 0,
      icon: Wrench,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      label: 'Resolved',
      value: stats.resolved || 0,
      icon: CheckCircle2,
      color: '#10b981',
      bg: '#ecfdf5',
    },
    {
      label: 'Rejected',
      value: stats.rejected || 0,
      icon: XCircle,
      color: '#ef4444',
      bg: '#fef2f2',
    },
    {
      label: 'Critical & High',
      value: stats.highPriority || stats.criticalHigh || 0,
      icon: AlertOctagon,
      color: '#dc2626',
      bg: '#fee2e2',
    },
    {
      label: 'Resolution Rate',
      value: `${stats.resolutionRate || 0}%`,
      icon: Percent,
      color: '#059669',
      bg: '#ecfdf5',
    },
    {
      label: 'Avg Resolution Time',
      value: `${stats.averageResolutionDays || 0}d`,
      icon: Clock,
      color: '#7c3aed',
      bg: '#f5f3ff',
    },
    {
      label: 'Pending Grievances',
      value: stats.pending || 0,
      icon: AlertOctagon,
      color: '#b45309',
      bg: '#fffbeb',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="card"
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: 'var(--text-main)',
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminStatsCards;
