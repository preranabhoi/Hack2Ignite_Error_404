import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected network error occurred while connecting to the civic server.',
  onRetry,
}) => {
  return (
    <div
      className="card"
      style={{
        border: '1px solid #fecaca',
        backgroundColor: '#fff5f5',
        textAlign: 'center',
        padding: '3rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <h3 style={{ fontSize: '1.2rem', color: '#991b1b', marginBottom: '0.4rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: '#7f1d1d', maxWidth: '440px', marginBottom: '1.25rem' }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm">
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
