import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ServiceCompletionTrends.css';
import { useLocaleFormatting } from '../../hooks/useLocaleFormatting';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ServiceCompletionTrends = memo(({
  workOrders = [],
  _timeEntries = [],
  dateRange = 'month',
  realTimeEnabled = false,
  onDataExport = null
}) => {
  const { formatDate } = useLocaleFormatting();
  const [viewMode, setViewMode] = useState('trends'); // trends, comparison, efficiency
  const [selectedMetric, setSelectedMetric] = useState('completion_rate');
  const [exportLoading, setExportLoading] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate trend data based on date range
  const calculateTrendData = useCallback(() => {
    if (!workOrders.length) return [];

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

    // Group data by day
    const dailyData = {};

    // Initialize all days with zero values
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: new Date(d),
        total_orders: 0,
        completed_orders: 0,
        in_progress_orders: 0,
        cancelled_orders: 0,
        scheduled_orders: 0,
        total_time: 0,
        avg_completion_time: 0,
        completion_rate: 0,
        efficiency_score: 0
      };
    }

    // Process work orders
    workOrders.forEach(order => {
      const orderDate = new Date(order.created_at || order.start_date);
      const dateKey = orderDate.toISOString().split('T')[0];

      if (dailyData[dateKey]) {
        dailyData[dateKey].total_orders++;

        switch (order.status) {
          case 'completed':
            dailyData[dateKey].completed_orders++;
            break;
          case 'in_progress':
            dailyData[dateKey].in_progress_orders++;
            break;
          case 'cancelled':
            dailyData[dateKey].cancelled_orders++;
            break;
          case 'scheduled':
            dailyData[dateKey].scheduled_orders++;
            break;
        }

        // Calculate completion time if order is completed
        if (order.status === 'completed' && order.end_date) {
          const startTime = new Date(order.start_date || order.created_at);
          const endTime = new Date(order.end_date);
          const completionTime = (endTime - startTime) / (1000 * 60 * 60); // Hours
          dailyData[dateKey].total_time += completionTime;
        }
      }
    });

    // Calculate derived metrics
    Object.values(dailyData).forEach(day => {
      if (day.total_orders > 0) {
        day.completion_rate = (day.completed_orders / day.total_orders) * 100;
        day.avg_completion_time = day.completed_orders > 0 ? day.total_time / day.completed_orders : 0;

        // Efficiency score based on completion rate and time
        const timeScore = Math.max(0, 100 - (day.avg_completion_time / 8) * 100); // 8 hours as baseline
        day.efficiency_score = (day.completion_rate * 0.7) + (timeScore * 0.3);
      }
    });

    return Object.values(dailyData).sort((a, b) => a.date - b.date);
  }, [workOrders, dateRange]);

  // Update trend data when dependencies change
  useEffect(() => {
    setTrendData(calculateTrendData());
  }, [calculateTrendData]);

  // Real-time data refresh
  useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        setTrendData(calculateTrendData());
        if (onDataExport) {
          onDataExport({ type: 'refresh', timestamp: Date.now() });
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeEnabled, calculateTrendData, onDataExport]);

  // Generate line chart data for trends
  const getTrendChartData = useCallback(() => {
    if (!trendData.length) return null;

    const labels = trendData.map(item =>
      formatDate(item.date, { month: 'short', day: 'numeric' })
    );

    const datasets = [];

    if (selectedMetric === 'completion_rate' || selectedMetric === 'all') {
      datasets.push({
        label: 'Completion Rate (%)',
        data: trendData.map(item => item.completion_rate.toFixed(1)),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: selectedMetric === 'completion_rate',
        tension: 0.4,
        yAxisID: 'y'
      });
    }

    if (selectedMetric === 'orders_volume' || selectedMetric === 'all') {
      datasets.push({
        label: 'Total Orders',
        data: trendData.map(item => item.total_orders),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: selectedMetric === 'orders_volume',
        tension: 0.4,
        yAxisID: selectedMetric === 'all' ? 'y1' : 'y'
      });
    }

    if (selectedMetric === 'efficiency_score' || selectedMetric === 'all') {
      datasets.push({
        label: 'Efficiency Score',
        data: trendData.map(item => item.efficiency_score.toFixed(1)),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: selectedMetric === 'efficiency_score',
        tension: 0.4,
        yAxisID: 'y'
      });
    }

    if (selectedMetric === 'avg_completion_time' || selectedMetric === 'all') {
      datasets.push({
        label: 'Avg Completion Time (hrs)',
        data: trendData.map(item => item.avg_completion_time.toFixed(1)),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: selectedMetric === 'avg_completion_time',
        tension: 0.4,
        yAxisID: selectedMetric === 'all' ? 'y1' : 'y'
      });
    }

    return { labels, datasets };
  }, [trendData, selectedMetric]);

  // Generate status breakdown chart
  const getStatusBreakdownData = useCallback(() => {
    if (!trendData.length) return null;

    const totalCompleted = trendData.reduce((sum, day) => sum + day.completed_orders, 0);
    const totalInProgress = trendData.reduce((sum, day) => sum + day.in_progress_orders, 0);
    const totalScheduled = trendData.reduce((sum, day) => sum + day.scheduled_orders, 0);
    const totalCancelled = trendData.reduce((sum, day) => sum + day.cancelled_orders, 0);

    return {
      labels: ['Completed', 'In Progress', 'Scheduled', 'Cancelled'],
      datasets: [{
        data: [totalCompleted, totalInProgress, totalScheduled, totalCancelled],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  }, [trendData]);

  // Performance metrics summary
  const performanceMetrics = useMemo(() => {
    if (!trendData.length) return {};

    const totalOrders = trendData.reduce((sum, day) => sum + day.total_orders, 0);
    const completedOrders = trendData.reduce((sum, day) => sum + day.completed_orders, 0);
    const avgCompletionRate = trendData.reduce((sum, day) => sum + day.completion_rate, 0) / trendData.length;
    const avgEfficiencyScore = trendData.reduce((sum, day) => sum + day.efficiency_score, 0) / trendData.length;
    const avgCompletionTime = trendData
      .filter(day => day.avg_completion_time > 0)
      .reduce((sum, day) => sum + day.avg_completion_time, 0) /
      trendData.filter(day => day.avg_completion_time > 0).length;

    // Trend calculations (comparing first half vs second half of period)
    const midPoint = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, midPoint);
    const secondHalf = trendData.slice(midPoint);

    const firstHalfRate = firstHalf.reduce((sum, day) => sum + day.completion_rate, 0) / firstHalf.length;
    const secondHalfRate = secondHalf.reduce((sum, day) => sum + day.completion_rate, 0) / secondHalf.length;
    const trendDirection = secondHalfRate > firstHalfRate ? 'improving' : 'declining';
    const trendPercent = Math.abs(((secondHalfRate - firstHalfRate) / firstHalfRate) * 100);

    return {
      totalOrders,
      completedOrders,
      avgCompletionRate: avgCompletionRate.toFixed(1),
      avgEfficiencyScore: avgEfficiencyScore.toFixed(1),
      avgCompletionTime: avgCompletionTime.toFixed(1),
      trendDirection,
      trendPercent: trendPercent.toFixed(1)
    };
  }, [trendData]);

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Service Completion Trends Analysis'
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const dayIndex = context[0].dataIndex;
            const dayData = trendData[dayIndex];
            if (dayData) {
              return [
                `Total Orders: ${dayData.total_orders}`,
                `Completed: ${dayData.completed_orders}`,
                `In Progress: ${dayData.in_progress_orders}`,
                `Efficiency: ${dayData.efficiency_score.toFixed(1)}`
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
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: selectedMetric === 'orders_volume' ? 'Number of Orders' :
                selectedMetric === 'avg_completion_time' ? 'Hours' : 'Percentage (%)'
        }
      },
      y1: selectedMetric === 'all' ? {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Orders / Hours'
        },
        grid: {
          drawOnChartArea: false,
        },
      } : undefined
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
        link.download = `service-trends-${Date.now()}.png`;
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
        pdf.save(`service-trends-${Date.now()}.pdf`);
      }

      if (onDataExport) {
        onDataExport({
          type: 'chart_export',
          format,
          data: { trendData, performanceMetrics },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, trendData, performanceMetrics, onDataExport]);

  if (!workOrders.length) {
    return (
      <div className="service-completion-trends">
        <div className="no-data">
          <h3>No Service Data Available</h3>
          <p>Work orders data is required to display service completion trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-completion-trends" ref={containerRef}>
      <div className="chart-header">
        <div className="chart-title">
          <h3>Service Completion Trends</h3>
          <div className="chart-controls">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="view-mode-select"
            >
              <option value="trends">Trend Analysis</option>
              <option value="comparison">Period Comparison</option>
              <option value="efficiency">Efficiency Breakdown</option>
            </select>

            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="metric-select"
            >
              <option value="completion_rate">Completion Rate</option>
              <option value="orders_volume">Orders Volume</option>
              <option value="efficiency_score">Efficiency Score</option>
              <option value="avg_completion_time">Completion Time</option>
              <option value="all">All Metrics</option>
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

      {/* Performance Summary */}
      <div className="performance-summary">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-value">{performanceMetrics.totalOrders}</div>
            <div className="summary-label">Total Orders</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{performanceMetrics.avgCompletionRate}%</div>
            <div className="summary-label">Avg Completion Rate</div>
            <div className={`summary-trend ${performanceMetrics.trendDirection}`}>
              {performanceMetrics.trendDirection === 'improving' ? '↗' : '↘'} {performanceMetrics.trendPercent}%
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{performanceMetrics.avgEfficiencyScore}</div>
            <div className="summary-label">Efficiency Score</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{performanceMetrics.avgCompletionTime}h</div>
            <div className="summary-label">Avg Completion Time</div>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        {viewMode === 'trends' && getTrendChartData() && (
          <div className="chart-wrapper trend-chart">
            <Line
              ref={chartRef}
              data={getTrendChartData()}
              options={lineChartOptions}
            />
          </div>
        )}

        {viewMode === 'comparison' && getStatusBreakdownData() && (
          <div className="comparison-layout">
            <div className="chart-wrapper status-chart">
              <Bar
                data={getStatusBreakdownData()}
                options={{
                  ...lineChartOptions,
                  plugins: {
                    ...lineChartOptions.plugins,
                    title: { display: true, text: 'Order Status Breakdown' }
                  }
                }}
              />
            </div>
          </div>
        )}

        {viewMode === 'efficiency' && (
          <div className="efficiency-breakdown">
            <h4>Efficiency Analysis</h4>
            <div className="efficiency-metrics">
              {trendData.slice(-7).map((day, index) => (
                <div key={index} className="efficiency-day">
                  <div className="day-label">
                    {formatDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="efficiency-bar">
                    <div
                      className="efficiency-fill"
                      style={{ width: `${Math.min(100, day.efficiency_score)}%` }}
                    ></div>
                    <span className="efficiency-text">{day.efficiency_score.toFixed(0)}</span>
                  </div>
                  <div className="day-stats">
                    <span>Orders: {day.total_orders}</span>
                    <span>Rate: {day.completion_rate.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
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

ServiceCompletionTrends.displayName = 'ServiceCompletionTrends';

export default ServiceCompletionTrends;
