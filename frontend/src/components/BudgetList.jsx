import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';

const BudgetList = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatCurrency } = useLocaleFormatting();
  const { t } = useTranslation('financial');

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/budgets/');
      setBudgets(response.data);
    } catch (_err) {
      setError(t('budget.errors.load_failed', 'Failed to load budgets'));
      console.error('Error fetching budgets:', _err);
    } finally {
      setLoading(false);
    }
  };

  // formatCurrency now comes from useLocaleFormatting hook

  const calculateVariance = (budget) => {
    const spent = budget.spent_amount || 0;
    const budgeted = budget.amount;
    const variance = budgeted - spent;
    const percentUsed = budgeted > 0 ? (spent / budgeted) * 100 : 0;

    return {
      variance,
      percentUsed: percentUsed.toFixed(1),
      isOverBudget: variance < 0
    };
  };

  if (loading) return <div>{t('budget.status.loading', 'Loading budgets...')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="budget-list">
      <h2>{t('budget.title', 'Budget Planning')}</h2>
      <div className="action-buttons">
        <Link to="/budgets/new" className="btn btn-primary">{t('budget.actions.create', 'Create Budget')}</Link>
      </div>

      <table className="striped-table" role="table" aria-label={t('budget.a11y.table_label', 'Budgets')}>
        <caption className="sr-only">{t('budget.a11y.table_caption', 'Budgets including category, period, budgeted, spent, variance, percent used, and actions')}</caption>
        <thead>
          <tr>
            <th>{t('budget.table.category', 'Category')}</th>
            <th>{t('budget.table.period', 'Period')}</th>
            <th>{t('budget.table.budgeted_amount', 'Budgeted Amount')}</th>
            <th>{t('budget.table.spent_amount', 'Spent Amount')}</th>
            <th>{t('budget.table.variance', 'Variance')}</th>
            <th>{t('budget.table.percent_used', '% Used')}</th>
            <th>{t('budget.table.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map(budget => {
            const { variance, percentUsed, isOverBudget } = calculateVariance(budget);
            return (
              <tr key={budget.id}>
                <td>{budget.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td>{budget.period}</td>
                <td className="text-right">{formatCurrency(budget.amount)}</td>
                <td className="text-right">{formatCurrency(budget.spent_amount || 0)}</td>
                <td className={`text-right ${isOverBudget ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(variance)}
                </td>
                <td className={`text-right ${parseFloat(percentUsed) > 90 ? 'text-warning' : ''}`}>
                  {percentUsed}%
                </td>
                <td>
                  <Link to={`/budgets/${budget.id}/edit`} className="btn btn-sm btn-secondary">{t('budget.actions.edit', 'Edit')}</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {budgets.length === 0 && (
        <div className="no-data">
          <p>
            {t('budget.empty', 'No budgets created yet.')} <Link to="/budgets/new">{t('budget.empty_cta', 'Create your first budget')}</Link> {t('budget.empty_suffix', 'to start planning.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default BudgetList;
