import React, { useState, useEffect } from 'react';
import apiClient from '../api'; // Import the configured axios instance
import DealsByStageChart from './charts/DealsByStageChart';
import SalesPerformanceChart from './charts/SalesPerformanceChart';
import './DashboardPage.css';

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/api/dashboard-stats/');
                setStats(response.data);
            } catch (err) {
                setError('Failed to fetch dashboard data.');
                console.error(err);
            }
        };

        fetchStats();
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    if (!stats) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-widget">
                <h2>Deals by Stage</h2>
                <DealsByStageChart data={stats.deals_by_stage} />
            </div>
            <div className="dashboard-widget">
                <h2>Sales Performance</h2>
                <SalesPerformanceChart data={stats.sales_performance} />
            </div>
            <div className="dashboard-widget">
                <h2>Recent Activities</h2>
                <ul>
                    {stats.recent_activities.map(activity => (
                        <li key={activity.id}>
                            <strong>{activity.get_interaction_type_display}</strong> with {activity.contact?.first_name} {activity.contact?.last_name} on {new Date(activity.interaction_date).toLocaleDateString()}
                            <p>{activity.subject}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DashboardPage;
