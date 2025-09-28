import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { get } from '../api';
import './Deals.css';

const Deals = () => {
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

            } catch (err) {
                console.error("Failed to fetch deals:", err);
                setError("Could not load deals. Please try again later.");
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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

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
        return <div className="deals-container loading">Loading deals...</div>;
    }

    if (error) {
        return <div className="deals-container error">{error}</div>;
    }

    return (
        <div className="deals-container">
            <div className="deals-header">
                <h1>Deals</h1>
                {stageId && stageName && (
                    <div className="filter-info">
                        <span>Filtered by Stage: <span className="stage-name">{stageName}</span></span>
                        <button onClick={clearFilter} className="clear-filter-btn">Clear Filter</button>
                    </div>
                )}
            </div>

            {deals.length === 0 ? (
                <p>No deals found.</p>
            ) : (
                <table className="deals-table striped-table">
                    <thead>
                        <tr>
                            <th>Deal Name</th>
                            <th>Account</th>
                            <th>Stage</th>
                            <th>Value</th>
                            <th>Close Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deals.map(deal => (
                            <tr key={deal.id} onClick={() => handleRowClick(deal.id)} className="deal-row">
                                <td>{deal.name}</td>
                                <td>{deal.account_name || 'N/A'}</td>
                                <td>
                                    <span 
                                        className="deal-stage" 
                                        style={{ backgroundColor: getStageColor(deal.stage_name) }}
                                    >
                                        {deal.stage_name}
                                    </span>
                                </td>
                                <td className="deal-value">{formatCurrency(deal.value)}</td>
                                <td>{new Date(deal.expected_close_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Deals;
