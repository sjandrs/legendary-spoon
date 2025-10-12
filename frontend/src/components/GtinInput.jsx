import React from 'react';

export default function GtinInput({ value, onChange, ...props }) {
  const handleChange = (e) => {
    const raw = e.target.value || '';
    // digits-only, max length 14
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    onChange && onChange({ target: { value: digits } });
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value || ''}
      onChange={handleChange}
      placeholder="GTIN (7-14 digits)"
      {...props}
    />
  );
}
