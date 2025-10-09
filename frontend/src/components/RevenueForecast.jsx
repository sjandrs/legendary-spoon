import React, { useState, useEffect } from 'react';
import api from '../api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import './RevenueForecast.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

function RevenueForecast() {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [months, setMonths] = useState(6);
  const [includeSeasonality, setIncludeSeasonality] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, [months, includeSeasonality]);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        months: months,
        include_seasonality: includeSeasonality,
      };
      const response = await api.get('/api/analytics/forecast/', { params });
      setForecastData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate revenue forecast');
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthsChange = (e) => {
    setMonths(parseInt(e.target.value));
  };

  const handleSeasonalityChange = (e) => {
    setIncludeSeasonality(e.target.checked);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const renderForecastChart = () => {
    if (!forecastData?.forecast) return null;

    const forecast = forecastData.forecast;
    const historical = forecastData.historical || [];

    const allData = [...historical, ...forecast];
    const labels = allData.map(item => item.period);

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Historical Revenue',
          data: historical.map(item => item.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
        },
        {
          label: 'Forecasted Revenue',
          data: [
            ...historical.slice(-1).map(item => item.revenue),
            ...forecast.map(item => item.predicted_revenue),
          ],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          borderDash: [5, 5],
        },
        {
          label: 'Confidence Interval (Upper)',
          data: [
            ...historical.slice(-1).map(item => item.revenue),
            ...forecast.map(item => item.upper_bound || item.predicted_revenue * 1.15),
          ],
          borderColor: 'rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.4,
          fill: '+1',
          pointRadius: 0,
          borderWidth: 1,
        },
        {
          label: 'Confidence Interval (Lower)',
          data: [
            ...historical.slice(-1).map(item => item.revenue),
            ...forecast.map(item => item.lower_bound || item.predicted_revenue * 0.85),
          ],
          borderColor: 'rgba(16, 185, 129, 0.3)',
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            filter: function(item) {
              return !item.text.includes('Confidence Interval');
            },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const value = formatCurrency(context.parsed.y);
              return `${label}: ${value}`;
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
        x: {
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    };

    return (
      <div className="forecast-chart">
        <Line data={data} options={options} />
      </div>
    );
  };

  const renderGrowthChart = () => {
    if (!forecastData?.forecast) return null;

    const forecast = forecastData.forecast;

    const data = {
      labels: forecast.map(item => item.period),
      datasets: [
        {
          label: 'Growth Rate',
          data: forecast.map(item => item.growth_rate || 0),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
              return `Growth: ${context.parsed.y.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: function (value) {
              return value.toFixed(0) + '%';
            },
          },
        },
      },
    };

    return (
      <div className="growth-chart">
        <Line data={data} options={options} />
      </div>
    );
  };

  const calculateTotals = () => {
    if (!forecastData?.forecast) return { total: 0, average: 0 };

    const total = forecastData.forecast.reduce((sum, item) => sum + (item.predicted_revenue || 0), 0);
    const average = total / forecastData.forecast.length;

    return { total, average };
  };

  const totals = calculateTotals();

  return (
    <div className="revenue-forecast">
      <div className="forecast-header">
        <h1>📈 Revenue Forecast</h1>
        <p>AI-powered revenue predictions based on historical data, trends, and seasonality</p>
      </div>

      <div className="forecast-controls">
        <div className="control-group">
          <label htmlFor="months-select">Forecast Period:</label>
          <select
            id="months-select"
            value={months}
            onChange={handleMonthsChange}
            className="form-select"
          >
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
            <option value="24">24 Months</option>
          </select>
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeSeasonality}
              onChange={handleSeasonalityChange}
              className="form-checkbox"
            />
            <span>Include Seasonality</span>
          </label>
        </div>

        <button onClick={fetchForecast} className="refresh-button">
          🔄 Refresh Forecast
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Generating revenue forecast...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && forecastData && (
        <div className="forecast-results">
          <div className="forecast-summary">
            <div className="summary-card primary">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Forecasted Revenue</h3>
                <p className="summary-value">{formatCurrency(totals.total)}</p>
                <p className="summary-label">Next {months} months</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>Average Monthly Revenue</h3>
                <p className="summary-value">{formatCurrency(totals.average)}</p>
                <p className="summary-label">Projected average</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h3>Growth Trend</h3>
                <p className="summary-value" style={{ color: forecastData.average_growth_rate >= 0 ? '#10b981' : '#ef4444' }}>
                  {forecastData.average_growth_rate >= 0 ? '+' : ''}{forecastData.average_growth_rate?.toFixed(1) || 0}%
                </p>
                <p className="summary-label">Average growth rate</p>
              </div>
            </div>

            {forecastData.confidence_score !== undefined && (
              <div className="summary-card">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h3>Forecast Confidence</h3>
                  <p className="summary-value">{forecastData.confidence_score?.toFixed(0) || 0}%</p>
                  <p className="summary-label">Model accuracy</p>
                </div>
              </div>
            )}
          </div>

          <div className="main-chart-section">
            <div className="chart-card">
              <h3>Revenue Forecast Overview</h3>
              <p className="chart-description">
                Historical revenue (solid blue) and forecasted revenue (dashed green) with confidence intervals
              </p>
              {renderForecastChart()}
            </div>
          </div>

          {forecastData.forecast && forecastData.forecast.some(item => item.growth_rate !== undefined) && (
            <div className="growth-chart-section">
              <div className="chart-card">
                <h3>Projected Growth Rate</h3>
                <p className="chart-description">Month-over-month growth rate forecast</p>
                {renderGrowthChart()}
              </div>
            </div>
          )}

          <div className="forecast-table-section">
            <div className="table-card">
              <h3>Detailed Forecast Breakdown</h3>
              <div className="table-wrapper">
                <table className="forecast-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Forecasted Revenue</th>
                      <th>Growth Rate</th>
                      <th>Confidence Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.forecast.map((item, index) => (
                      <tr key={index}>
                        <td className="period-cell">{item.period}</td>
                        <td className="revenue-cell">{formatCurrency(item.predicted_revenue)}</td>
                        <td className="growth-cell" style={{ color: (item.growth_rate || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                          {item.growth_rate !== undefined ? `${item.growth_rate >= 0 ? '+' : ''}${item.growth_rate.toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="confidence-cell">
                          {item.lower_bound !== undefined && item.upper_bound !== undefined
                            ? `${formatCurrency(item.lower_bound)} - ${formatCurrency(item.upper_bound)}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {forecastData.factors && (
            <div className="factors-section">
              <h3>🔍 Key Factors Influencing Forecast</h3>
              <div className="factors-grid">
                {Object.entries(forecastData.factors).map(([key, value]) => (
                  <div key={key} className="factor-card">
                    <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    <p className="factor-value">{typeof value === 'number' ? value.toFixed(2) : value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="forecast-metadata">
            <p className="metadata-item">
              <strong>Model Used:</strong> {forecastData.model_type || 'Time Series Analysis'}
            </p>
            <p className="metadata-item">
              <strong>Data Points Analyzed:</strong> {forecastData.data_points || 'N/A'}
            </p>
            <p className="metadata-item">
              <strong>Generated:</strong> {new Date(forecastData.generated_date || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !forecastData && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Data Available</h3>
          <p>Insufficient historical data to generate revenue forecast. Please ensure you have at least 3 months of transaction history.</p>
        </div>
      )}
    </div>
  );
}

export default RevenueForecast;
