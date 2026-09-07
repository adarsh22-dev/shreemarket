import React from 'react';
import './Toggle.css';

/**
 * Unified Toggle switch component for the Admin Portal.
 *
 * Props:
 *   - on: boolean - whether the toggle is ON
 *   - onChange: function - callback when toggled, receives new boolean value
 *   - size: 'sm' | 'md' (default 'md') - size variant
 *   - color: 'green' | 'blue' | 'red' (default 'green') - ON state color
 *   - disabled: boolean - whether the toggle is disabled
 *   - label: string - optional label text next to the toggle
 *   - id: string - optional id for accessibility
 */
export default function Toggle({ on, onChange, size = 'md', color = 'green', disabled = false, label, id }) {
    const handleKeyDown = (e) => {
        if (disabled) return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange(!on);
        }
    };

    const trackClass = [
        'adm-toggle',
        `adm-toggle--${size}`,
        on ? `adm-toggle--on adm-toggle--${color}` : 'adm-toggle--off',
        disabled ? 'adm-toggle--disabled' : '',
    ].filter(Boolean).join(' ');

    return (
        <label
            className={`adm-toggle-wrap ${disabled ? 'adm-toggle-wrap--disabled' : ''}`}
            htmlFor={id}
        >
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label || 'Toggle'}
                disabled={disabled}
                className={trackClass}
                onClick={() => !disabled && onChange(!on)}
                onKeyDown={handleKeyDown}
            >
                <span className="adm-toggle__thumb" />
            </button>
            {label && <span className="adm-toggle__label">{label}</span>}
        </label>
    );
}
