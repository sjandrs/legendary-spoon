import React, { useState } from 'react';
import { createJournalEntry } from '../api';

const JournalEntryForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    date: '',
    description: '',
    debit_account: '',
    credit_account: '',
    amount: ''
  });
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
      await createJournalEntry(form);
      setForm({ date: '', description: '', debit_account: '', credit_account: '', amount: '' });
      if (onSuccess) onSuccess();
    } catch (_err) {
      setError('Failed to create journal entry');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} role="form">
      <input name="date" type="date" value={form.date} onChange={handleChange} required aria-label="Date" />
      <input name="description" value={form.description} onChange={handleChange} placeholder="Description" required aria-label="Description" />
      <input name="debit_account" value={form.debit_account} onChange={handleChange} placeholder="Debit Account ID" required aria-label="Debit Account" />
      <input name="credit_account" value={form.credit_account} onChange={handleChange} placeholder="Credit Account ID" required aria-label="Credit Account" />
      <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" required aria-label="Amount" />
      <button type="submit" disabled={loading}>Create</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default JournalEntryForm;
