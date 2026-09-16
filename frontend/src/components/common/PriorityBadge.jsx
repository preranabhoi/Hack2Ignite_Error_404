import React from 'react';
import { ArrowDown, Minus, ArrowUp, AlertOctagon } from 'lucide-react';

const priorityConfig = {
  Low: {
    className: 'priority-low',
    icon: ArrowDown,
    label: 'Low Priority',
  },
  Medium: {
    className: 'priority-medium',
    icon: Minus,
    label: 'Medium Priority',
  },
  High: {
    className: 'priority-high',
    icon: ArrowUp,
    label: 'High Priority',
  },
  Critical: {
    className: 'priority-critical',
    icon: AlertOctagon,
    label: 'Critical Priority',
  },
};

const PriorityBadge = ({ priority, showIcon = true, size = 'md' }) => {
  const config = priorityConfig[priority] || priorityConfig.Medium;
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

export default PriorityBadge;
