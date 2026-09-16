import React from 'react';
import { FileQuestion, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({
  title = 'No Grievances Found',
  description = 'You have not submitted any public grievances matching the current filter criteria.',
  actionText = 'File a Grievance',
  actionLink = '/grievances/new',
  icon: Icon = FileQuestion,
}) => {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        padding: '3.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.95rem',
          color: 'var(--text-muted)',
          maxWidth: '460px',
          marginBottom: '1.5rem',
          lineHeight: '1.6',
        }}
      >
        {description}
      </p>
      {actionLink && actionText && (
        <Link to={actionLink} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>{actionText}</span>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
