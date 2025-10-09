import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { get, post, put } from '../api';
import './AccountList.css';

/**
 * AccountForm - Create or edit account records
 * Handles validation and submission for account CRUD operations
 */
const AccountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    billing_address: '',
    shipping_address: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      loadAccount();
    }
  }, [id]);

  const loadAccount = async () => {
    try {
      const response = await get(`/api/accounts/${id}/`);
      setFormData(response.data);
    } catch (err) {
      setSubmitError('Failed to load account details.');
      console.error('Error loading account:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Account name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSubmitError(null);

      if (isEditMode) {
        await put(`/api/accounts/${id}/`, formData);
      } else {
        await post('/api/accounts/', formData);
      }

      navigate('/accounts');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to save account. Please try again.');
      console.error('Error saving account:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Account' : 'New Account'}</h1>
      </div>

      {submitError && (
        <div className="error-message" role="alert">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="account-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">
              Account Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              required
              data-testid="account-name-input"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
                className={errors.website ? 'error' : ''}
              />
              {errors.website && <span className="field-error">{errors.website}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Address Information</h2>

          <div className="form-group">
            <label htmlFor="billing_address">Billing Address</label>
            <textarea
              id="billing_address"
              name="billing_address"
              value={formData.billing_address}
              onChange={handleChange}
              rows="3"
              placeholder="Street, City, State, ZIP"
            />
          </div>

          <div className="form-group">
            <label htmlFor="shipping_address">Shipping Address</label>
            <textarea
              id="shipping_address"
              name="shipping_address"
              value={formData.shipping_address}
              onChange={handleChange}
              rows="3"
              placeholder="Street, City, State, ZIP"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Notes about this account..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/accounts')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            data-testid="account-submit-button"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountForm;
