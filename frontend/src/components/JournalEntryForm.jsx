import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('financial');

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
    } catch (error) {
      console.error('Error creating journal entry:', error);
      setError(t('journal.errors.create_failed', 'Failed to create journal entry'));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} role="form">
      <input name="date" type="date" value={form.date} onChange={handleChange} required aria-label={t('journal.form.date', 'Date')} />
      <input name="description" value={form.description} onChange={handleChange} placeholder={t('journal.form.description', 'Description')} required aria-label={t('journal.form.description_aria', 'Description')} />
      <input name="debit_account" value={form.debit_account} onChange={handleChange} placeholder={t('journal.form.debit_account', 'Debit Account ID')} required aria-label={t('journal.form.debit_account_aria', 'Debit Account')} />
      <input name="credit_account" value={form.credit_account} onChange={handleChange} placeholder={t('journal.form.credit_account', 'Credit Account ID')} required aria-label={t('journal.form.credit_account_aria', 'Credit Account')} />
      <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder={t('journal.form.amount', 'Amount')} required aria-label={t('journal.form.amount_aria', 'Amount')} />
      <button type="submit" disabled={loading}>{loading ? t('journal.status.creating', 'Creating...') : t('journal.actions.create', 'Create')}</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default JournalEntryForm;
