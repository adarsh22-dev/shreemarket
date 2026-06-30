'use client';

import React from 'react';
import './Modal.css';

/**
 * Reusable Modal Component
 * @param {boolean} isOpen - whether modal is open
 * @param {function} onClose - callback to close modal
 * @param {string} title - modal title
 * @param {ReactNode} children - modal body content
 * @param {ReactNode} footer - modal footer (buttons)
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
