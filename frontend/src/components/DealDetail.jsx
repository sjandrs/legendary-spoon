import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../api';
import './DealDetail.css'; // We'll create this file next

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/deals/${id}/`);
        setDeal(response.data); // Correctly access the data property
        setError(null);
      } catch (_err) {
        setError('Failed to fetch deal details. The deal may not exist or you may not have permission to view it.');
        console.error(_err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id]);

  if (loading) {
    return <div className="loading-spinner">Loading deal details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!deal) {
    return <div>No deal found.</div>;
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="deal-detail-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; Back
      </button>
      <div className="deal-header">
        <h1>{deal.title}</h1>
        <span className={`status-badge status-${deal.status}`}>
          {/* Add a check to ensure deal.status is a string */}
          {deal.status && typeof deal.status === 'string' ? deal.status.replace('_', ' ') : deal.status}
        </span>
      </div>

      <div className="deal-body">
        <div className="deal-info-card">
          <h3>Deal Information</h3>
          <p><strong>Owner:</strong> {deal.owner_username || 'N/A'}</p>
          <p><strong>Value:</strong> {formatCurrency(deal.value)}</p>
          <p><strong>Stage:</strong> {deal.stage_name || 'N/A'}</p>
          <p><strong>Expected Close Date:</strong> {new Date(deal.close_date).toLocaleDateString()}</p>
        </div>

        <div className="deal-info-card">
          <h3>Associated Parties</h3>
          <p><strong>Account:</strong> {deal.account_name || 'N/A'}</p>
          <p><strong>Primary Contact:</strong> {deal.primary_contact_name || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;