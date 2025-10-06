import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './InteractionForm.css';

function InteractionForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    interaction_type: 'call',
    subject: '',
    notes: '',
    interaction_date: new Date().toISOString().slice(0, 16), // datetime-local format
    contact: '',
    account: '',
  });

  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAccounts();
  }, []);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.interaction_date) {
      newErrors.interaction_date = 'Date and time are required';
    }

    if (!formData.contact && !formData.account) {
      newErrors.contact = 'Either contact or account is required';
      newErrors.account = 'Either contact or account is required';
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

      const interactionData = {
        ...formData,
        interaction_date: new Date(formData.interaction_date).toISOString(),
      };

      await api.post('/api/interactions/', interactionData);
      navigate('/interactions');
    } catch (err) {
      console.error('Error creating interaction:', err);
      setError(err.response?.data?.detail || 'Failed to log interaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      call: '📞',
      email: '✉️',
      meeting: '👥',
      note: '📝',
    };
    return icons[type] || '💬';
  };

  return (
    <div className="interaction-form-container">
      <div className="interaction-form-header">
        <Link to="/interactions" className="btn-back">
          ← Back to Interactions
        </Link>
        <h1>Log Interaction</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="interaction-form">
        <div className="form-section">
          <h2>Interaction Details</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="interaction_type">
                Type <span className="required">*</span>
              </label>
              <div className="type-selector">
                <label className={`type-option ${formData.interaction_type === 'call' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="interaction_type"
                    value="call"
                    checked={formData.interaction_type === 'call'}
                    onChange={handleInputChange}
                  />
                  <span className="type-icon">{getTypeIcon('call')}</span>
                  <span className="type-label">Call</span>
                </label>
                <label className={`type-option ${formData.interaction_type === 'email' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="interaction_type"
                    value="email"
                    checked={formData.interaction_type === 'email'}
                    onChange={handleInputChange}
                  />
                  <span className="type-icon">{getTypeIcon('email')}</span>
                  <span className="type-label">Email</span>
                </label>
                <label className={`type-option ${formData.interaction_type === 'meeting' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="interaction_type"
                    value="meeting"
                    checked={formData.interaction_type === 'meeting'}
                    onChange={handleInputChange}
                  />
                  <span className="type-icon">{getTypeIcon('meeting')}</span>
                  <span className="type-label">Meeting</span>
                </label>
                <label className={`type-option ${formData.interaction_type === 'note' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="interaction_type"
                    value="note"
                    checked={formData.interaction_type === 'note'}
                    onChange={handleInputChange}
                  />
                  <span className="type-icon">{getTypeIcon('note')}</span>
                  <span className="type-label">Note</span>
                </label>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={errors.subject ? 'error' : ''}
                placeholder="e.g., Follow-up call regarding proposal"
              />
              {errors.subject && <span className="error-text">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="interaction_date">
                Date & Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="interaction_date"
                name="interaction_date"
                value={formData.interaction_date}
                onChange={handleInputChange}
                className={errors.interaction_date ? 'error' : ''}
              />
              {errors.interaction_date && <span className="error-text">{errors.interaction_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="account">Account</label>
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
                className={errors.contact ? 'error' : ''}
              >
                <option value="">Select a contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </option>
                ))}
              </select>
              {errors.contact && <span className="error-text">{errors.contact}</span>}
              {!formData.account && (
                <span className="help-text">Select an account first to see contacts</span>
              )}
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="6"
                placeholder="Enter detailed notes about this interaction..."
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/interactions" className="btn-cancel">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Logging...' : 'Log Interaction'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default InteractionForm;
