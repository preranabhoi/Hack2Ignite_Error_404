import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading civic grievances data...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        gap: '1rem',
      }}
    >
      <Loader2
        size={36}
        color="var(--primary)"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
