import Link from 'next/link';

export default function NotFound() {
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
      <h1 style={{ fontSize: '4rem', fontWeight: 700, color: '#FF5722', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Page Not Found</h2>
      <p style={{ color: '#666', maxWidth: '400px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          padding: '10px 24px',
          backgroundColor: '#FF5722',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Back to Home
      </Link>
    </div>
  );
}
