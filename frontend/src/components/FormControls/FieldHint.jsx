import React from 'react';

// FieldHint renders helper or error text and exposes an id for aria-describedby
const FieldHint = ({ id, children, type = 'hint' }) => {
  const role = type === 'error' ? 'alert' : undefined;
  return (
    <div id={id} className={`field-${type}`} role={role}>
      {children}
    </div>
  );
};

export default FieldHint;
