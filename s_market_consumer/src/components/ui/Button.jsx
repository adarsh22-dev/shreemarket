'use client';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '14px',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background-color 0.15s',
  };

  const variants = {
    primary: { backgroundColor: '#FF5722', color: 'white' },
    secondary: { backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #E5E5E5' },
    outline: { backgroundColor: 'transparent', color: '#FF5722', border: '1px solid #FF5722' },
    danger: { backgroundColor: '#ef4444', color: 'white' },
  };

  return (
    <button style={{ ...baseStyles, ...variants[variant] }} className={className} {...props}>
      {children}
    </button>
  );
}
