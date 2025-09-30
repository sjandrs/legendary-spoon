import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const BudgetList = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/budgets/');
      setBudgets(response.data);
    } catch (err) {
      setError('Failed to load budgets');
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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

  if (loading) return <div>Loading budgets...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="budget-list">
      <h2>Budget Planning</h2>
      <div className="action-buttons">
        <Link to="/budgets/new" className="btn btn-primary">Create Budget</Link>
      </div>

      <table className="striped-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Period</th>
            <th>Budgeted Amount</th>
            <th>Spent Amount</th>
            <th>Variance</th>
            <th>% Used</th>
            <th>Actions</th>
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
                  <Link to={`/budgets/${budget.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {budgets.length === 0 && (
        <div className="no-data">
          <p>No budgets created yet. <Link to="/budgets/new">Create your first budget</Link> to start planning.</p>
        </div>
      )}
    </div>
  );
};

export default BudgetList;
