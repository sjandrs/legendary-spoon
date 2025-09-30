import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ExpenseList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/expenses/');
      setExpenses(response.data);
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId) => {
    try {
      await api.patch(`/api/expenses/${expenseId}/`, { approved: true });
      fetchExpenses(); // Refresh the list
    } catch (err) {
      console.error('Error approving expense:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) return <div>Loading expenses...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="expense-list">
      <h2>Expenses</h2>
      <div className="action-buttons">
        <Link to="/expenses/new" className="btn btn-primary">Add Expense</Link>
      </div>

      <table className="striped-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td>{expense.date}</td>
              <td>{expense.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
              <td>{expense.description}</td>
              <td>{expense.vendor || '-'}</td>
              <td className="text-right">{formatCurrency(expense.amount)}</td>
              <td>
                <span className={`status ${expense.approved ? 'approved' : 'pending'}`}>
                  {expense.approved ? 'Approved' : 'Pending'}
                </span>
              </td>
              <td>
                {!expense.approved && (
                  <button
                    onClick={() => handleApprove(expense.id)}
                    className="btn btn-sm btn-success"
                  >
                    Approve
                  </button>
                )}
                <Link to={`/expenses/${expense.id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseList;