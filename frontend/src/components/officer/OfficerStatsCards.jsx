import React from 'react';
import {
  FileText,
  Clock,
  Search,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  Building2,
  UserCheck,
} from 'lucide-react';

const OfficerStatsCards = ({ stats = {} }) => {
  const cards = [
    {
      label: 'Total Assigned',
      value: stats.totalAssigned || 0,
      icon: FileText,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
    },
    {
      label: 'Pending Review',
      value: stats.pending || 0,
      icon: Clock,
      color: '#0284c7',
      bg: '#f0f9ff',
    },
    {
      label: 'Under Inspection',
      value: stats.underReview || 0,
      icon: Search,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      label: 'Field Work In Progress',
      value: stats.inProgress || 0,
      icon: Wrench,
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      label: 'Successfully Resolved',
      value: stats.resolved || 0,
      icon: CheckCircle2,
      color: '#10b981',
      bg: '#ecfdf5',
    },
    {
      label: 'Critical & High Priority',
      value: stats.criticalHigh || 0,
      icon: AlertOctagon,
      color: '#dc2626',
      bg: '#fee2e2',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: 'var(--text-main)',
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {card.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OfficerStatsCards;