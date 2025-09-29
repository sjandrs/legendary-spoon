import React, { useState } from 'react';
import { createWorkOrder } from '../api';

const WorkOrderForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ project: '', description: '', status: 'open' });
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
      await createWorkOrder(form);
      setForm({ project: '', description: '', status: 'open' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to create work order');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="project" value={form.project} onChange={handleChange} placeholder="Project ID" required />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
      <select name="status" value={form.status} onChange={handleChange}>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="closed">Closed</option>
      </select>
      <button type="submit" disabled={loading}>Create</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default WorkOrderForm;
