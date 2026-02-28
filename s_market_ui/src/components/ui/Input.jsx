import React from 'react';

const Input = ({
    label,
    id,
    type = 'text',
    error,
    icon: Icon,
    onIconClick,
    ...props
}) => {
    return (
        <div style={{ marginBottom: '1rem', width: '100%' }}>
            {label && (
                <label
                    htmlFor={id}
                    style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--text-main)'
                    }}
                >
                    {label}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <input
                    id={id}
                    type={type}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        paddingRight: Icon ? '2.5rem' : '1rem',
                        borderRadius: '0.5rem',
                        border: `1px solid ${error ? 'red' : 'var(--border-color)'}`,
                        fontSize: '1rem',
                        color: 'var(--text-main)',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-orange)'}
                    onBlur={(e) => e.target.style.borderColor = error ? 'red' : 'var(--border-color)'}
                    {...props}
                />
                {Icon && (
                    <button
                        type="button"
                        onClick={onIconClick}
                        style={{
                            position: 'absolute',
                            right: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer', // Check for specific pointer instructions
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                        }}
                    >
                        <Icon size={20} />
                    </button>
                )}
            </div>
            {error && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'red' }}>
                    {error}
                </p>
            )}
        </div>
    );
};

export default Input;
