import React from 'react';

// Accessible Label with consistent classes and optional required indicator
const Label = ({ htmlFor, children, required = false, className = '' }) => {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {children}
      {required && <span aria-hidden="true" className="required-indicator"> *</span>}
    </label>
  );
};

export default Label;
