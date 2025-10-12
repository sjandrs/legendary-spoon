import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get } from '../api';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';
import './DealDetail.css'; // We'll create this file next

const DealDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { formatCurrency: formatCurrencyLocale, formatDate } = useLocaleFormatting();

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/deals/${id}/`);
        setDeal(response.data); // Correctly access the data property
        setError(null);
      } catch (_err) {
        setError(t('errors:api.deals.fetch_failed', 'Failed to fetch deal details. The deal may not exist or you may not have permission to view it.'));
        console.error(_err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, [id, t]);

  if (loading) {
    return <div className="loading-spinner">{t('common:status.loading', 'Loading deal details...')}</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!deal) {
    return <div>{t('crm:deals.not_found', 'No deal found.')}</div>;
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return formatCurrencyLocale(value, 'USD');
  };

  return (
    <div className="deal-detail-container">
      <button onClick={() => navigate(-1)} className="back-button">
        &larr; {t('common:actions.back', 'Back')}
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
          <h3>{t('crm:deals.deal_information', 'Deal Information')}</h3>
          <p><strong>{t('crm:deals.owner', 'Owner')}:</strong> {deal.owner_username || t('common:common.not_available', 'N/A')}</p>
          <p><strong>{t('crm:deals.value', 'Value')}:</strong> {formatCurrency(deal.value)}</p>
          <p><strong>{t('crm:deals.stage', 'Stage')}:</strong> {deal.stage_name || t('common:common.not_available', 'N/A')}</p>
          <p><strong>{t('crm:deals.expected_close_date', 'Expected Close Date')}:</strong> {formatDate(deal.close_date)}</p>
        </div>

        <div className="deal-info-card">
          <h3>{t('crm:deals.associated_parties', 'Associated Parties')}</h3>
          <p><strong>{t('crm:accounts.title', 'Account')}:</strong> {deal.account_name || t('common:common.not_available', 'N/A')}</p>
          <p><strong>{t('crm:contacts.primary_contact', 'Primary Contact')}:</strong> {deal.primary_contact_name || t('common:common.not_available', 'N/A')}</p>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;
