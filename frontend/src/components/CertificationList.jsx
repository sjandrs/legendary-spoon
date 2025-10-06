import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './CertificationList.css';

function CertificationList() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/certifications/');
      setCertifications(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load certifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      await api.delete(`/api/certifications/${id}/`);
      setCertifications(certifications.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete certification');
      console.error(err);
    }
  };

  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return 'none';
    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring-soon';
    return 'valid';
  };

  const filteredCertifications = certifications
    .filter(cert =>
      cert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(cert => {
      if (filterStatus === 'all') return true;
      return getExpirationStatus(cert.expiration_date) === filterStatus;
    });

  if (loading) {
    return (
      <div className="certification-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading certifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certification-list">
      <div className="list-header">
        <h1>🎓 Certifications</h1>
        <Link to="/certifications/new" className="create-button">
          + Add Certification
        </Link>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search certifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Statuses</option>
          <option value="valid">Valid</option>
          <option value="expiring-soon">Expiring Soon (30 days)</option>
          <option value="expired">Expired</option>
          <option value="none">No Expiration</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {filteredCertifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No Certifications Found</h3>
          <p>Track technician certifications and ensure compliance</p>
          <Link to="/certifications/new" className="create-button">
            Add Your First Certification
          </Link>
        </div>
      ) : (
        <div className="certifications-grid">
          {filteredCertifications.map((cert) => {
            const status = getExpirationStatus(cert.expiration_date);
            return (
              <div key={cert.id} className={`certification-card status-${status}`}>
                <div className="card-header">
                  <h3>{cert.name}</h3>
                  <div className="card-actions">
                    <Link to={`/certifications/${cert.id}/edit`} className="edit-btn">
                      ✏️
                    </Link>
                    <button onClick={() => handleDelete(cert.id)} className="delete-btn">
                      🗑️
                    </button>
                  </div>
                </div>

                {cert.description && (
                  <p className="description">{cert.description}</p>
                )}

                <div className="cert-details">
                  {cert.issuing_organization && (
                    <div className="detail-row">
                      <span className="label">Issuer:</span>
                      <span className="value">{cert.issuing_organization}</span>
                    </div>
                  )}
                  
                  {cert.expiration_date && (
                    <div className="detail-row">
                      <span className="label">Expires:</span>
                      <span className={`value expiration-${status}`}>
                        {new Date(cert.expiration_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {cert.renewal_required && (
                    <div className="detail-row">
                      <span className="badge renewal-badge">🔄 Renewal Required</span>
                    </div>
                  )}
                </div>

                {status !== 'none' && (
                  <div className={`status-banner banner-${status}`}>
                    {status === 'expired' && '⚠️ EXPIRED'}
                    {status === 'expiring-soon' && '⏰ EXPIRING SOON'}
                    {status === 'valid' && '✓ VALID'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CertificationList;
