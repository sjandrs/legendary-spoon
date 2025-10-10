import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './CustomerLifetimeValue.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function CustomerLifetimeValue() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(contactId || '');
  const [clvData, setClvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContactId) {
      fetchCLV(selectedContactId);
    }
  }, [selectedContactId]);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/api/contacts/');
      setContacts(response.data.results || response.data);
    } catch (_err) {
      console.error('Error fetching contacts:', _err);
    }
  };

  const fetchCLV = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/analytics/clv/${id}/`);
      setClvData(response.data);
    } catch (_err) {
      setError(_err.response?.data?.error || 'Failed to calculate CLV');
      setClvData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleContactChange = (e) => {
    const newContactId = e.target.value;
    setSelectedContactId(newContactId);
    if (newContactId) {
      navigate(`/analytics/customer-lifetime-value/${newContactId}`);
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

  const renderRevenueChart = () => {
    if (!clvData?.revenue_history) return null;

    const history = clvData.revenue_history;

    const data = {
      labels: history.map(item => item.period),
      datasets: [
        {
          label: 'Revenue',
          data: history.map(item => item.revenue),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
      <div className="clv-chart">
        <Line data={data} options={options} />
      </div>
    );
  };

  const renderSegmentChart = () => {
    if (!clvData) return null;

    const segments = [
      { label: 'High Value', threshold: 50000, color: '#10b981' },
      { label: 'Medium Value', threshold: 20000, color: '#3b82f6' },
      { label: 'Low Value', threshold: 0, color: '#f59e0b' },
    ];

    const currentCLV = clvData.lifetime_value || 0;
    let segment = segments[2]; // Default to Low Value

    for (const seg of segments) {
      if (currentCLV >= seg.threshold) {
        segment = seg;
        break;
      }
    }

    const data = {
      labels: segments.map(s => s.label),
      datasets: [
        {
          label: 'Segment',
          data: segments.map(s => (segment.label === s.label ? currentCLV : s.threshold)),
          backgroundColor: segments.map(s => s.color),
          borderColor: segments.map(s => s.color),
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Value: ${formatCurrency(context.parsed.x)}`;
            },
          },
        },
      },
      scales: {
        x: {
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
      <div className="segment-chart">
        <Bar data={data} options={options} />
      </div>
    );
  };

  const getSegmentBadge = () => {
    if (!clvData) return null;

    const clv = clvData.lifetime_value || 0;
    let badge = { label: 'Low Value', color: '#f59e0b' };

    if (clv >= 50000) {
      badge = { label: 'High Value', color: '#10b981' };
    } else if (clv >= 20000) {
      badge = { label: 'Medium Value', color: '#3b82f6' };
    }

    return (
      <span className="segment-badge" style={{ backgroundColor: badge.color }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="customer-lifetime-value">
      <div className="clv-header">
        <h1>💰 Customer Lifetime Value</h1>
        <p>Analyze customer value, purchase patterns, and growth potential</p>
      </div>

      <div className="contact-selector">
        <label htmlFor="contact-select">Select Customer:</label>
        <select
          id="contact-select"
          value={selectedContactId}
          onChange={handleContactChange}
          className="form-select"
        >
          <option value="">-- Select a customer --</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.first_name} {contact.last_name} - {contact.email}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Calculating customer lifetime value...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && clvData && (
        <div className="clv-results">
          <div className="clv-summary">
            <div className="clv-card primary">
              <div className="card-icon">💎</div>
              <div className="card-content">
                <h3>Total Lifetime Value</h3>
                <p className="clv-value">{formatCurrency(clvData.lifetime_value)}</p>
                {getSegmentBadge()}
              </div>
            </div>

            <div className="clv-card">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h3>Average Order Value</h3>
                <p className="metric-value">{formatCurrency(clvData.average_order_value)}</p>
                <p className="metric-label">Per transaction</p>
              </div>
            </div>

            <div className="clv-card">
              <div className="card-icon">🔄</div>
              <div className="card-content">
                <h3>Purchase Frequency</h3>
                <p className="metric-value">{clvData.purchase_frequency?.toFixed(1) || 0}</p>
                <p className="metric-label">Transactions per year</p>
              </div>
            </div>

            <div className="clv-card">
              <div className="card-icon">⏱️</div>
              <div className="card-content">
                <h3>Customer Tenure</h3>
                <p className="metric-value">{clvData.customer_tenure_days || 0}</p>
                <p className="metric-label">Days as customer</p>
              </div>
            </div>

            <div className="clv-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>Total Transactions</h3>
                <p className="metric-value">{clvData.total_transactions || 0}</p>
                <p className="metric-label">Completed orders</p>
              </div>
            </div>

            <div className="clv-card">
              <div className="card-icon">💵</div>
              <div className="card-content">
                <h3>Total Revenue</h3>
                <p className="metric-value">{formatCurrency(clvData.total_revenue)}</p>
                <p className="metric-label">All-time</p>
              </div>
            </div>
          </div>

          {clvData.revenue_history && clvData.revenue_history.length > 0 && (
            <div className="chart-section">
              <div className="chart-card">
                <h3>Revenue History</h3>
                <p className="chart-description">Track revenue trends over time</p>
                {renderRevenueChart()}
              </div>
            </div>
          )}

          <div className="chart-section">
            <div className="chart-card">
              <h3>Customer Segment</h3>
              <p className="chart-description">Compare customer value against segments</p>
              {renderSegmentChart()}
            </div>
          </div>

          {clvData.predicted_next_purchase && (
            <div className="prediction-section">
              <h3>🔮 Predictive Insights</h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <h4>Next Purchase Prediction</h4>
                  <p className="insight-value">
                    {new Date(clvData.predicted_next_purchase).toLocaleDateString()}
                  </p>
                  <p className="insight-label">Expected date</p>
                </div>

                {clvData.churn_risk !== undefined && (
                  <div className="insight-card">
                    <h4>Churn Risk</h4>
                    <p className="insight-value" style={{ color: clvData.churn_risk > 0.5 ? '#ef4444' : '#10b981' }}>
                      {(clvData.churn_risk * 100).toFixed(0)}%
                    </p>
                    <p className="insight-label">
                      {clvData.churn_risk > 0.7 ? 'High risk' : clvData.churn_risk > 0.4 ? 'Medium risk' : 'Low risk'}
                    </p>
                  </div>
                )}

                {clvData.growth_potential !== undefined && (
                  <div className="insight-card">
                    <h4>Growth Potential</h4>
                    <p className="insight-value" style={{ color: '#3b82f6' }}>
                      {(clvData.growth_potential * 100).toFixed(0)}%
                    </p>
                    <p className="insight-label">
                      {clvData.growth_potential > 0.6 ? 'High potential' : clvData.growth_potential > 0.3 ? 'Medium potential' : 'Low potential'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {clvData.contact_info && (
            <div className="contact-info-section">
              <h3>Customer Information</h3>
              <div className="contact-info-grid">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">
                    {clvData.contact_info.first_name} {clvData.contact_info.last_name}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{clvData.contact_info.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span>
                  <span className="info-value">{clvData.contact_info.phone || 'N/A'}</span>
                </div>
                {clvData.contact_info.account_name && (
                  <div className="info-item">
                    <span className="info-label">Account:</span>
                    <span className="info-value">{clvData.contact_info.account_name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="clv-metadata">
            <p className="metadata-item">
              <strong>Calculated:</strong> {new Date(clvData.calculated_date || Date.now()).toLocaleString()}
            </p>
            <p className="metadata-item">
              <strong>Analysis Period:</strong> {clvData.analysis_period || 'All-time'}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !clvData && selectedContactId && (
        <div className="empty-state">
          <p>No transaction data available for this customer. CLV can only be calculated for customers with purchase history.</p>
        </div>
      )}

      {!selectedContactId && (
        <div className="empty-state">
          <div className="empty-icon">💎</div>
          <h3>Select a Customer to View CLV</h3>
          <p>Choose a customer from the dropdown above to analyze their lifetime value, purchase patterns, and growth potential.</p>
        </div>
      )}
    </div>
  );
}

export default CustomerLifetimeValue;
