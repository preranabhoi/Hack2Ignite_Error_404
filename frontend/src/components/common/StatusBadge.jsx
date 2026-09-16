import React from 'react';
import {
  Clock,
  Search,
  UserCheck,
  Wrench,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const statusConfig = {
  Submitted: {
    className: 'badge-submitted',
    icon: Clock,
    label: 'Submitted',
  },
  'Under Review': {
    className: 'badge-under-review',
    icon: Search,
    label: 'Under Review',
  },
  Assigned: {
    className: 'badge-assigned',
    icon: UserCheck,
    label: 'Assigned',
  },
  'In Progress': {
    className: 'badge-in-progress',
    icon: Wrench,
    label: 'In Progress',
  },
  Resolved: {
    className: 'badge-resolved',
    icon: CheckCircle2,
    label: 'Resolved',
  },
  Rejected: {
    className: 'badge-rejected',
    icon: XCircle,
    label: 'Rejected',
  },
};

const StatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const config = statusConfig[status] || statusConfig.Submitted;
  const Icon = config.icon;

  const sizeStyle =
    size === 'sm'
      ? { fontSize: '0.725rem', padding: '0.15rem 0.5rem' }
      : size === 'lg'
      ? { fontSize: '0.875rem', padding: '0.35rem 0.85rem' }
      : {};

  return (
    <span className={`badge ${config.className}`} style={sizeStyle}>
      {showIcon && <Icon size={size === 'sm' ? 12 : 14} />}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
