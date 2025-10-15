/**
 * Interactive Visualization Components
 * Advanced chart interactions, export functionality, and real-time data updates
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { FieldServiceAnalytics } from '../../utils/analytics-calculations';
import './InteractiveVisualization.css';

// Export utilities
const ExportUtils = {
  // Export chart data as CSV
  exportToCSV: (data, filename) => {
    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  // Export chart as image
  exportToImage: (canvasRef, filename, format = 'png') => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const url = canvas.toDataURL(`image/${format}`);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
  },

  // Export data as JSON
  exportToJSON: (data, filename) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};

// Interactive Bar Chart Component
const InteractiveBarChart = ({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  onDataPointClick,
  exportEnabled = true
}) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  // Calculate chart dimensions and scales
  const chartDimensions = useMemo(() => {
    const padding = 60;
    const width = 800;
    const height = 400;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;

    return {
      width,
      height,
      padding,
      chartWidth: width - (padding * 2),
      chartHeight: height - (padding * 2),
      maxValue,
      minValue,
      range,
      barWidth: (width - (padding * 2)) / data.length * 0.8
    };
  }, [data]);

  // Handle bar interactions
  const handleBarClick = useCallback((dataPoint, index) => {
    setSelectedBar(index);
    if (onDataPointClick) {
      onDataPointClick(dataPoint, index);
    }
  }, [onDataPointClick]);

  const handleBarHover = useCallback((event, dataPoint, _index) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      show: true,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
      content: `${dataPoint.label}: ${dataPoint.value.toLocaleString()}`
    });
  }, []);

  const handleBarLeave = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    ExportUtils.exportToCSV(data, `${title}-bar-chart`);
  }, [data, title]);

  const handleExportImage = useCallback(() => {
    ExportUtils.exportToImage(canvasRef, `${title}-bar-chart`);
  }, [title]);

  const handleExportJSON = useCallback(() => {
    ExportUtils.exportToJSON(data, `${title}-bar-chart`);
  }, [data, title]);

  return (
    <div className="interactive-chart-container">
      <div className="chart-header">
        <h3>{title}</h3>
        {exportEnabled && (
          <div className="export-controls">
            <button onClick={handleExportCSV} className="export-btn csv">
              📊 CSV
            </button>
            <button onClick={handleExportImage} className="export-btn image">
              📷 PNG
            </button>
            <button onClick={handleExportJSON} className="export-btn json">
              📄 JSON
            </button>
          </div>
        )}
      </div>

      <div className="chart-wrapper" ref={chartRef}>
        <svg
          width={chartDimensions.width}
          height={chartDimensions.height}
          ref={canvasRef}
          className="interactive-chart"
        >
          {/* Chart background */}
          <rect
            width={chartDimensions.width}
            height={chartDimensions.height}
            fill="#f8f9fa"
            rx="8"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={ratio}
              x1={chartDimensions.padding}
              y1={chartDimensions.padding + (chartDimensions.chartHeight * ratio)}
              x2={chartDimensions.width - chartDimensions.padding}
              y2={chartDimensions.padding + (chartDimensions.chartHeight * ratio)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const value = chartDimensions.maxValue * (1 - ratio);
            return (
              <text
                key={ratio}
                x={chartDimensions.padding - 10}
                y={chartDimensions.padding + (chartDimensions.chartHeight * ratio) + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toLocaleString()}
              </text>
            );
          })}

          {/* Bars */}
          {data.map((dataPoint, index) => {
            const barHeight = (dataPoint.value / chartDimensions.maxValue) * chartDimensions.chartHeight;
            const x = chartDimensions.padding + (index * (chartDimensions.chartWidth / data.length));
            const y = chartDimensions.height - chartDimensions.padding - barHeight;
            const isSelected = selectedBar === index;

            return (
              <g key={index}>
                <rect
                  x={x + ((chartDimensions.chartWidth / data.length) - chartDimensions.barWidth) / 2}
                  y={y}
                  width={chartDimensions.barWidth}
                  height={barHeight}
                  fill={isSelected ? '#3b82f6' : '#60a5fa'}
                  stroke={isSelected ? '#1e40af' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                  className="interactive-bar"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleBarClick(dataPoint, index)}
                  onMouseEnter={(e) => handleBarHover(e, dataPoint, index)}
                  onMouseLeave={handleBarLeave}
                />

                {/* Bar label */}
                <text
                  x={x + (chartDimensions.chartWidth / data.length) / 2}
                  y={chartDimensions.height - chartDimensions.padding + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  className="bar-label"
                >
                  {dataPoint.label}
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={chartDimensions.width / 2}
            y={chartDimensions.height - 10}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="#111827"
          >
            {xAxisLabel}
          </text>

          <text
            x={20}
            y={chartDimensions.height / 2}
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="#111827"
            transform={`rotate(-90, 20, ${chartDimensions.height / 2})`}
          >
            {yAxisLabel}
          </text>
        </svg>

        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="chart-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Chart Statistics */}
      <div className="chart-statistics">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">
            {data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average</span>
          <span className="stat-value">
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max</span>
          <span className="stat-value">
            {Math.max(...data.map(d => d.value)).toLocaleString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min</span>
          <span className="stat-value">
            {Math.min(...data.map(d => d.value)).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Interactive Line Chart Component
const InteractiveLineChart = ({
  data,
  title,
  _xAxisLabel,
  _yAxisLabel,
  onDataPointClick,
  exportEnabled = true,
  showTrendline = false
}) => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });

  const chartDimensions = useMemo(() => {
    const padding = 60;
    const width = 800;
    const height = 400;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    return {
      width,
      height,
      padding,
      chartWidth: width - (padding * 2),
      chartHeight: height - (padding * 2),
      maxValue,
      minValue,
      xStep: (width - (padding * 2)) / (data.length - 1),
      yScale: (height - (padding * 2)) / (maxValue - minValue)
    };
  }, [data]);

  // Generate SVG path for line
  const linePath = useMemo(() => {
    if (data.length === 0) return '';

    return data.map((point, index) => {
      const x = chartDimensions.padding + (index * chartDimensions.xStep);
      const y = chartDimensions.height - chartDimensions.padding -
                ((point.value - chartDimensions.minValue) * chartDimensions.yScale);

      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  }, [data, chartDimensions]);

  // Calculate trendline if enabled
  const trendlinePath = useMemo(() => {
    if (!showTrendline || data.length < 2) return '';

    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + (i * d.value), 0);
    const sumXX = data.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const startY = intercept;
    const endY = slope * (data.length - 1) + intercept;

    const startX = chartDimensions.padding;
    const startYPos = chartDimensions.height - chartDimensions.padding -
                     ((startY - chartDimensions.minValue) * chartDimensions.yScale);
    const endX = chartDimensions.width - chartDimensions.padding;
    const endYPos = chartDimensions.height - chartDimensions.padding -
                   ((endY - chartDimensions.minValue) * chartDimensions.yScale);

    return `M ${startX} ${startYPos} L ${endX} ${endYPos}`;
  }, [data, chartDimensions, showTrendline]);

  const handlePointClick = useCallback((dataPoint, index) => {
    setSelectedPoint(index);
    if (onDataPointClick) {
      onDataPointClick(dataPoint, index);
    }
  }, [onDataPointClick]);

  const handlePointHover = useCallback((event, dataPoint, _index) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      show: true,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
      content: `${dataPoint.label}: ${dataPoint.value.toLocaleString()}`
    });
  }, []);

  const handlePointLeave = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, content: '' });
  }, []);

  return (
    <div className="interactive-chart-container">
      <div className="chart-header">
        <h3>{title}</h3>
        <div className="chart-controls">
          {exportEnabled && (
            <div className="export-controls">
              <button onClick={() => ExportUtils.exportToCSV(data, `${title}-line-chart`)} className="export-btn csv">
                📊 CSV
              </button>
              <button onClick={() => ExportUtils.exportToImage(canvasRef, `${title}-line-chart`)} className="export-btn image">
                📷 PNG
              </button>
              <button onClick={() => ExportUtils.exportToJSON(data, `${title}-line-chart`)} className="export-btn json">
                📄 JSON
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="chart-wrapper" ref={chartRef}>
        <svg
          width={chartDimensions.width}
          height={chartDimensions.height}
          ref={canvasRef}
          className="interactive-chart"
        >
          {/* Chart background */}
          <rect
            width={chartDimensions.width}
            height={chartDimensions.height}
            fill="#f8f9fa"
            rx="8"
          />

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <line
              key={`h-${ratio}`}
              x1={chartDimensions.padding}
              y1={chartDimensions.padding + (chartDimensions.chartHeight * ratio)}
              x2={chartDimensions.width - chartDimensions.padding}
              y2={chartDimensions.padding + (chartDimensions.chartHeight * ratio)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Trendline */}
          {showTrendline && trendlinePath && (
            <path
              d={trendlinePath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}

          {/* Data points */}
          {data.map((dataPoint, index) => {
            const x = chartDimensions.padding + (index * chartDimensions.xStep);
            const y = chartDimensions.height - chartDimensions.padding -
                     ((dataPoint.value - chartDimensions.minValue) * chartDimensions.yScale);
            const isSelected = selectedPoint === index;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={isSelected ? 8 : 5}
                fill={isSelected ? '#1e40af' : '#3b82f6'}
                stroke="white"
                strokeWidth="2"
                className="interactive-point"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handlePointClick(dataPoint, index)}
                onMouseEnter={(e) => handlePointHover(e, dataPoint, index)}
                onMouseLeave={handlePointLeave}
              />
            );
          })}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const value = chartDimensions.minValue +
                         ((chartDimensions.maxValue - chartDimensions.minValue) * (1 - ratio));
            return (
              <text
                key={ratio}
                x={chartDimensions.padding - 10}
                y={chartDimensions.padding + (chartDimensions.chartHeight * ratio) + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                {value.toLocaleString()}
              </text>
            );
          })}

          {/* X-axis labels */}
          {data.map((dataPoint, index) => {
            if (index % Math.ceil(data.length / 8) === 0) {
              const x = chartDimensions.padding + (index * chartDimensions.xStep);
              return (
                <text
                  key={index}
                  x={x}
                  y={chartDimensions.height - chartDimensions.padding + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  className="axis-label"
                >
                  {dataPoint.label}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="chart-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    </div>
  );
};

// Main Interactive Visualization Dashboard
const InteractiveVisualizationDashboard = ({
  workOrders = [],
  timeEntries = [],
  expenses = [],
  realTimeEnabled = false
}) => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState('30days');

  // Process data for visualizations
  const chartData = useMemo(() => {
    const revenueByMonth = FieldServiceAnalytics.calculateRevenueMetrics(workOrders, expenses, timeEntries);
    const utilizationData = FieldServiceAnalytics.calculateTechnicianUtilization(timeEntries, workOrders);

    // Mock data for demonstration
    const monthlyRevenue = [
      { label: 'Jan', value: 45000 },
      { label: 'Feb', value: 52000 },
      { label: 'Mar', value: 48000 },
      { label: 'Apr', value: 61000 },
      { label: 'May', value: 55000 },
      { label: 'Jun', value: 67000 }
    ];

    const technicianPerformance = [
      { label: 'Tech A', value: 85 },
      { label: 'Tech B', value: 92 },
      { label: 'Tech C', value: 78 },
      { label: 'Tech D', value: 88 },
      { label: 'Tech E', value: 95 }
    ];

    return {
      monthlyRevenue,
      technicianPerformance,
      revenueByMonth,
      utilizationData
    };
  }, [workOrders, timeEntries, expenses]);

  const handleDataPointClick = useCallback((dataPoint, index) => {
    console.log('Data point clicked:', dataPoint, 'at index:', index);
    // Add custom logic for data point interactions
  }, []);

  const tabs = [
    { id: 'revenue', label: 'Revenue Analysis', icon: '💰' },
    { id: 'performance', label: 'Performance Metrics', icon: '📊' },
    { id: 'trends', label: 'Trend Analysis', icon: '📈' }
  ];

  return (
    <div className="interactive-visualization-dashboard">
      <div className="dashboard-header">
        <h2>Interactive Analytics Dashboard</h2>
        <div className="dashboard-controls">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="365days">Last Year</option>
          </select>
          {realTimeEnabled && (
            <div className="real-time-indicator">
              <span className="indicator-dot"></span>
              Live Updates
            </div>
          )}
        </div>
      </div>

      <div className="visualization-tabs">
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

      <div className="visualization-content">
        {activeTab === 'revenue' && (
          <div className="charts-row">
            <InteractiveBarChart
              data={chartData.monthlyRevenue}
              title="Monthly Revenue"
              xAxisLabel="Month"
              yAxisLabel="Revenue ($)"
              onDataPointClick={handleDataPointClick}
              exportEnabled={true}
            />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="charts-row">
            <InteractiveBarChart
              data={chartData.technicianPerformance}
              title="Technician Performance Scores"
              xAxisLabel="Technician"
              yAxisLabel="Performance Score (%)"
              onDataPointClick={handleDataPointClick}
              exportEnabled={true}
            />
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="charts-row">
            <InteractiveLineChart
              data={chartData.monthlyRevenue}
              title="Revenue Trend Analysis"
              xAxisLabel="Month"
              yAxisLabel="Revenue ($)"
              onDataPointClick={handleDataPointClick}
              exportEnabled={true}
              showTrendline={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveVisualizationDashboard;
export { InteractiveBarChart, InteractiveLineChart, ExportUtils };
