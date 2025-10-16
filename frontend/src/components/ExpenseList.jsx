import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';
import { getHeaderIds } from '../utils/a11yTable';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatCurrency: formatCurrencyLocale } = useLocaleFormatting();
  const { t } = useTranslation('financial');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/expenses/');
      setExpenses(response.data || []);
    } catch (_err) {
      setError(t('expense_list.errors.load_failed', 'Failed to load expenses'));
      console.error('Error fetching expenses:', _err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      await api.patch(`/api/expenses/${expenseId}/`, { approved: true });
      fetchExpenses(); // Refresh the list
    } catch (_err) {
      console.error('Error approving expense:', _err);
    }
  };

  const formatCurrency = (amount) => {
    return formatCurrencyLocale(amount, 'USD');
  };

  if (loading) return <div>{t('expense_list.status.loading', 'Loading expenses...')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  const headerIds = getHeaderIds('expenses', ['date','category','description','vendor','amount','status','actions']);

  return (
    <div className="expense-list">
      <h2>{t('expense_list.title', 'Expenses')}</h2>
      <div className="action-buttons">
        <Link to="/expenses/new" className="btn btn-primary">{t('expense_list.actions.add', 'Add Expense')}</Link>
      </div>

      <table className="striped-table" role="table" aria-label={t('expense_list.a11y.table_label', 'Expenses')}>
        <caption className="sr-only">{t('expense_list.a11y.table_caption', 'Expenses list including date, category, description, vendor, amount, status, and actions')}</caption>
        <thead>
          <tr>
            <th scope="col" id={headerIds.date}>{t('expense_list.table.date', 'Date')}</th>
            <th scope="col" id={headerIds.category}>{t('expense_list.table.category', 'Category')}</th>
            <th scope="col" id={headerIds.description}>{t('expense_list.table.description', 'Description')}</th>
            <th scope="col" id={headerIds.vendor}>{t('expense_list.table.vendor', 'Vendor')}</th>
            <th scope="col" id={headerIds.amount}>{t('expense_list.table.amount', 'Amount')}</th>
            <th scope="col" id={headerIds.status}>{t('expense_list.table.status', 'Status')}</th>
            <th scope="col" id={headerIds.actions}>{t('expense_list.table.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {expenses && expenses.map(expense => (
            <tr key={expense.id}>
              <th scope="row" headers={headerIds.date}>{expense.date}</th>
              <td headers={headerIds.category}>{expense.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              <td headers={headerIds.description}>{expense.description}</td>
              <td headers={headerIds.vendor}>{expense.vendor || '-'}</td>
              <td headers={headerIds.amount} className="text-right">{formatCurrency(expense.amount)}</td>
              <td headers={headerIds.status}>
                <span className={`status ${expense.status || (expense.approved ? 'approved' : 'pending')}`}>
                  {expense.status ? expense.status : (expense.approved ? t('expense_list.status.approved', 'Approved') : t('expense_list.status.pending', 'Pending'))}
                </span>
              </td>
              <td headers={headerIds.actions}>
                {(!expense.approved && expense.status !== 'rejected') && (
                  <button
                    onClick={() => handleApprove(expense.id)}
                    className="btn btn-sm btn-success"
                  >
                    {t('expense_list.actions.approve', 'Approve')}
                  </button>
                )}
                <Link to={`/expenses/${expense.id}/edit`} className="btn btn-sm btn-secondary">{t('expense_list.actions.edit', 'Edit')}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseList;
