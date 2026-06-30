'use client';

export default function Checkbox({ label, className = '', ...props }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }} className={className}>
      <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#FF5722' }} {...props} />
      {label && <span>{label}</span>}
    </label>
  );
}
