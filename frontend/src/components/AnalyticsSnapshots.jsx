import React, { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './AnalyticsSnapshots.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

function AnalyticsSnapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [metricType, setMetricType] = useState('all');

  useEffect(() => {
    fetchSnapshots();
  }, [dateRange, metricType]);

  const fetchSnapshots = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        days: dateRange,
        metric_type: metricType !== 'all' ? metricType : undefined,
      };
      const response = await api.get('/api/analytics-snapshots/', { params });
      setSnapshots(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load analytics snapshots');
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLatestSnapshot = () => {
    if (snapshots.length === 0) return null;
    return snapshots[snapshots.length - 1];
  };

  const calculateTrend = (metric) => {
    if (snapshots.length < 2) return { value: 0, direction: 'neutral' };
    
    const latest = snapshots[snapshots.length - 1][metric];
    const previous = snapshots[snapshots.length - 2][metric];
    
    if (!latest || !previous) return { value: 0, direction: 'neutral' };
    
    const change = ((latest - previous) / previous) * 100;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
    
    return { value: Math.abs(change), direction };
  };

  const renderRevenueChart = () => {
    if (snapshots.length === 0) return null;

    const data = {
      labels: snapshots.map(s => formatDate(s.snapshot_date || s.created_at)),
      datasets: [
        {
          label: 'Total Revenue',
          data: snapshots.map(s => s.total_revenue || 0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Revenue: ${formatCurrency(context.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return '$' + (value / 1000).toFixed(0) + 'K';
            },
          },
        },
      },
    };

    return (
      <div className="snapshot-chart">
        <Line data={data} options={options} />
      </div>
    );
  };

  const renderDealsChart = () => {
    if (snapshots.length === 0) return null;

    const data = {
      labels: snapshots.map(s => formatDate(s.snapshot_date || s.created_at)),
      datasets: [
        {
          label: 'Active Deals',
          data: snapshots.map(s => s.active_deals_count || 0),
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1,
        },
        {
          label: 'Won Deals',
          data: snapshots.map(s => s.won_deals_count || 0),
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1,
        },
        {
          label: 'Lost Deals',
          data: snapshots.map(s => s.lost_deals_count || 0),
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };

    return (
      <div className="snapshot-chart">
        <Bar data={data} options={options} />
      </div>
    );
  };

  const renderCustomerChart = () => {
    if (snapshots.length === 0) return null;

    const data = {
      labels: snapshots.map(s => formatDate(s.snapshot_date || s.created_at)),
      datasets: [
        {
          label: 'Total Customers',
          data: snapshots.map(s => s.total_customers || 0),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'New Customers',
          data: snapshots.map(s => s.new_customers_count || 0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="snapshot-chart">
        <Line data={data} options={options} />
      </div>
    );
  };

  const latestSnapshot = getLatestSnapshot();
  const revenueTrend = calculateTrend('total_revenue');
  const dealsTrend = calculateTrend('active_deals_count');
  const customersTrend = calculateTrend('total_customers');

  return (
    <div className="analytics-snapshots">
      <div className="snapshots-header">
        <h1>📊 Analytics Snapshots</h1>
        <p>Historical business metrics and trends over time</p>
      </div>

      <div className="snapshots-controls">
        <div className="control-group">
          <label htmlFor="date-range-select">Time Period:</label>
          <select
            id="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-select"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="metric-type-select">Metric Focus:</label>
          <select
            id="metric-type-select"
            value={metricType}
            onChange={(e) => setMetricType(e.target.value)}
            className="form-select"
          >
            <option value="all">All Metrics</option>
            <option value="revenue">Revenue</option>
            <option value="deals">Deals</option>
            <option value="customers">Customers</option>
          </select>
        </div>

        <button onClick={fetchSnapshots} className="refresh-button">
          🔄 Refresh Data
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics snapshots...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && latestSnapshot && (
        <div className="snapshots-results">
          <div className="snapshots-summary">
            <div className="summary-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Revenue</h3>
                <p className="metric-value">{formatCurrency(latestSnapshot.total_revenue)}</p>
                <div className={`trend-indicator ${revenueTrend.direction}`}>
                  {revenueTrend.direction === 'up' && '↑'}
                  {revenueTrend.direction === 'down' && '↓'}
                  {revenueTrend.direction === 'neutral' && '→'}
                  <span>{revenueTrend.value.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">🤝</div>
              <div className="card-content">
                <h3>Active Deals</h3>
                <p className="metric-value">{latestSnapshot.active_deals_count || 0}</p>
                <div className={`trend-indicator ${dealsTrend.direction}`}>
                  {dealsTrend.direction === 'up' && '↑'}
                  {dealsTrend.direction === 'down' && '↓'}
                  {dealsTrend.direction === 'neutral' && '→'}
                  <span>{dealsTrend.value.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>Total Customers</h3>
                <p className="metric-value">{latestSnapshot.total_customers || 0}</p>
                <div className={`trend-indicator ${customersTrend.direction}`}>
                  {customersTrend.direction === 'up' && '↑'}
                  {customersTrend.direction === 'down' && '↓'}
                  {customersTrend.direction === 'neutral' && '→'}
                  <span>{customersTrend.value.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>Won Deals</h3>
                <p className="metric-value">{latestSnapshot.won_deals_count || 0}</p>
                <p className="metric-label">Closed successfully</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h3>Average Deal Value</h3>
                <p className="metric-value">{formatCurrency(latestSnapshot.average_deal_value)}</p>
                <p className="metric-label">Per deal</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">🆕</div>
              <div className="card-content">
                <h3>New Customers</h3>
                <p className="metric-value">{latestSnapshot.new_customers_count || 0}</p>
                <p className="metric-label">This period</p>
              </div>
            </div>
          </div>

          {(metricType === 'all' || metricType === 'revenue') && (
            <div className="chart-section">
              <div className="chart-card">
                <h3>Revenue Trend</h3>
                <p className="chart-description">Total revenue over time</p>
                {renderRevenueChart()}
              </div>
            </div>
          )}

          {(metricType === 'all' || metricType === 'deals') && (
            <div className="chart-section">
              <div className="chart-card">
                <h3>Deals Overview</h3>
                <p className="chart-description">Active, won, and lost deals tracking</p>
                {renderDealsChart()}
              </div>
            </div>
          )}

          {(metricType === 'all' || metricType === 'customers') && (
            <div className="chart-section">
              <div className="chart-card">
                <h3>Customer Growth</h3>
                <p className="chart-description">Total and new customers over time</p>
                {renderCustomerChart()}
              </div>
            </div>
          )}

          <div className="snapshots-table-section">
            <div className="table-card">
              <h3>Historical Data</h3>
              <div className="table-wrapper">
                <table className="snapshots-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Revenue</th>
                      <th>Active Deals</th>
                      <th>Won Deals</th>
                      <th>Customers</th>
                      <th>Avg Deal Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.slice().reverse().map((snapshot, index) => (
                      <tr key={index}>
                        <td className="date-cell">{formatDate(snapshot.snapshot_date || snapshot.created_at)}</td>
                        <td className="revenue-cell">{formatCurrency(snapshot.total_revenue)}</td>
                        <td className="deals-cell">{snapshot.active_deals_count || 0}</td>
                        <td className="won-cell">{snapshot.won_deals_count || 0}</td>
                        <td className="customers-cell">{snapshot.total_customers || 0}</td>
                        <td className="avg-deal-cell">{formatCurrency(snapshot.average_deal_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="snapshots-metadata">
            <p className="metadata-item">
              <strong>Data Points:</strong> {snapshots.length}
            </p>
            <p className="metadata-item">
              <strong>Latest Snapshot:</strong> {formatDate(latestSnapshot.snapshot_date || latestSnapshot.created_at)}
            </p>
            <p className="metadata-item">
              <strong>Period:</strong> {dateRange} days
            </p>
          </div>
        </div>
      )}

      {!loading && !error && snapshots.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Analytics Data Available</h3>
          <p>Analytics snapshots are generated automatically. Check back later to see historical trends and business metrics.</p>
        </div>
      )}
    </div>
  );
}

export default AnalyticsSnapshots;
