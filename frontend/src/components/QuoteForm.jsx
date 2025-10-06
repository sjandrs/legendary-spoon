import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './QuoteForm.css';

function QuoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    account: '',
    contact: '',
    status: 'draft',
    valid_until: '',
    tax_rate: 0,
    discount: 0,
    notes: '',
  });

  const [lineItems, setLineItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAccounts();
    if (isEditMode) {
      fetchQuoteData();
    }
  }, [id]);

  useEffect(() => {
    if (formData.account) {
      fetchContacts(formData.account);
    } else {
      setContacts([]);
    }
  }, [formData.account]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/accounts/');
      setAccounts(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const fetchContacts = async (accountId) => {
    try {
      const response = await api.get('/api/contacts/', {
        params: { account: accountId },
      });
      setContacts(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  const fetchQuoteData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quotes/${id}/`);
      const quote = response.data;
      
      setFormData({
        name: quote.name || '',
        account: quote.account || '',
        contact: quote.contact || '',
        status: quote.status || 'draft',
        valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
        tax_rate: quote.tax_rate || 0,
        discount: quote.discount || 0,
        notes: quote.notes || '',
      });

      // Fetch line items
      const itemsResponse = await api.get(`/api/quotes/${id}/items/`);
      setLineItems(itemsResponse.data || []);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to load quote data.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeLineItem = (index) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(formData.tax_rate) || 0;
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const discount = parseFloat(formData.discount) || 0;
    return subtotal + tax - discount;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Quote name is required';
    }

    if (!formData.account) {
      newErrors.account = 'Account is required';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    const hasInvalidLineItems = lineItems.some(
      (item) => !item.product_name.trim() || parseFloat(item.unit_price) <= 0
    );

    if (hasInvalidLineItems) {
      newErrors.lineItems = 'All line items must have a product name and valid unit price';
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
      setError(null);

      const quoteData = {
        ...formData,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        discount: parseFloat(formData.discount) || 0,
        total_amount: calculateTotal(),
      };

      let quoteResponse;
      if (isEditMode) {
        quoteResponse = await api.put(`/api/quotes/${id}/`, quoteData);
      } else {
        quoteResponse = await api.post('/api/quotes/', quoteData);
      }

      const quoteId = quoteResponse.data.id;

      // Save line items
      for (const item of lineItems) {
        const lineItemData = {
          quote: quoteId,
          product_name: item.product_name,
          description: item.description || '',
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
        };

        if (item.id && !item.id.toString().startsWith('new-')) {
          // Update existing line item
          await api.put(`/api/quote-items/${item.id}/`, lineItemData);
        } else {
          // Create new line item
          await api.post('/api/quote-items/', lineItemData);
        }
      }

      navigate(`/quotes/${quoteId}`);
    } catch (err) {
      console.error('Error saving quote:', err);
      setError(err.response?.data?.detail || 'Failed to save quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (loading && isEditMode && !formData.name) {
    return (
      <div className="quote-form-container">
        <div className="loading">Loading quote data...</div>
      </div>
    );
  }

  return (
    <div className="quote-form-container">
      <div className="quote-form-header">
        <Link to={isEditMode ? `/quotes/${id}` : '/quotes'} className="btn-back">
          ← Back
        </Link>
        <h1>{isEditMode ? 'Edit Quote' : 'Create New Quote'}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="quote-form">
        <div className="form-section">
          <h2>Quote Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                Quote Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
                placeholder="e.g., Q2024-001 - Website Redesign"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="account">
                Account <span className="required">*</span>
              </label>
              <select
                id="account"
                name="account"
                value={formData.account}
                onChange={handleInputChange}
                className={errors.account ? 'error' : ''}
              >
                <option value="">Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {errors.account && <span className="error-text">{errors.account}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contact">Contact</label>
              <select
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                disabled={!formData.account}
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="valid_until">
                Valid Until <span className="required">*</span>
              </label>
              <input
                type="date"
                id="valid_until"
                name="valid_until"
                value={formData.valid_until}
                onChange={handleInputChange}
                className={errors.valid_until ? 'error' : ''}
              />
              {errors.valid_until && <span className="error-text">{errors.valid_until}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tax_rate">Tax Rate (%)</label>
              <input
                type="number"
                id="tax_rate"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="discount">Discount ($)</label>
              <input
                type="number"
                id="discount"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="4"
              placeholder="Additional notes or terms..."
            />
          </div>
        </div>

        <div className="form-section">
          <div className="line-items-header">
            <h2>Line Items</h2>
            <button type="button" onClick={addLineItem} className="btn-add-item">
              + Add Line Item
            </button>
          </div>

          {errors.lineItems && <div className="error-message">{errors.lineItems}</div>}

          {lineItems.length === 0 ? (
            <div className="empty-state">
              <p>No line items added yet. Click "Add Line Item" to get started.</p>
            </div>
          ) : (
            <div className="line-items-table-wrapper">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Product/Service *</th>
                    <th style={{ width: '30%' }}>Description</th>
                    <th style={{ width: '12%' }}>Quantity</th>
                    <th style={{ width: '15%' }}>Unit Price *</th>
                    <th style={{ width: '13%' }}>Total</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const itemTotal =
                      (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                    return (
                      <tr key={item.id || index}>
                        <td>
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) =>
                              updateLineItem(index, 'product_name', e.target.value)
                            }
                            placeholder="Product name"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(index, 'description', e.target.value)
                            }
                            placeholder="Description"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                          />
                        </td>
                        <td className="amount-cell">{formatCurrency(itemTotal)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="btn-remove"
                            title="Remove item"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="align-right">
                      <strong>Subtotal:</strong>
                    </td>
                    <td className="amount-cell">{formatCurrency(calculateSubtotal())}</td>
                    <td></td>
                  </tr>
                  {parseFloat(formData.tax_rate) > 0 && (
                    <tr>
                      <td colSpan="4" className="align-right">
                        <strong>Tax ({formData.tax_rate}%):</strong>
                      </td>
                      <td className="amount-cell">{formatCurrency(calculateTax())}</td>
                      <td></td>
                    </tr>
                  )}
                  {parseFloat(formData.discount) > 0 && (
                    <tr>
                      <td colSpan="4" className="align-right">
                        <strong>Discount:</strong>
                      </td>
                      <td className="amount-cell">-{formatCurrency(formData.discount)}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan="4" className="align-right">
                      <strong>Total:</strong>
                    </td>
                    <td className="amount-cell total-amount">{formatCurrency(calculateTotal())}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="form-actions">
          <Link
            to={isEditMode ? `/quotes/${id}` : '/quotes'}
            className="btn-cancel"
          >
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Saving...' : isEditMode ? 'Update Quote' : 'Create Quote'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuoteForm;
