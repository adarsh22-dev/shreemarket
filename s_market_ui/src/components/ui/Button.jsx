import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  fullWidth = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? 'btn-full' : '';

  return (
    <button
      className={`btn ${variantClass} ${widthClass} ${className}`}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

export default Button;
