import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './DealPredictions.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function DealPredictions() {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(dealId || '');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    if (selectedDealId) {
      fetchPrediction(selectedDealId);
    }
  }, [selectedDealId]);

  const fetchDeals = async () => {
    try {
      const response = await api.get('/api/deals/');
      setDeals(response.data.results || response.data);
    } catch (_err) {
      console.error('Error fetching deals:', _err);
    }
  };

  const fetchPrediction = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/analytics/predict/${id}/`);
      setPrediction(response.data);
    } catch (_err) {
      setError(_err.response?.data?.error || 'Failed to load prediction');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDealChange = (e) => {
    const newDealId = e.target.value;
    setSelectedDealId(newDealId);
    if (newDealId) {
      navigate(`/analytics/deal-predictions/${newDealId}`);
    }
  };

  const getPredictionColor = (outcome) => {
    switch (outcome) {
      case 'win': return '#10b981';
      case 'loss': return '#ef4444';
      case 'stalled': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPredictionIcon = (outcome) => {
    switch (outcome) {
      case 'win': return '✓';
      case 'loss': return '✗';
      case 'stalled': return '⏸';
      default: return '?';
    }
  };

  const renderPredictionChart = () => {
    if (!prediction) return null;

    const data = {
      labels: ['Win Probability', 'Loss Probability', 'Stall Probability'],
      datasets: [
        {
          data: [
            prediction.win_probability || 0,
            prediction.loss_probability || 0,
            prediction.stall_probability || 0,
          ],
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
          borderColor: ['#059669', '#dc2626', '#d97706'],
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed.toFixed(1)}%`;
            },
          },
        },
      },
    };

    return (
      <div className="prediction-chart">
        <Pie data={data} options={options} />
      </div>
    );
  };

  const renderFactorsChart = () => {
    if (!prediction?.factors) return null;

    const factors = prediction.factors;
    const labels = Object.keys(factors).map(key => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    const values = Object.values(factors);

    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Impact Score',
          data: values,
          backgroundColor: values.map(v => v >= 0 ? '#10b981' : '#ef4444'),
          borderColor: values.map(v => v >= 0 ? '#059669' : '#dc2626'),
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
              const value = context.parsed.x;
              return `Impact: ${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="factors-chart">
        <h3>Key Factors Influencing Prediction</h3>
        <Bar data={data} options={options} />
      </div>
    );
  };

  return (
    <div className="deal-predictions">
      <div className="predictions-header">
        <h1>💡 Deal Predictions</h1>
        <p>AI-powered predictions for deal outcomes based on historical data and current deal characteristics</p>
      </div>

      <div className="deal-selector">
        <label htmlFor="deal-select">Select Deal:</label>
        <select
          id="deal-select"
          value={selectedDealId}
          onChange={handleDealChange}
          className="form-select"
        >
          <option value="">-- Select a deal --</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.name} - ${deal.value?.toLocaleString() || 0} ({deal.stage_display || deal.stage})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing deal data and generating predictions...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && prediction && (
        <div className="prediction-results">
          <div className="prediction-summary">
            <div className="prediction-card main-prediction" style={{ borderColor: getPredictionColor(prediction.predicted_outcome) }}>
              <div className="prediction-icon" style={{ backgroundColor: getPredictionColor(prediction.predicted_outcome) }}>
                {getPredictionIcon(prediction.predicted_outcome)}
              </div>
              <div className="prediction-details">
                <h2>Predicted Outcome</h2>
                <p className="outcome-label">{prediction.predicted_outcome?.toUpperCase()}</p>
                <p className="confidence-label">
                  Confidence: <strong>{prediction.confidence_score?.toFixed(1)}%</strong>
                </p>
              </div>
            </div>

            <div className="prediction-card">
              <h3>Win Probability</h3>
              <div className="probability-bar">
                <div
                  className="probability-fill win"
                  style={{ width: `${prediction.win_probability || 0}%` }}
                ></div>
              </div>
              <p className="probability-value">{prediction.win_probability?.toFixed(1) || 0}%</p>
            </div>

            <div className="prediction-card">
              <h3>Loss Probability</h3>
              <div className="probability-bar">
                <div
                  className="probability-fill loss"
                  style={{ width: `${prediction.loss_probability || 0}%` }}
                ></div>
              </div>
              <p className="probability-value">{prediction.loss_probability?.toFixed(1) || 0}%</p>
            </div>

            <div className="prediction-card">
              <h3>Stall Probability</h3>
              <div className="probability-bar">
                <div
                  className="probability-fill stall"
                  style={{ width: `${prediction.stall_probability || 0}%` }}
                ></div>
              </div>
              <p className="probability-value">{prediction.stall_probability?.toFixed(1) || 0}%</p>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card">
              <h3>Probability Distribution</h3>
              {renderPredictionChart()}
            </div>

            {prediction.factors && (
              <div className="chart-card">
                {renderFactorsChart()}
              </div>
            )}
          </div>

          {prediction.recommendation && (
            <div className="recommendation-card">
              <h3>📋 Recommendation</h3>
              <p>{prediction.recommendation}</p>
            </div>
          )}

          {prediction.deal_info && (
            <div className="deal-info-card">
              <h3>Deal Information</h3>
              <div className="deal-info-grid">
                <div className="info-item">
                  <span className="info-label">Deal Name:</span>
                  <span className="info-value">{prediction.deal_info.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Value:</span>
                  <span className="info-value">${prediction.deal_info.value?.toLocaleString() || 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Stage:</span>
                  <span className="info-value">{prediction.deal_info.stage_display}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Owner:</span>
                  <span className="info-value">{prediction.deal_info.owner_name}</span>
                </div>
                {prediction.deal_info.expected_close_date && (
                  <div className="info-item">
                    <span className="info-label">Expected Close:</span>
                    <span className="info-value">
                      {new Date(prediction.deal_info.expected_close_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="prediction-metadata">
            <p className="metadata-item">
              <strong>Model Version:</strong> {prediction.model_version || 'v1.0'}
            </p>
            <p className="metadata-item">
              <strong>Generated:</strong> {new Date(prediction.prediction_date || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && !prediction && selectedDealId && (
        <div className="empty-state">
          <p>No prediction available for this deal. The AI model may need more historical data to generate accurate predictions.</p>
        </div>
      )}

      {!selectedDealId && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Select a Deal to View Predictions</h3>
          <p>Choose a deal from the dropdown above to see AI-powered outcome predictions and insights.</p>
        </div>
      )}
    </div>
  );
}

export default DealPredictions;
