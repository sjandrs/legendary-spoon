import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CustomerSatisfactionMetrics.css';
import { useLocaleFormatting } from '../../hooks/useLocaleFormatting';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CustomerSatisfactionMetrics = memo(({
  workOrders = [],
  feedbackData = [],
  _timeEntries = [],
  dateRange = 'month',
  realTimeEnabled = false,
  onDataExport = null
}) => {
  const { formatDate } = useLocaleFormatting();
  const [viewMode, setViewMode] = useState('overview'); // overview, trends, detailed, nps
  const [_selectedMetric, _setSelectedMetric] = useState('overall_satisfaction');
  const [exportLoading, setExportLoading] = useState(false);
  const [satisfactionData, setSatisfactionData] = useState([]);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Generate mock satisfaction data if feedbackData is empty
  const generateMockFeedbackData = useCallback(() => {
    if (feedbackData.length > 0) return feedbackData;

    // Generate realistic feedback data based on work orders
    return workOrders.map((order, index) => {
      const baseRating = 3.5 + (Math.random() * 1.5); // 3.5 - 5.0 range
      const responseTime = Math.random() * 24; // 0-24 hours
      const serviceQuality = baseRating + (Math.random() * 0.5 - 0.25);
      const communication = baseRating + (Math.random() * 0.5 - 0.25);
      const timeliness = Math.max(1, baseRating - (responseTime / 24) * 2);

      return {
        id: `feedback_${index}`,
        workOrderId: order.id,
        orderId: order.id,
        overallRating: Math.min(5, Math.max(1, baseRating)),
        serviceQualityRating: Math.min(5, Math.max(1, serviceQuality)),
        communicationRating: Math.min(5, Math.max(1, communication)),
        timelinessRating: Math.min(5, Math.max(1, timeliness)),
        npsScore: Math.floor(Math.random() * 11), // 0-10 NPS scale
        comments: [
          'Great service, very professional!',
          'Quick response time and quality work.',
          'Technician was knowledgeable and helpful.',
          'Could improve on communication.',
          'Excellent overall experience.',
          'Service was satisfactory.',
          'Very impressed with the quality of work.'
        ][Math.floor(Math.random() * 7)],
        submittedDate: order.end_date || order.created_at,
        technician: order.assigned_to,
        customerName: order.customer || `Customer ${index + 1}`,
        serviceType: order.service_type || 'General Service'
      };
    });
  }, [feedbackData, workOrders]);

  // Calculate satisfaction metrics
  const calculateSatisfactionMetrics = useCallback(() => {
    const mockFeedback = generateMockFeedbackData();
    if (!mockFeedback.length) return [];

    const now = new Date();
    let startDate;

    switch (dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Group by day
    const dailyMetrics = {};

    // Initialize all days
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyMetrics[dateKey] = {
        date: new Date(d),
        totalFeedback: 0,
        averageRating: 0,
        serviceQuality: 0,
        communication: 0,
        timeliness: 0,
        npsScore: 0,
        promoters: 0,
        detractors: 0,
        passives: 0,
        ratings: []
      };
    }

    // Process feedback data
    mockFeedback.forEach(feedback => {
      const feedbackDate = new Date(feedback.submittedDate);
      const dateKey = feedbackDate.toISOString().split('T')[0];

      if (dailyMetrics[dateKey]) {
        dailyMetrics[dateKey].totalFeedback++;
        dailyMetrics[dateKey].ratings.push({
          overall: feedback.overallRating,
          serviceQuality: feedback.serviceQualityRating,
          communication: feedback.communicationRating,
          timeliness: feedback.timelinessRating,
          nps: feedback.npsScore
        });
      }
    });

    // Calculate averages and NPS
    Object.values(dailyMetrics).forEach(day => {
      if (day.ratings.length > 0) {
        day.averageRating = day.ratings.reduce((sum, r) => sum + r.overall, 0) / day.ratings.length;
        day.serviceQuality = day.ratings.reduce((sum, r) => sum + r.serviceQuality, 0) / day.ratings.length;
        day.communication = day.ratings.reduce((sum, r) => sum + r.communication, 0) / day.ratings.length;
        day.timeliness = day.ratings.reduce((sum, r) => sum + r.timeliness, 0) / day.ratings.length;

        // Calculate NPS
        const npsScores = day.ratings.map(r => r.nps);
        day.promoters = npsScores.filter(score => score >= 9).length;
        day.detractors = npsScores.filter(score => score <= 6).length;
        day.passives = npsScores.filter(score => score === 7 || score === 8).length;

        if (day.totalFeedback > 0) {
          day.npsScore = ((day.promoters - day.detractors) / day.totalFeedback) * 100;
        }
      }
    });

    return Object.values(dailyMetrics).sort((a, b) => a.date - b.date);
  }, [generateMockFeedbackData, dateRange]);

  // Update satisfaction data when dependencies change
  useEffect(() => {
    setSatisfactionData(calculateSatisfactionMetrics());
  }, [calculateSatisfactionMetrics]);

  // Real-time data refresh
  useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        setSatisfactionData(calculateSatisfactionMetrics());
        if (onDataExport) {
          onDataExport({ type: 'refresh', timestamp: Date.now() });
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [realTimeEnabled, calculateSatisfactionMetrics, onDataExport]);

  // Generate chart data based on view mode
  const getChartData = useCallback(() => {
    if (!satisfactionData.length) return null;

    const labels = satisfactionData
      .filter(day => day.totalFeedback > 0)
      .map(day => formatDate(day.date, { month: 'short', day: 'numeric' }));

    switch (viewMode) {
      case 'overview':
        return {
          labels,
          datasets: [{
            label: 'Overall Satisfaction',
            data: satisfactionData
              .filter(day => day.totalFeedback > 0)
              .map(day => day.averageRating.toFixed(2)),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };

      case 'trends':
        return {
          labels,
          datasets: [
            {
              label: 'Service Quality',
              data: satisfactionData
                .filter(day => day.totalFeedback > 0)
                .map(day => day.serviceQuality.toFixed(2)),
              borderColor: 'rgba(16, 185, 129, 1)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4
            },
            {
              label: 'Communication',
              data: satisfactionData
                .filter(day => day.totalFeedback > 0)
                .map(day => day.communication.toFixed(2)),
              borderColor: 'rgba(245, 158, 11, 1)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4
            },
            {
              label: 'Timeliness',
              data: satisfactionData
                .filter(day => day.totalFeedback > 0)
                .map(day => day.timeliness.toFixed(2)),
              borderColor: 'rgba(139, 92, 246, 1)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4
            }
          ]
        };

      case 'nps':
        return {
          labels,
          datasets: [{
            label: 'NPS Score',
            data: satisfactionData
              .filter(day => day.totalFeedback > 0)
              .map(day => day.npsScore.toFixed(1)),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };

      default:
        return null;
    }
  }, [satisfactionData, viewMode]);

  // Generate NPS distribution data
  const getNPSDistributionData = useCallback(() => {
    if (!satisfactionData.length) return null;

    const totalPromoters = satisfactionData.reduce((sum, day) => sum + day.promoters, 0);
    const totalPassives = satisfactionData.reduce((sum, day) => sum + day.passives, 0);
    const totalDetractors = satisfactionData.reduce((sum, day) => sum + day.detractors, 0);

    return {
      labels: ['Promoters (9-10)', 'Passives (7-8)', 'Detractors (0-6)'],
      datasets: [{
        data: [totalPromoters, totalPassives, totalDetractors],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  }, [satisfactionData]);

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!satisfactionData.length) return {};

    const daysWithFeedback = satisfactionData.filter(day => day.totalFeedback > 0);
    if (!daysWithFeedback.length) return {};

    const totalFeedback = daysWithFeedback.reduce((sum, day) => sum + day.totalFeedback, 0);
    const avgRating = daysWithFeedback.reduce((sum, day) => sum + day.averageRating, 0) / daysWithFeedback.length;
    const avgServiceQuality = daysWithFeedback.reduce((sum, day) => sum + day.serviceQuality, 0) / daysWithFeedback.length;
    const avgCommunication = daysWithFeedback.reduce((sum, day) => sum + day.communication, 0) / daysWithFeedback.length;
    const avgTimeliness = daysWithFeedback.reduce((sum, day) => sum + day.timeliness, 0) / daysWithFeedback.length;
    const avgNPS = daysWithFeedback.reduce((sum, day) => sum + day.npsScore, 0) / daysWithFeedback.length;

    return {
      totalFeedback,
      avgRating: avgRating.toFixed(2),
      avgServiceQuality: avgServiceQuality.toFixed(2),
      avgCommunication: avgCommunication.toFixed(2),
      avgTimeliness: avgTimeliness.toFixed(2),
      avgNPS: avgNPS.toFixed(1)
    };
  }, [satisfactionData]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Customer Satisfaction Analysis'
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dayIndex = context[0].dataIndex;
            const daysWithFeedback = satisfactionData.filter(day => day.totalFeedback > 0);
            const dayData = daysWithFeedback[dayIndex];
            if (dayData) {
              return [
                `Total Feedback: ${dayData.totalFeedback}`,
                `NPS Score: ${dayData.npsScore.toFixed(1)}`,
                `Promoters: ${dayData.promoters}`,
                `Detractors: ${dayData.detractors}`
              ];
            }
            return [];
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
        min: viewMode === 'nps' ? -100 : 0,
        max: viewMode === 'nps' ? 100 : 5,
        title: {
          display: true,
          text: viewMode === 'nps' ? 'NPS Score' : 'Rating (1-5)'
        }
      }
    }
  };

  // Export functionality
  const exportChart = useCallback(async (format = 'png') => {
    if (!containerRef.current || exportLoading) return;

    setExportLoading(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `customer-satisfaction-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`customer-satisfaction-${Date.now()}.pdf`);
      }

      if (onDataExport) {
        onDataExport({
          type: 'chart_export',
          format,
          data: { satisfactionData, summaryStats },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, satisfactionData, summaryStats, onDataExport]);

  if (!workOrders.length) {
    return (
      <div className="customer-satisfaction-metrics">
        <div className="no-data">
          <h3>No Customer Feedback Data Available</h3>
          <p>Complete work orders and customer feedback are required to display satisfaction metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-satisfaction-metrics" ref={containerRef}>
      <div className="chart-header">
        <div className="chart-title">
          <h3>Customer Satisfaction Metrics</h3>
          <div className="chart-controls">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="view-mode-select"
            >
              <option value="overview">Overall Satisfaction</option>
              <option value="trends">Detailed Metrics</option>
              <option value="nps">NPS Analysis</option>
              <option value="detailed">Detailed Breakdown</option>
            </select>

            <div className="export-controls">
              <button
                onClick={() => exportChart('png')}
                disabled={exportLoading}
                className="export-btn"
                title="Export as PNG"
              >
                📷 PNG
              </button>
              <button
                onClick={() => exportChart('pdf')}
                disabled={exportLoading}
                className="export-btn"
                title="Export as PDF"
              >
                📄 PDF
              </button>
            </div>

            {realTimeEnabled && (
              <div className="real-time-indicator">
                <span className="status-dot active"></span>
                Live Data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="satisfaction-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-value">{summaryStats.totalFeedback || 0}</div>
            <div className="summary-label">Total Feedback</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summaryStats.avgRating || 'N/A'}</div>
            <div className="summary-label">Avg Rating</div>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`star ${star <= Math.round(parseFloat(summaryStats.avgRating || 0)) ? 'filled' : ''}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summaryStats.avgNPS || 'N/A'}</div>
            <div className="summary-label">NPS Score</div>
            <div className={`nps-indicator ${parseFloat(summaryStats.avgNPS || 0) >= 50 ? 'excellent' : parseFloat(summaryStats.avgNPS || 0) >= 0 ? 'good' : 'poor'}`}>
              {parseFloat(summaryStats.avgNPS || 0) >= 50 ? 'Excellent' : parseFloat(summaryStats.avgNPS || 0) >= 0 ? 'Good' : 'Needs Improvement'}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summaryStats.avgServiceQuality || 'N/A'}</div>
            <div className="summary-label">Service Quality</div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        {viewMode === 'detailed' && getNPSDistributionData() && (
          <div className="detailed-layout">
            <div className="chart-wrapper nps-distribution">
              <h4>NPS Distribution</h4>
              <Doughnut
                data={getNPSDistributionData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
            <div className="metrics-breakdown">
              <h4>Metrics Breakdown</h4>
              <div className="metric-item">
                <span className="metric-name">Service Quality</span>
                <div className="metric-bar">
                  <div
                    className="metric-fill service-quality"
                    style={{ width: `${(parseFloat(summaryStats.avgServiceQuality || 0) / 5) * 100}%` }}
                  ></div>
                  <span className="metric-value">{summaryStats.avgServiceQuality}</span>
                </div>
              </div>
              <div className="metric-item">
                <span className="metric-name">Communication</span>
                <div className="metric-bar">
                  <div
                    className="metric-fill communication"
                    style={{ width: `${(parseFloat(summaryStats.avgCommunication || 0) / 5) * 100}%` }}
                  ></div>
                  <span className="metric-value">{summaryStats.avgCommunication}</span>
                </div>
              </div>
              <div className="metric-item">
                <span className="metric-name">Timeliness</span>
                <div className="metric-bar">
                  <div
                    className="metric-fill timeliness"
                    style={{ width: `${(parseFloat(summaryStats.avgTimeliness || 0) / 5) * 100}%` }}
                  ></div>
                  <span className="metric-value">{summaryStats.avgTimeliness}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode !== 'detailed' && getChartData() && (
          <div className="chart-wrapper main-chart">
            <Line
              ref={chartRef}
              data={getChartData()}
              options={chartOptions}
            />
          </div>
        )}
      </div>

      {exportLoading && (
        <div className="export-overlay">
          <div className="export-spinner"></div>
          <p>Generating export...</p>
        </div>
      )}
    </div>
  );
});

CustomerSatisfactionMetrics.displayName = 'CustomerSatisfactionMetrics';

export default CustomerSatisfactionMetrics;
