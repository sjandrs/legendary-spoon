import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    category: 'office_supplies',
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    amount: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      const response = await api.get(`/api/budgets/${id}/`);
      const budget = response.data;
      setFormData({
        category: budget.category,
        period: budget.period,
        amount: budget.amount,
        notes: budget.notes || ''
      });
    } catch (_err) {
      setError('Failed to load budget');
      console.error('Error fetching budget:', _err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (isEditing) {
        await api.patch(`/api/budgets/${id}/`, submitData);
      } else {
        await api.post('/api/budgets/', submitData);
      }

      navigate('/budgets');
    } catch (_err) {
      setError('Failed to save budget');
      console.error('Error saving budget:', _err);
    } finally {
      setLoading(false);
    }
  };

  const budgetCategories = [
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'travel', label: 'Travel' },
    { value: 'meals', label: 'Meals & Entertainment' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'rent', label: 'Rent' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'software', label: 'Software & Subscriptions' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'salaries', label: 'Salaries & Benefits' },
    { value: 'other', label: 'Other' },
  ];

  const generatePeriodOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Generate options for current year and next 2 years
    for (let year = currentYear; year <= currentYear + 2; year++) {
      for (let month = 0; month < 12; month++) {
        // Only include current month and future months for current year
        if (year === currentYear && month < currentMonth) continue;

        const periodValue = `${year}-${String(month + 1).padStart(2, '0')}`;
        const periodLabel = new Date(year, month).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        });
        options.push({ value: periodValue, label: periodLabel });
      }
    }

    return options;
  };

  return (
    <div className="budget-form">
      <h2>{isEditing ? 'Edit Budget' : 'Create Budget'}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {budgetCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="period">Period *</label>
          <select
            id="period"
            name="period"
            value={formData.period}
            onChange={handleChange}
            required
          >
            {generatePeriodOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Budgeted Amount *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            maxLength="500"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : (isEditing ? 'Update Budget' : 'Create Budget')}
          </button>
          <button type="button" onClick={() => navigate('/budgets')} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
