import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { get } from '../api';
import './Deals.css';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';

const Deals = () => {
    const { t } = useTranslation();
    const { formatCurrency, formatDate } = useLocaleFormatting();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stageName, setStageName] = useState('');

    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const stageId = queryParams.get('stage');

    useEffect(() => {
        const fetchDeals = async () => {
            setLoading(true);
            setError(null);
            let url = '/api/deals/';
            if (stageId) {
                url += `?stage=${stageId}`;
            }

            try {
                const response = await get(url);
                const dealData = response.data.results || response.data;
                setDeals(dealData);

                // If filtering, fetch the stage name for display
                if (stageId && dealData.length > 0) {
                    // All deals in the response should have the same stage, so we can take it from the first one.
                    setStageName(dealData[0].stage_name);
                } else {
                    setStageName('');
                }

            } catch (_err) {
                console.error("Failed to fetch deals:", _err);
                setError(t('crm:deals.errors.load_failed', 'Could not load deals. Please try again later.'));
            } finally {
                setLoading(false);
            }
        };

        fetchDeals();
    }, [stageId]);

    const handleRowClick = (dealId) => {
        navigate(`/deals/${dealId}`);
    };

    const clearFilter = () => {
        navigate('/deals');
    };

    // Currency and date formatting via locale-aware hook

    const getStageColor = (stage) => {
        // Simple hash function to get a color based on the stage name
        let hash = 0;
        for (let i = 0; i < stage.length; i++) {
            hash = stage.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 70%, 50%)`;
        return color;
    };

    if (loading) {
        return <div className="deals-container loading">{t('crm:deals.status.loading', 'Loading deals...')}</div>;
    }

    if (error) {
        return <div className="deals-container error">{error}</div>;
    }

    return (
        <div className="deals-container">
            <div className="deals-header">
                <h1>{t('crm:deals.title', 'Deals')}</h1>
                {stageId && stageName && (
                    <div className="filter-info">
                        <span>{t('crm:deals.filtered_by_stage', 'Filtered by Stage:')} <span className="stage-name">{stageName}</span></span>
                        <button onClick={clearFilter} className="clear-filter-btn">{t('crm:deals.clear_filter', 'Clear Filter')}</button>
                    </div>
                )}
            </div>

            {deals.length === 0 ? (
                <p>{t('crm:deals.no_results', 'No deals found.')}</p>
            ) : (
                <table className="deals-table striped-table" role="table" aria-label={t('crm:deals.a11y.table_label', 'Deals')}>
                    <caption className="sr-only">{t('crm:deals.a11y.table_caption', 'Deals list including account, stage, value, and expected close date')}</caption>
                    <thead>
                        <tr>
                            <th scope="col" id="deals-name">{t('crm:deals.table.name', 'Deal Name')}</th>
                            <th scope="col" id="deals-account">{t('crm:deals.table.account', 'Account')}</th>
                            <th scope="col" id="deals-stage">{t('crm:deals.table.stage', 'Stage')}</th>
                            <th scope="col" id="deals-value">{t('crm:deals.table.value', 'Value')}</th>
                            <th scope="col" id="deals-close">{t('crm:deals.table.close_date', 'Close Date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deals.map(deal => (
                            <tr key={deal.id} onClick={() => handleRowClick(deal.id)} className="deal-row">
                                <th scope="row" headers="deals-name">{deal.name}</th>
                                <td headers="deals-account">{deal.account_name || t('common:not_available', 'N/A')}</td>
                                <td headers="deals-stage">
                                    <span
                                        className="deal-stage"
                                        style={{ backgroundColor: getStageColor(deal.stage_name) }}
                                    >
                                        {deal.stage_name}
                                    </span>
                                </td>
                                <td headers="deals-value" className="deal-value">{formatCurrency(deal.value)}</td>
                                <td headers="deals-close">{formatDate(deal.expected_close_date)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Deals;
