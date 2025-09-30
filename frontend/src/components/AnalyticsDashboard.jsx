import React, { useState, useEffect } from 'react';
import { getAdvancedAnalyticsDashboard, predictDealOutcome, calculateCustomerLifetimeValue, generateRevenueForecast } from '../api';
import './AnalyticsDashboard.css';

const PredictionControls = ({ selectedDeal, setSelectedDeal, handlePredictDeal, dealPredictionFeedback }) => (
    <div className="prediction-controls">
        <input
            type="text"
            placeholder="Enter Deal ID"
            value={selectedDeal}
            onChange={(e) => setSelectedDeal(e.target.value)}
        />
        <button onClick={handlePredictDeal} className="predict-button">
            Predict Outcome
        </button>
        {dealPredictionFeedback && (
            <div className="prediction-feedback">{dealPredictionFeedback}</div>
        )}
    </div>
);

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDeal, setSelectedDeal] = useState('');
    const [selectedContact, setSelectedContact] = useState('');
    const [forecastPeriod, setForecastPeriod] = useState('monthly');
    const [forecastPeriods, setForecastPeriods] = useState(6);
    const [dealPredictionFeedback, setDealPredictionFeedback] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await getAdvancedAnalyticsDashboard();
            setAnalytics(response.data);
        } catch (err) {
            setError('Failed to fetch advanced analytics.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePredictDeal = async () => {
        if (!selectedDeal) return;
        try {
            const response = await predictDealOutcome(selectedDeal);
            // Refresh analytics to show updated predictions
            fetchAnalytics();
            setDealPredictionFeedback(
                `Prediction: ${response.data.predicted_outcome} (${(response.data.confidence_score * 100).toFixed(1)}% confidence)`
            );
        } catch (err) {
            console.error('Failed to predict deal outcome:', err);
            setDealPredictionFeedback('Failed to predict deal outcome.');
        }
    };

    const handleCalculateCLV = async () => {
        if (!selectedContact) return;
        try {
            const response = await calculateCustomerLifetimeValue(selectedContact);
            // Optionally update analytics state with new CLV
            setAnalytics(prev => ({
                ...prev,
                insights: {
                    ...prev.insights,
                    customer_lifetime_value: [
                        ...(prev.insights.customer_lifetime_value || []),
                        response.data
                    ]
                }
            }));
            alert(`CLV: $${response.data.predicted_clv.toLocaleString()} (${(response.data.confidence * 100).toFixed(1)}% confidence)`);
        } catch (err) {
            console.error('Failed to calculate CLV:', err);
        }
    };

    const handleGenerateForecast = async () => {
        try {
            const response = await generateRevenueForecast({
                period: forecastPeriod,
                periods_ahead: forecastPeriods
            });
            // Optionally update analytics state with new forecast data
            setAnalytics(prev => ({
                ...prev,
                predictions: {
                    ...prev.predictions,
                    forecast_data: response.data.forecast_data || prev.predictions.forecast_data,
                    revenue_forecast_next_week: response.data.revenue_forecast_next_week || prev.predictions.revenue_forecast_next_week
                }
            }));
            alert(`Generated ${response.data.message}`);
        } catch (err) {
            console.error('Failed to generate forecast:', err);
        }
    };

    if (loading) {
        return <div className="analytics-loading">Loading advanced analytics...</div>;
    }

    if (error) {
        return <div className="analytics-error">{error}</div>;
    }

    if (!analytics) {
        return <div className="analytics-no-data">No analytics data available.</div>;
    }

    return (
        <div className="analytics-dashboard">
            <div className="analytics-header">
                <h1>Advanced Analytics Dashboard</h1>
                <p>AI-powered insights and predictive analytics</p>
            </div>

            {/* Current Metrics */}
            <div className="analytics-section">
                <h2>Current Business Metrics</h2>
                <div className="metrics-grid">
                    <div className="metric-card">
                        <h3>Total Revenue</h3>
                        <div className="metric-value">${analytics.current_metrics.total_revenue.toLocaleString()}</div>
                        <div className="metric-label">Current period</div>
                    </div>
                    <div className="metric-card">
                        <h3>Total Deals</h3>
                        <div className="metric-value">{analytics.current_metrics.total_deals}</div>
                        <div className="metric-label">Active deals</div>
                    </div>
                    <div className="metric-card">
                        <h3>Won Deals</h3>
                        <div className="metric-value">{analytics.current_metrics.won_deals}</div>
                        <div className="metric-label">{analytics.current_metrics.conversion_rate}% conversion</div>
                    </div>
                    <div className="metric-card">
                        <h3>Active Projects</h3>
                        <div className="metric-value">{analytics.current_metrics.active_projects}</div>
                        <div className="metric-label">In progress</div>
                    </div>
                    <div className="metric-card">
                        <h3>Inventory Value</h3>
                        <div className="metric-value">${analytics.current_metrics.inventory_value.toLocaleString()}</div>
                        <div className="metric-label">Total stock value</div>
                    </div>
                    <div className="metric-card">
                        <h3>Outstanding Invoices</h3>
                        <div className="metric-value">${analytics.current_metrics.outstanding_invoices.toLocaleString()}</div>
                        <div className="metric-label">Awaiting payment</div>
                    </div>
                </div>
            </div>

            {/* Deal Predictions */}
            <div className="analytics-section">
                <h2>Deal Outcome Predictions</h2>
                <PredictionControls
                    selectedDeal={selectedDeal}
                    setSelectedDeal={setSelectedDeal}
                    handlePredictDeal={handlePredictDeal}
                    dealPredictionFeedback={dealPredictionFeedback}
                />
                {analytics.predictions.deal_predictions && analytics.predictions.deal_predictions.length > 0 && (
                    <div className="predictions-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Deal</th>
                                    <th>Predicted Outcome</th>
                                    <th>Confidence</th>
                                    <th>Est. Close Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.predictions.deal_predictions.map((prediction, index) => (
                                    <tr key={index}>
                                        <td>{prediction.deal_title}</td>
                                        <td className={`prediction-${prediction.predicted_outcome}`}>
                                            {prediction.predicted_outcome}
                                        </td>
                                        <td>{(prediction.confidence * 100).toFixed(1)}%</td>
                                        <td>{prediction.estimated_close_days}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Customer Lifetime Value */}
            <div className="analytics-section">
                <h2>Customer Lifetime Value Analysis</h2>
                <div className="clv-controls">
                    <input
                        type="text"
                        placeholder="Enter Contact ID"
                        value={selectedContact}
                        onChange={(e) => setSelectedContact(e.target.value)}
                    />
                    <button onClick={handleCalculateCLV} className="calculate-button">
                        Calculate CLV
                    </button>
                </div>
                {analytics.insights.customer_lifetime_value && analytics.insights.customer_lifetime_value.length > 0 && (
                    <div className="clv-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Predicted CLV</th>
                                    <th>Segments</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.insights.customer_lifetime_value.map((customer, index) => (
                                    <tr key={index}>
                                        <td>{customer.contact_name}</td>
                                        <td>${customer.predicted_clv.toLocaleString()}</td>
                                        <td>{customer.segments.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Revenue Forecasting */}
            <div className="analytics-section">
                <h2>Revenue Forecasting</h2>
                <div className="forecast-controls">
                    <select value={forecastPeriod} onChange={(e) => setForecastPeriod(e.target.value)}>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                    </select>
                    <input
                        type="number"
                        min="1"
                        max="24"
                        value={forecastPeriods}
                        onChange={(e) => setForecastPeriods(parseInt(e.target.value))}
                        placeholder="Periods ahead"
                    />
                    <button onClick={handleGenerateForecast} className="forecast-button">
                        Generate Forecast
                    </button>
                </div>
                <div className="forecast-summary">
                    <div className="forecast-metric">
                        <span className="forecast-label">Next Week Forecast:</span>
                        <span className="forecast-value">${analytics.predictions.revenue_forecast_next_week.toLocaleString()}</span>
                    </div>
                </div>
                {analytics.predictions.forecast_data && analytics.predictions.forecast_data.length > 0 && (
                    <div className="forecast-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Period</th>
                                    <th>Predicted Revenue</th>
                                    <th>Confidence Range</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.predictions.forecast_data.map((forecast, index) => (
                                    <tr key={index}>
                                        <td>{new Date(forecast.date).toLocaleDateString()}</td>
                                        <td>{forecast.period}</td>
                                        <td>${forecast.predicted_revenue.toLocaleString()}</td>
                                        <td>${forecast.confidence_lower.toLocaleString()} - ${forecast.confidence_upper.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Revenue Trend Chart */}
            <div className="analytics-section">
                <h2>Revenue Trend (Last 2 Weeks)</h2>
                {analytics.insights.revenue_trend && analytics.insights.revenue_trend.length > 0 && (
                    <div className="trend-chart">
                        <div className="trend-data">
                            {analytics.insights.revenue_trend.map((point, index) => (
                                <div key={index} className="trend-point">
                                    <span className="trend-date">{new Date(point.date).toLocaleDateString()}</span>
                                    <span className="trend-value">${point.revenue.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Top Performing Segments */}
            <div className="analytics-section">
                <h2>Top Performing Customer Segments</h2>
                {analytics.insights.top_performing_segments && analytics.insights.top_performing_segments.length > 0 && (
                    <div className="segments-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Segment</th>
                                    <th>Customer Count</th>
                                    <th>Avg CLV</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.insights.top_performing_segments.map((segment, index) => (
                                    <tr key={index}>
                                        <td>{segment.segment}</td>
                                        <td>{segment.count}</td>
                                        <td>${segment.avg_clv.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;