import React, { useState } from 'react';
import { createLedgerAccount } from '../api';

const LedgerAccountForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', code: '', account_type: 'asset' });
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
      await createLedgerAccount(form);
      setForm({ name: '', code: '', account_type: 'asset' });
      if (onSuccess) onSuccess();
    } catch (_err) {
      setError('Failed to create account');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} role="form">
      <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Name" required aria-label="Account Name" />
      <input name="code" type="text" value={form.code} onChange={handleChange} placeholder="Code" required aria-label="Account Code" />
      <select name="account_type" value={form.account_type} onChange={handleChange} aria-label="Account Type">
        <option value="asset">Asset</option>
        <option value="liability">Liability</option>
        <option value="equity">Equity</option>
        <option value="revenue">Revenue</option>
        <option value="expense">Expense</option>
      </select>
      <button type="submit" disabled={loading}>Create</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default LedgerAccountForm;
