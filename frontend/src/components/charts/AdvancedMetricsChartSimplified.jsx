/**
 * Simplified Advanced Metrics Chart Component
 * Dashboard analytics with HTML/CSS visualization
 */

import React, { useState, useEffect, memo } from 'react';
import { FieldServiceAnalytics, RealTimeAnalytics } from '../../utils/analytics-calculations';
import './AdvancedMetricsChart.css';

// Simplified Metrics Display Component
const MetricsDisplay = memo(({ metrics, _timeRange, activeView }) => {
  if (!metrics) {
    return <div className="no-data">No data available</div>;
  }

  const renderUtilizationView = () => (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Technician Performance</h3>
        <div className="technician-list">
          {Object.keys(metrics.utilizationData || {}).map(techId => (
            <div key={techId} className="technician-item">
              <span className="tech-name">Tech {techId.slice(-4)}</span>
              <div className="performance-bars">
                <div className="performance-metric">
                  <span>Efficiency</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill efficiency"
                      style={{ width: `${metrics.utilizationData[techId].efficiency}%` }}
                    ></div>
                    <span className="progress-text">
                      {metrics.utilizationData[techId].efficiency.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="performance-metric">
                  <span>Productivity</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill productivity"
                      style={{ width: `${metrics.utilizationData[techId].productivity}%` }}
                    ></div>
                    <span className="progress-text">
                      {metrics.utilizationData[techId].productivity.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCompletionView = () => (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Service Completion Metrics</h3>
        <div className="completion-stats">
          <div className="stat-item">
            <div className="stat-value">{metrics.completionTrends?.completionRate?.toFixed(1) || 0}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{metrics.completionTrends?.averageCompletionTime?.toFixed(1) || 0}</div>
            <div className="stat-label">Avg Days to Complete</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{metrics.completionTrends?.onTimeDelivery?.toFixed(1) || 0}%</div>
            <div className="stat-label">On-Time Delivery</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{metrics.completionTrends?.firstTimeFixRate?.toFixed(1) || 0}%</div>
            <div className="stat-label">First-Time Fix</div>
          </div>
        </div>

        {metrics.completionTrends?.categoryBreakdown && (
          <div className="category-breakdown">
            <h4>By Service Category</h4>
            {Object.keys(metrics.completionTrends.categoryBreakdown).map(category => (
              <div key={category} className="category-item">
                <span className="category-name">{category}</span>
                <span className="category-stats">
                  {metrics.completionTrends.categoryBreakdown[category].count} jobs •
                  Avg Rating: {metrics.completionTrends.categoryBreakdown[category].avgRating.toFixed(1)}/5
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSatisfactionView = () => (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Customer Satisfaction</h3>
        <div className="satisfaction-overview">
          <div className="satisfaction-score">
            <div className="score-circle">
              <div className="score-value">{metrics.satisfactionMetrics?.averageRating?.toFixed(1) || 0}</div>
              <div className="score-total">/5.0</div>
            </div>
            <div className="score-details">
              <p>NPS Score: {metrics.satisfactionMetrics?.npsScore?.toFixed(0) || 0}</p>
              <p>Response Rate: {metrics.satisfactionMetrics?.responseRate?.toFixed(1) || 0}%</p>
            </div>
          </div>

          {metrics.satisfactionMetrics?.topPerformers && (
            <div className="top-performers">
              <h4>Top Performers</h4>
              {metrics.satisfactionMetrics.topPerformers.slice(0, 3).map((performer, index) => (
                <div key={performer.technicianId} className="performer-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="tech-name">Tech {performer.technicianId.slice(-4)}</span>
                  <span className="rating">{performer.averageRating.toFixed(1)}/5</span>
                  <span className="job-count">({performer.jobCount} jobs)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRevenueView = () => (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Revenue Analysis</h3>
        <div className="revenue-summary">
          <div className="revenue-stats">
            <div className="revenue-item">
              <span className="revenue-label">Total Revenue</span>
              <span className="revenue-value positive">
                ${metrics.revenueMetrics?.totalRevenue?.toLocaleString() || 0}
              </span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Total Expenses</span>
              <span className="revenue-value negative">
                ${metrics.revenueMetrics?.totalExpenses?.toLocaleString() || 0}
              </span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Gross Profit</span>
              <span className={`revenue-value ${(metrics.revenueMetrics?.grossProfit || 0) >= 0 ? 'positive' : 'negative'}`}>
                ${metrics.revenueMetrics?.grossProfit?.toLocaleString() || 0}
              </span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Profit Margin</span>
              <span className={`revenue-value ${(metrics.revenueMetrics?.profitMargin || 0) >= 0 ? 'positive' : 'negative'}`}>
                {metrics.revenueMetrics?.profitMargin?.toFixed(1) || 0}%
              </span>
            </div>
          </div>

          <div className="revenue-details">
            <div className="detail-item">
              <span className="detail-label">Revenue per Technician</span>
              <span className="detail-value">
                ${metrics.revenueMetrics?.revenuePerTechnician?.toLocaleString() || 0}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Average Job Value</span>
              <span className="detail-value">
                ${metrics.revenueMetrics?.averageJobValue?.toLocaleString() || 0}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Cost per Job</span>
              <span className="detail-value">
                ${metrics.revenueMetrics?.costPerJob?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  switch (activeView) {
    case 'utilization':
      return renderUtilizationView();
    case 'completion':
      return renderCompletionView();
    case 'satisfaction':
      return renderSatisfactionView();
    case 'revenue':
      return renderRevenueView();
    default:
      return renderUtilizationView();
  }
});

// Main Advanced Metrics Chart Component
const AdvancedMetricsChart = memo(({
  workOrders = [],
  timeEntries = [],
  expenses = [],
  warehouseItems = [],
  feedbackData = [],
  realTimeEnabled = false
}) => {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('utilization');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Calculate all metrics
  useEffect(() => {
    const calculateMetrics = async () => {
      setLoading(true);

      try {
        const dateRange = {
          start: new Date(Date.now() - (selectedTimeRange === '30days' ? 30 : selectedTimeRange === '90days' ? 90 : 365) * 24 * 60 * 60 * 1000),
          end: new Date()
        };

        const utilizationData = FieldServiceAnalytics.calculateTechnicianUtilization(
          timeEntries, workOrders, dateRange
        );

        const completionTrends = FieldServiceAnalytics.calculateServiceCompletionTrends(
          workOrders, selectedTimeRange
        );

        const revenueMetrics = FieldServiceAnalytics.calculateRevenueMetrics(
          workOrders, expenses, timeEntries
        );

        const satisfactionMetrics = FieldServiceAnalytics.calculateCustomerSatisfactionMetrics(
          workOrders, feedbackData
        );

        setMetrics({
          utilizationData,
          completionTrends,
          revenueMetrics,
          satisfactionMetrics
        });
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error calculating metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateMetrics();
  }, [workOrders, timeEntries, expenses, feedbackData, selectedTimeRange, warehouseItems]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const _connection = RealTimeAnalytics.setupRealTimeConnection((update) => {
      setMetrics(prevMetrics =>
        RealTimeAnalytics.processDataUpdate(update, prevMetrics)
      );
      setLastUpdated(new Date());
    });

    return () => {
      // Cleanup connection
    };
  }, [realTimeEnabled]);

  if (loading) {
    return (
      <div className="advanced-metrics-loading">
        <div className="loading-spinner"></div>
        <p>Calculating advanced metrics...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'utilization', label: 'Technician Utilization', icon: '👥' },
    { id: 'completion', label: 'Service Trends', icon: '📈' },
    { id: 'satisfaction', label: 'Customer Satisfaction', icon: '⭐' },
    { id: 'revenue', label: 'Revenue Analysis', icon: '💰' }
  ];

  return (
    <div className="advanced-metrics-chart">
      {/* Header Controls */}
      <div className="metrics-header">
        <h2>Advanced Analytics Dashboard</h2>
        <div className="header-controls">
          <div className="time-range-selector">
            <label htmlFor="time-range">Time Range:</label>
            <select
              id="time-range"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
            >
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="365days">Last Year</option>
            </select>
          </div>

          <div className="update-info">
            <span className="last-updated">
              Last Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            {realTimeEnabled && (
              <div className="real-time-indicator">
                <span className="indicator-dot"></span>
                Live
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="metrics-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Metrics Content */}
      <div className="metrics-content">
        <MetricsDisplay
          metrics={metrics}
          timeRange={selectedTimeRange}
          activeView={activeTab}
        />
      </div>

      {/* Quick Summary */}
      <div className="metrics-summary">
        <div className="summary-cards">
          <div className="summary-card completion">
            <div className="card-icon">✅</div>
            <div className="card-content">
              <h4>Completion Rate</h4>
              <span className="metric-value">
                {metrics.completionTrends?.completionRate?.toFixed(1) || 0}%
              </span>
            </div>
          </div>

          <div className="summary-card satisfaction">
            <div className="card-icon">⭐</div>
            <div className="card-content">
              <h4>Avg Satisfaction</h4>
              <span className="metric-value">
                {metrics.satisfactionMetrics?.averageRating?.toFixed(1) || 0}/5
              </span>
            </div>
          </div>

          <div className="summary-card revenue">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h4>Total Revenue</h4>
              <span className="metric-value">
                ${metrics.revenueMetrics?.totalRevenue?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="summary-card profit">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h4>Profit Margin</h4>
              <span className="metric-value">
                {metrics.revenueMetrics?.profitMargin?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MetricsDisplay.displayName = 'MetricsDisplay';
AdvancedMetricsChart.displayName = 'AdvancedMetricsChart';

export default AdvancedMetricsChart;
