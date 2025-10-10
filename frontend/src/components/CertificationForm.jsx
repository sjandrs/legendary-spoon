import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './CertificationForm.css';

function CertificationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    issuing_organization: '',
    expiration_date: '',
    renewal_required: false,
  });

  useEffect(() => {
    if (id) {
      fetchCertification();
    }
  }, [id]);

  const fetchCertification = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/certifications/${id}/`);
      const cert = response.data;
      setFormData({
        name: cert.name || '',
        description: cert.description || '',
        issuing_organization: cert.issuing_organization || '',
        expiration_date: cert.expiration_date || '',
        renewal_required: cert.renewal_required || false,
      });
    } catch (_err) {
      setError('Failed to load certification');
      console.error(_err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (id) {
        await api.put(`/api/certifications/${id}/`, formData);
      } else {
        await api.post('/api/certifications/', formData);
      }
      navigate('/certifications');
    } catch (_err) {
      setError(_err.response?.data?.detail || 'Failed to save certification');
      console.error(_err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="certification-form">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading certification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certification-form">
      <div className="form-header">
        <h1>{id ? '✏️ Edit Certification' : '➕ Add Certification'}</h1>
        <button onClick={() => navigate('/certifications')} className="back-button">
          ← Back to Certifications
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="cert-form">
        <div className="form-section">
          <h2>Certification Details</h2>

          <div className="form-group">
            <label htmlFor="name">Certification Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., HVAC Technician Level 2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the certification requirements and scope..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="issuing_organization">Issuing Organization</label>
            <input
              type="text"
              id="issuing_organization"
              name="issuing_organization"
              value={formData.issuing_organization}
              onChange={handleChange}
              placeholder="e.g., NATE, EPA, OSHA"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiration_date">Expiration Date</label>
              <input
                type="date"
                id="expiration_date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleChange}
              />
              <small className="help-text">Leave blank if certification doesn't expire</small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="renewal_required"
                  checked={formData.renewal_required}
                  onChange={handleChange}
                />
                <span>Renewal Required</span>
              </label>
              <small className="help-text">Check if this certification requires periodic renewal</small>
            </div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>Certification Tracking</h4>
            <p>This certification will be available for assignment to technicians. You'll receive alerts when certifications are expiring.</p>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/certifications')} className="cancel-button">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="save-button">
            {saving ? 'Saving...' : (id ? 'Update Certification' : 'Add Certification')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CertificationForm;
