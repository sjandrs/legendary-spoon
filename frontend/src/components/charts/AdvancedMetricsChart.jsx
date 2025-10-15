/**
 * Advanced Metrics Chart Component
 * Sophisticated data visualization for field service analytics
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
// Chart.js components - simplified for compatibility
import { FieldServiceAnalytics, RealTimeAnalytics } from '../../utils/analytics-calculations';

// Advanced chart configuration
const CHART_COLORS = {
  primary: '#3498db',
  secondary: '#e74c3c',
  success: '#27ae60',
  warning: '#f39c12',
  info: '#9b59b6',
  light: '#95a5a6',
  gradients: {
    blue: ['rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 0.2)'],
    green: ['rgba(39, 174, 96, 0.8)', 'rgba(39, 174, 96, 0.2)'],
    red: ['rgba(231, 76, 60, 0.8)', 'rgba(231, 76, 60, 0.2)'],
    orange: ['rgba(243, 156, 18, 0.8)', 'rgba(243, 156, 18, 0.2)'],
    purple: ['rgba(155, 89, 182, 0.8)', 'rgba(155, 89, 182, 0.2)']
  }
};

// Utilization Chart Component
const TechnicianUtilizationChart = memo(({ data, timeRange = '30days' }) => {

  return (
    <div className="chart-container utilization-chart">
      <h3>Technician Utilization Metrics - {timeRange}</h3>
      <div className="chart-bars">
        {Object.keys(data || {}).map((techId) => (
          <div key={techId} className="technician-bar">
            <div className="bar-label">Tech {techId.slice(-4)}</div>
            <div className="bar-group">
              <div
                className="bar efficiency"
                style={{ height: `${data[techId].efficiency}%` }}
                title={`Efficiency: ${data[techId].efficiency.toFixed(1)}%`}
              >
                <span className="bar-value">{data[techId].efficiency.toFixed(1)}%</span>
              </div>
              <div
                className="bar productivity"
                style={{ height: `${data[techId].productivity}%` }}
                title={`Productivity: ${data[techId].productivity.toFixed(1)}%`}
              >
                <span className="bar-value">{data[techId].productivity.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color efficiency"></div>
          <span>Efficiency %</span>
        </div>
        <div className="legend-item">
          <div className="legend-color productivity"></div>
          <span>Productivity %</span>
        </div>
      </div>
    </div>
  );
});

// Service Completion Trends Chart
const ServiceCompletionTrendsChart = memo(({ data, timeRange = '30days' }) => {
  const chartData = useMemo(() => {
    if (!data || !data.trendsData) {
      return { datasets: [] };
    }

    const labels = data.trendsData.map(item =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Completed Jobs',
          data: data.trendsData.map(item => item.completed),
          backgroundColor: CHART_COLORS.gradients.green[0],
          borderColor: CHART_COLORS.success,
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Total Jobs',
          data: data.trendsData.map(item => item.count),
          backgroundColor: CHART_COLORS.gradients.blue[0],
          borderColor: CHART_COLORS.primary,
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `Service Completion Trends - ${timeRange}`,
        font: { size: 16, weight: 'bold' }
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          afterLabel: (context) => {
            if (data && context.dataIndex < data.trendsData.length) {
              const dayData = data.trendsData[context.dataIndex];
              const completionRate = dayData.count > 0 ? (dayData.completed / dayData.count * 100) : 0;
              return `Completion Rate: ${completionRate.toFixed(1)}%`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Jobs'
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="chart-container" style={{ height: '350px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
});

// Customer Satisfaction Radar Chart
const CustomerSatisfactionChart = memo(({ data }) => {
  const chartData = useMemo(() => {
    if (!data || !data.feedbackCategories) {
      return { datasets: [] };
    }

    const categories = ['Timeliness', 'Quality', 'Communication', 'Professionalism', 'Value'];
    const scores = categories.map(() => Math.random() * 5 + 3); // Mock data

    return {
      labels: categories,
      datasets: [
        {
          label: 'Current Period',
          data: scores,
          backgroundColor: CHART_COLORS.gradients.blue[1],
          borderColor: CHART_COLORS.primary,
          borderWidth: 2,
          pointBackgroundColor: CHART_COLORS.primary,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: CHART_COLORS.primary
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Customer Satisfaction Breakdown',
        font: { size: 16, weight: 'bold' }
      },
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 5,
        ticks: {
          stepSize: 1,
          callback: (value) => value.toFixed(1)
        }
      }
    }
  };

  return (
    <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
      <Radar data={chartData} options={options} />
    </div>
  );
});

// Revenue Distribution Doughnut Chart
const RevenueDistributionChart = memo(({ data }) => {
  const chartData = useMemo(() => {
    if (!data || !data.profitabilityByCategory) {
      return { datasets: [] };
    }

    const categories = Object.keys(data.profitabilityByCategory);
    const revenues = categories.map(cat => data.profitabilityByCategory[cat].revenue);
    const colors = [
      CHART_COLORS.primary,
      CHART_COLORS.success,
      CHART_COLORS.warning,
      CHART_COLORS.secondary,
      CHART_COLORS.info,
      CHART_COLORS.light
    ];

    return {
      labels: categories,
      datasets: [
        {
          data: revenues,
          backgroundColor: colors.slice(0, categories.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverBorderWidth: 3
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Revenue Distribution by Category',
        font: { size: 16, weight: 'bold' }
      },
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            const value = context.parsed.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD'
            });
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
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

    const connection = RealTimeAnalytics.setupRealTimeConnection((update) => {
      setMetrics(prevMetrics =>
        RealTimeAnalytics.processDataUpdate(update, prevMetrics)
      );
    });

    // Subscribe to relevant events
    connection.subscribe('work_order_completed', (data) => {
      console.log('Work order completed:', data);
    });

    connection.subscribe('technician_status', (data) => {
      console.log('Technician status update:', data);
    });

    return () => {
      connection.unsubscribe('work_order_completed');
      connection.unsubscribe('technician_status');
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
      {/* Controls */}
      <div className="metrics-controls">
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

        {realTimeEnabled && (
          <div className="real-time-indicator">
            <span className="indicator-dot"></span>
            Live Updates
          </div>
        )}
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="metrics-content">
        {activeTab === 'utilization' && (
          <TechnicianUtilizationChart
            data={metrics.utilizationData}
            timeRange={selectedTimeRange}
          />
        )}

        {activeTab === 'completion' && (
          <ServiceCompletionTrendsChart
            data={metrics.completionTrends}
            timeRange={selectedTimeRange}
          />
        )}

        {activeTab === 'satisfaction' && (
          <CustomerSatisfactionChart data={metrics.satisfactionMetrics} />
        )}

        {activeTab === 'revenue' && (
          <RevenueDistributionChart data={metrics.revenueMetrics} />
        )}
      </div>

      {/* Summary Stats */}
      <div className="metrics-summary">
        <div className="summary-card">
          <h4>Completion Rate</h4>
          <span className="metric-value">
            {metrics.completionTrends?.completionRate?.toFixed(1) || 0}%
          </span>
        </div>

        <div className="summary-card">
          <h4>Avg Satisfaction</h4>
          <span className="metric-value">
            {metrics.satisfactionMetrics?.averageRating?.toFixed(1) || 0}/5
          </span>
        </div>

        <div className="summary-card">
          <h4>Total Revenue</h4>
          <span className="metric-value">
            ${metrics.revenueMetrics?.totalRevenue?.toLocaleString() || 0}
          </span>
        </div>

        <div className="summary-card">
          <h4>Profit Margin</h4>
          <span className="metric-value">
            {metrics.revenueMetrics?.profitMargin?.toFixed(1) || 0}%
          </span>
        </div>
      </div>
    </div>
  );
});

// Individual chart component exports
TechnicianUtilizationChart.displayName = 'TechnicianUtilizationChart';
ServiceCompletionTrendsChart.displayName = 'ServiceCompletionTrendsChart';
CustomerSatisfactionChart.displayName = 'CustomerSatisfactionChart';
RevenueDistributionChart.displayName = 'RevenueDistributionChart';
AdvancedMetricsChart.displayName = 'AdvancedMetricsChart';

export default AdvancedMetricsChart;
export {
  TechnicianUtilizationChart,
  ServiceCompletionTrendsChart,
  CustomerSatisfactionChart,
  RevenueDistributionChart
};
