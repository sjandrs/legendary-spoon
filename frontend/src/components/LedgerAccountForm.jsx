import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createLedgerAccount } from '../api';

const LedgerAccountForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', code: '', account_type: 'asset' });
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
      await createLedgerAccount(form);
      setForm({ name: '', code: '', account_type: 'asset' });
      if (onSuccess) onSuccess();
    } catch (_err) {
      setError(t('ledger.errors.create_failed', 'Failed to create account'));
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} role="form">
      <input name="name" type="text" value={form.name} onChange={handleChange} placeholder={t('ledger.form.name', 'Name')} required aria-label={t('ledger.form.name_aria', 'Account Name')} />
      <input name="code" type="text" value={form.code} onChange={handleChange} placeholder={t('ledger.form.code', 'Code')} required aria-label={t('ledger.form.code_aria', 'Account Code')} />
      <select name="account_type" value={form.account_type} onChange={handleChange} aria-label={t('ledger.form.type', 'Account Type')}>
        <option value="asset">{t('ledger.types.asset', 'Asset')}</option>
        <option value="liability">{t('ledger.types.liability', 'Liability')}</option>
        <option value="equity">{t('ledger.types.equity', 'Equity')}</option>
        <option value="revenue">{t('ledger.types.revenue', 'Revenue')}</option>
        <option value="expense">{t('ledger.types.expense', 'Expense')}</option>
      </select>
      <button type="submit" disabled={loading}>{loading ? t('ledger.status.creating', 'Creating...') : t('ledger.actions.create', 'Create')}</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
};

export default LedgerAccountForm;
