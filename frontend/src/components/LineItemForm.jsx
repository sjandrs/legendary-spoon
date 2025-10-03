import React, { useState } from 'react';
import { createLineItem } from '../api';

const LineItemForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ work_order: '', description: '', quantity: 1, unit_price: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createLineItem(form);
      setForm({ work_order: '', description: '', quantity: 1, unit_price: 0 });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to create line item');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} role="form">
      <input name="work_order" value={form.work_order} onChange={handleChange} placeholder="Work Order ID" required aria-label="Work Order ID" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Description" required aria-label="Line Item Description" />
      <input name="quantity" type="number" value={form.quantity} onChange={handleChange} min="1" required aria-label="Quantity" />
      <input name="unit_price" type="number" value={form.unit_price} onChange={handleChange} min="0" step="0.01" required aria-label="Unit Price" />
      <button type="submit" disabled={loading}>Create</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default LineItemForm;
