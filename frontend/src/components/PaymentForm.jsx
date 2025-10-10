import React, { useState } from 'react';
import { createPayment } from '../api';

const PaymentForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ content_type: '', object_id: '', amount: '', payment_date: '', method: '', received_by: '' });
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
      await createPayment(form);
      setForm({ content_type: '', object_id: '', amount: '', payment_date: '', method: '', received_by: '' });
      if (onSuccess) onSuccess();
    } catch (_err) {
      setError('Failed to create payment');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="content_type"
        value={form.content_type}
        onChange={handleChange}
        placeholder="Content Type (e.g. invoice)"
        required
      />
      <input
        name="object_id"
        value={form.object_id}
        onChange={handleChange}
        placeholder="Object ID"
        required
      />
      <input
        name="amount"
        type="number"
        value={form.amount}
        onChange={handleChange}
        placeholder="Amount"
        required
      />
      <input
        name="payment_date"
        type="date"
        value={form.payment_date}
        onChange={handleChange}
        required
      />
      <input
        name="method"
        value={form.method}
        onChange={handleChange}
        placeholder="Method"
        required
      />
      <input
        name="received_by"
        value={form.received_by}
        onChange={handleChange}
        placeholder="Received By (User ID)"
      />
      <button type="submit" disabled={loading}>Create</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
};

export default PaymentForm;
