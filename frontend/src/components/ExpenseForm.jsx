import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

const ExpenseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { t } = useTranslation('financial');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'office_supplies',
    description: '',
    vendor: '',
    receipt: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchExpense();
    }
  }, [id]);

  const fetchExpense = async () => {
    try {
      const response = await api.get(`/api/expenses/${id}/`);
      const expense = response.data;
      setFormData({
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        vendor: expense.vendor || '',
        receipt: null // File inputs can't be pre-populated
      });
    } catch (_err) {
      setError(t('expense.errors.load_failed', 'Failed to load expense'));
      console.error('Error fetching expense:', _err);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (isEditing) {
        await api.patch(`/api/expenses/${id}/`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/api/expenses/', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate('/expenses');
    } catch (_err) {
      setError(t('expense.errors.save_failed', 'Failed to save expense'));
      console.error('Error saving expense:', _err);
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = [
    { value: 'office_supplies', label: t('expense.categories.office_supplies', 'Office Supplies') },
    { value: 'travel', label: t('expense.categories.travel', 'Travel') },
    { value: 'meals', label: t('expense.categories.meals', 'Meals & Entertainment') },
    { value: 'utilities', label: t('expense.categories.utilities', 'Utilities') },
    { value: 'rent', label: t('expense.categories.rent', 'Rent') },
    { value: 'marketing', label: t('expense.categories.marketing', 'Marketing') },
    { value: 'software', label: t('expense.categories.software', 'Software & Subscriptions') },
    { value: 'equipment', label: t('expense.categories.equipment', 'Equipment') },
    { value: 'professional_services', label: t('expense.categories.professional_services', 'Professional Services') },
    { value: 'other', label: t('expense.categories.other', 'Other') },
  ];

  return (
    <div className="expense-form">
  <h2>{isEditing ? t('expense.title_edit', 'Edit Expense') : t('expense.title_add', 'Add Expense')}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="date">{t('expense.fields.date', 'Date')} *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">{t('expense.fields.category', 'Category')} *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            {expenseCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">{t('expense.fields.description', 'Description')} *</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            maxLength="255"
          />
        </div>

        <div className="form-group">
          <label htmlFor="vendor">{t('expense.fields.vendor', 'Vendor')}</label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            maxLength="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">{t('expense.fields.amount', 'Amount')} *</label>
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
          <label htmlFor="receipt">{t('expense.fields.receipt', 'Receipt')}</label>
          <input
            type="file"
            id="receipt"
            name="receipt"
            onChange={handleChange}
            accept="image/*,.pdf"
          />
          {isEditing && (
            <small>{t('expense.hints.receipt_existing', "If you don't select a new file, the existing receipt will be kept.")}</small>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? t('expense.status.saving', 'Saving...') : (isEditing ? t('expense.actions.update', 'Update Expense') : t('expense.actions.add', 'Add Expense'))}
          </button>
          <button type="button" onClick={() => navigate('/expenses')} className="btn btn-secondary">
            {t('expense.actions.cancel', 'Cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
