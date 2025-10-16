import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// import apiClient from '../api'; // Ready for enhanced dashboard API calls // Import the configured axios instance
import DealsByStageChart from './charts/DealsByStageChart';
import SalesPerformanceChart from './charts/SalesPerformanceChart';
import './DashboardPage.css';

const DashboardPage = () => {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await getDashboardAnalytics();
                setAnalytics(response.data);
            } catch (_err) {
                setError(t('dashboard:errors.fetch_failed', 'Failed to fetch dashboard analytics.'));
                console.error(_err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div data-testid="loading">{t('dashboard:status.loading', 'Loading dashboard...')}</div>;
    }

    if (error) {
        return <div data-testid="error-message">{error}</div>;
    }

    if (!analytics) {
        return <div data-testid="no-data">{t('dashboard:status.no_data', 'No analytics data available.')}</div>;
    }

    return (
        <div className="dashboard-page" data-testid="dashboard-page">
            <div className="dashboard-header">
                <h1>{t('dashboard:titles.business_dashboard', 'Business Dashboard')}</h1>
                <div className="date-range">
                    {analytics.period && (
                        <span>
                            {new Date(analytics.period.start_date).toLocaleDateString()} - {new Date(analytics.period.end_date).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>{t('dashboard:metrics.sales_performance', 'Sales Performance')}</h3>
                    <div className="metric-value">{analytics.sales?.win_rate || 0}%</div>
                    <div className="metric-label">{t('dashboard:labels.win_rate', 'Win Rate')}</div>
                    <div className="metric-subtext">
                        {analytics.sales?.won_deals || 0} {t('dashboard:text.won_of', 'won of')} {analytics.sales?.total_deals || 0} {t('dashboard:text.deals', 'deals')}
                    </div>
                </div>

                <div className="metric-card">
                    <h3>{t('dashboard:metrics.total_revenue', 'Total Revenue')}</h3>
                    <div className="metric-value">${(analytics.financial?.total_revenue || 0).toLocaleString()}</div>
                    <div className="metric-label">{t('dashboard:labels.last_30_days', 'Last 30 Days')}</div>
                    <div className="metric-subtext">
                        {t('dashboard:labels.margin', 'Margin:')} {analytics.financial?.profit_margin || 0}%
                    </div>
                </div>

                <div className="metric-card">
                    <h3>{t('dashboard:metrics.project_completion', 'Project Completion')}</h3>
                    <div className="metric-value">{analytics.projects?.completion_rate || 0}%</div>
                    <div className="metric-label">{t('dashboard:labels.completion_rate', 'Completion Rate')}</div>
                    <div className="metric-subtext">
                        {analytics.projects?.overdue_projects || 0} {t('dashboard:text.overdue', 'overdue')}
                    </div>
                </div>

                <div className="metric-card">
                    <h3>{t('dashboard:metrics.time_tracking', 'Time Tracking')}</h3>
                    <div className="metric-value">{analytics.time_tracking?.total_hours || 0}h</div>
                    <div className="metric-label">{t('dashboard:labels.total_hours', 'Total Hours')}</div>
                    <div className="metric-subtext">
                        {analytics.time_tracking?.billable_percentage || 0}% {t('dashboard:text.billable', 'billable')}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="dashboard-widget">
                    <h2>{t('dashboard:sections.deal_pipeline', 'Deal Pipeline')}</h2>
                    <div className="deal-pipeline">
                        {analytics.sales && (
                            <div className="pipeline-stats">
                                <div className="pipeline-item">
                                    <span className="pipeline-label">{t('dashboard:labels.total_deals', 'Total Deals:')}</span>
                                    <span className="pipeline-value">{analytics.sales.total_deals}</span>
                                </div>
                                <div className="pipeline-item">
                                    <span className="pipeline-label">{t('dashboard:labels.won_deals', 'Won Deals:')}</span>
                                    <span className="pipeline-value won">{analytics.sales.won_deals}</span>
                                </div>
                                <div className="pipeline-item">
                                    <span className="pipeline-label">{t('dashboard:labels.total_value', 'Total Value:')}</span>
                                    <span className="pipeline-value">${analytics.sales.total_value.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-widget">
                    <h2>{t('dashboard:sections.project_overview', 'Project Overview')}</h2>
                    <div className="project-overview">
                        {analytics.projects && (
                            <div className="overview-stats">
                                <div className="overview-item">
                                    <span className="overview-label">{t('dashboard:labels.active_projects', 'Active Projects:')}</span>
                                    <span className="overview-value">{analytics.projects.total_projects - analytics.projects.completed_projects}</span>
                                </div>
                                <div className="overview-item">
                                    <span className="overview-label">{t('dashboard:labels.completed', 'Completed:')}</span>
                                    <span className="overview-value completed">{analytics.projects.completed_projects}</span>
                                </div>
                                <div className="overview-item">
                                    <span className="overview-label">{t('dashboard:labels.overdue', 'Overdue:')}</span>
                                    <span className="overview-value overdue">{analytics.projects.overdue_projects}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Lifetime Value */}
            {analytics.customer_lifetime_value && analytics.customer_lifetime_value.length > 0 && (
                <div className="dashboard-widget">
                    <h2>{t('dashboard:sections.top_customers', 'Top Customers by Lifetime Value')}</h2>
                    <div className="clv-table">
                        <table role="table" aria-label={t('dashboard:a11y.top_customers_table', 'Top Customers by Lifetime Value')}>
                            <caption className="sr-only">{t('dashboard:a11y.top_customers_caption', 'Top customers and their lifetime value metrics')}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" id="clv-customer">{t('dashboard:table.customer', 'Customer')}</th>
                                    <th scope="col" id="clv-total">{t('dashboard:table.total_value', 'Total Value')}</th>
                                    <th scope="col" id="clv-count">{t('dashboard:table.deal_count', 'Deal Count')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.customer_lifetime_value.map((customer, index) => (
                                    <tr key={index}>
                                        <td headers="clv-customer">{customer.account}</td>
                                        <td headers="clv-total">${customer.total_value.toLocaleString()}</td>
                                        <td headers="clv-count">{customer.deal_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Project Profitability */}
            {analytics.project_profitability && analytics.project_profitability.length > 0 && (
                <div className="dashboard-widget">
                    <h2>{t('dashboard:sections.project_profitability', 'Project Profitability')}</h2>
                    <div className="profitability-table">
                        <table role="table" aria-label={t('dashboard:a11y.project_profitability_table', 'Project Profitability')}>
                            <caption className="sr-only">{t('dashboard:a11y.project_profitability_caption', 'Project profitability breakdown including revenue, costs, and margins')}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" id="pp-project">{t('dashboard:table.project', 'Project')}</th>
                                    <th scope="col" id="pp-revenue">{t('dashboard:table.revenue', 'Revenue')}</th>
                                    <th scope="col" id="pp-costs">{t('dashboard:table.costs', 'Costs')}</th>
                                    <th scope="col" id="pp-profit">{t('dashboard:table.profit', 'Profit')}</th>
                                    <th scope="col" id="pp-margin">{t('dashboard:table.margin', 'Margin')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.project_profitability.map((project, index) => (
                                    <tr key={index}>
                                        <td headers="pp-project">{project.project}</td>
                                        <td headers="pp-revenue">${project.revenue.toLocaleString()}</td>
                                        <td headers="pp-costs">${project.costs.toLocaleString()}</td>
                                        <td headers="pp-profit" className={project.profit >= 0 ? 'positive' : 'negative'}>
                                            ${project.profit.toLocaleString()}
                                        </td>
                                        <td headers="pp-margin" className={project.margin >= 0 ? 'positive' : 'negative'}>
                                            {project.margin}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Inventory Alerts */}
            {analytics.inventory && analytics.inventory.low_stock_items && analytics.inventory.low_stock_items.length > 0 && (
                <div className="dashboard-widget alert">
                    <h2>⚠️ {t('dashboard:sections.low_stock_alerts', 'Low Stock Alerts')}</h2>
                    <div className="low-stock-list">
                        {analytics.inventory.low_stock_items.map((item, index) => (
                            <div key={index} className="low-stock-item">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">{t('dashboard:labels.qty_min', 'Qty: {{qty}} (Min: {{min}})', { qty: item.quantity, min: item.minimum_stock })}</span>
                                <span className="warehouse-name">{item.warehouse__name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
