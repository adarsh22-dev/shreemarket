'use client';

export default function Input({ className = '', ...props }) {
  return (
    <input
      style={{
        padding: '10px 12px',
        border: '1px solid #E5E5E5',
        borderRadius: '6px',
        fontSize: '14px',
        fontFamily: 'inherit',
        width: '100%',
        outline: 'none',
        transition: 'border-color 0.15s',
      }}
      className={className}
      {...props}
    />
  );
}
