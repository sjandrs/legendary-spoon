import React, { useState, useEffect } from 'react';
import apiClient, { getDashboardAnalytics } from '../api'; // Import the configured axios instance
import DealsByStageChart from './charts/DealsByStageChart';
import SalesPerformanceChart from './charts/SalesPerformanceChart';
import './DashboardPage.css';

const DashboardPage = () => {
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
                setError('Failed to fetch dashboard analytics.');
                console.error(_err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div data-testid="loading">Loading dashboard...</div>;
    }

    if (error) {
        return <div data-testid="error-message">{error}</div>;
    }

    if (!analytics) {
        return <div data-testid="no-data">No analytics data available.</div>;
    }

    return (
        <div className="dashboard-page" data-testid="dashboard-page">
            <div className="dashboard-header">
                <h1>Business Dashboard</h1>
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
                    <h3>Sales Performance</h3>
                    <div className="metric-value">{analytics.sales?.win_rate || 0}%</div>
                    <div className="metric-label">Win Rate</div>
                    <div className="metric-subtext">
                        {analytics.sales?.won_deals || 0} won of {analytics.sales?.total_deals || 0} deals
                    </div>
                </div>

                <div className="metric-card">
                    <h3>Total Revenue</h3>
                    <div className="metric-value">${(analytics.financial?.total_revenue || 0).toLocaleString()}</div>
                    <div className="metric-label">Last 30 Days</div>
                    <div className="metric-subtext">
                        Margin: {analytics.financial?.profit_margin || 0}%
                    </div>
                </div>

                <div className="metric-card">
                    <h3>Project Completion</h3>
                    <div className="metric-value">{analytics.projects?.completion_rate || 0}%</div>
                    <div className="metric-label">Completion Rate</div>
                    <div className="metric-subtext">
                        {analytics.projects?.overdue_projects || 0} overdue
                    </div>
                </div>

                <div className="metric-card">
                    <h3>Time Tracking</h3>
                    <div className="metric-value">{analytics.time_tracking?.total_hours || 0}h</div>
                    <div className="metric-label">Total Hours</div>
                    <div className="metric-subtext">
                        {analytics.time_tracking?.billable_percentage || 0}% billable
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <div className="dashboard-widget">
                    <h2>Deal Pipeline</h2>
                    <div className="deal-pipeline">
                        {analytics.sales && (
                            <div className="pipeline-stats">
                                <div className="pipeline-item">
                                    <span className="pipeline-label">Total Deals:</span>
                                    <span className="pipeline-value">{analytics.sales.total_deals}</span>
                                </div>
                                <div className="pipeline-item">
                                    <span className="pipeline-label">Won Deals:</span>
                                    <span className="pipeline-value won">{analytics.sales.won_deals}</span>
                                </div>
                                <div className="pipeline-item">
                                    <span className="pipeline-label">Total Value:</span>
                                    <span className="pipeline-value">${analytics.sales.total_value.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-widget">
                    <h2>Project Overview</h2>
                    <div className="project-overview">
                        {analytics.projects && (
                            <div className="overview-stats">
                                <div className="overview-item">
                                    <span className="overview-label">Active Projects:</span>
                                    <span className="overview-value">{analytics.projects.total_projects - analytics.projects.completed_projects}</span>
                                </div>
                                <div className="overview-item">
                                    <span className="overview-label">Completed:</span>
                                    <span className="overview-value completed">{analytics.projects.completed_projects}</span>
                                </div>
                                <div className="overview-item">
                                    <span className="overview-label">Overdue:</span>
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
                    <h2>Top Customers by Lifetime Value</h2>
                    <div className="clv-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Total Value</th>
                                    <th>Deal Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.customer_lifetime_value.map((customer, index) => (
                                    <tr key={index}>
                                        <td>{customer.account}</td>
                                        <td>${customer.total_value.toLocaleString()}</td>
                                        <td>{customer.deal_count}</td>
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
                    <h2>Project Profitability</h2>
                    <div className="profitability-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Revenue</th>
                                    <th>Costs</th>
                                    <th>Profit</th>
                                    <th>Margin</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.project_profitability.map((project, index) => (
                                    <tr key={index}>
                                        <td>{project.project}</td>
                                        <td>${project.revenue.toLocaleString()}</td>
                                        <td>${project.costs.toLocaleString()}</td>
                                        <td className={project.profit >= 0 ? 'positive' : 'negative'}>
                                            ${project.profit.toLocaleString()}
                                        </td>
                                        <td className={project.margin >= 0 ? 'positive' : 'negative'}>
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
                    <h2>⚠️ Low Stock Alerts</h2>
                    <div className="low-stock-list">
                        {analytics.inventory.low_stock_items.map((item, index) => (
                            <div key={index} className="low-stock-item">
                                <span className="item-name">{item.name}</span>
                                <span className="item-quantity">Qty: {item.quantity} (Min: {item.minimum_stock})</span>
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
