'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ color: '#666', maxWidth: '400px' }}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          backgroundColor: '#FF5722',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        Try Again
      </button>
    </div>
  );
}
