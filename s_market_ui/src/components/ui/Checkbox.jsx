import React from 'react';

const Checkbox = ({ id, name, label, checked, onChange }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
                type="checkbox"
                id={id}
                name={name}
                checked={checked}
                onChange={onChange}
                style={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.5rem',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-orange)'
                }}
            />
            {label && (
                <label
                    htmlFor={id}
                    style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    {label}
                </label>
            )}
        </div>
    );
};

export default Checkbox;
