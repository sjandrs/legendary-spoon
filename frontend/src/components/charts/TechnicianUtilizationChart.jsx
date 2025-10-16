import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './TechnicianUtilizationChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TechnicianUtilizationChart = memo(({
  technicians = [],
  timeEntries = [],
  workOrders = [],
  _dateRange = 'week',
  realTimeEnabled = false,
  onDataExport = null
}) => {
  const [viewMode, setViewMode] = useState('utilization'); // utilization, performance, comparison
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshInterval, _setRefreshInterval] = useState(null);
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  // Real-time data refresh
  useEffect(() => {
    if (realTimeEnabled && refreshInterval) {
      const interval = setInterval(() => {
        // Trigger parent component to refresh data
        if (onDataExport) {
          onDataExport({ type: 'refresh', timestamp: Date.now() });
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeEnabled, refreshInterval, onDataExport]);

  // Calculate technician utilization metrics
  const utilizationMetrics = useMemo(() => {
    if (!technicians.length || !timeEntries.length) return {};

    const metrics = {};

    technicians.forEach(tech => {
      const techTimeEntries = timeEntries.filter(entry => entry.user === tech.user);
      const techWorkOrders = workOrders.filter(wo => wo.assigned_to === tech.user);

      const totalHours = techTimeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const billableHours = techTimeEntries
        .filter(entry => entry.billable)
        .reduce((sum, entry) => sum + (entry.hours || 0), 0);

      const completedOrders = techWorkOrders.filter(wo => wo.status === 'completed').length;
      const totalOrders = techWorkOrders.length;

      const avgResponseTime = techWorkOrders.reduce((sum, wo) => {
        if (wo.created_at && wo.start_date) {
          const responseTime = new Date(wo.start_date) - new Date(wo.created_at);
          return sum + (responseTime / (1000 * 60 * 60)); // Convert to hours
        }
        return sum;
      }, 0) / (techWorkOrders.length || 1);

      metrics[tech.id] = {
        name: `${tech.first_name} ${tech.last_name}`,
        utilization: totalHours > 0 ? (billableHours / totalHours * 100).toFixed(1) : 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders * 100).toFixed(1) : 0,
        totalHours: totalHours.toFixed(1),
        billableHours: billableHours.toFixed(1),
        avgResponseTime: avgResponseTime.toFixed(1),
        productivityScore: ((billableHours / (totalHours || 1)) * 0.4 +
                          (completedOrders / (totalOrders || 1)) * 0.6) * 100,
        efficiency: totalOrders > 0 ? (totalHours / totalOrders).toFixed(1) : 0
      };
    });

    return metrics;
  }, [technicians, timeEntries, workOrders]);

  // Generate utilization chart data
  const getUtilizationChartData = useCallback(() => {
    const labels = Object.values(utilizationMetrics).map(metric => metric.name);
    const utilizationData = Object.values(utilizationMetrics).map(metric => parseFloat(metric.utilization));
    const completionData = Object.values(utilizationMetrics).map(metric => parseFloat(metric.completionRate));

    return {
      labels,
      datasets: [
        {
          label: 'Utilization Rate (%)',
          data: utilizationData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Completion Rate (%)',
          data: completionData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          type: 'line',
          yAxisID: 'y1'
        }
      ]
    };
  }, [utilizationMetrics]);

  // Generate performance comparison radar chart
  const getPerformanceRadarData = useCallback(() => {
    if (selectedTechnician === 'all') {
      const avgMetrics = {
        utilization: Object.values(utilizationMetrics).reduce((sum, m) => sum + parseFloat(m.utilization), 0) / Object.keys(utilizationMetrics).length || 0,
        completionRate: Object.values(utilizationMetrics).reduce((sum, m) => sum + parseFloat(m.completionRate), 0) / Object.keys(utilizationMetrics).length || 0,
        productivity: Object.values(utilizationMetrics).reduce((sum, m) => sum + m.productivityScore, 0) / Object.keys(utilizationMetrics).length || 0,
        responseTime: 100 - (Object.values(utilizationMetrics).reduce((sum, m) => sum + parseFloat(m.avgResponseTime), 0) / Object.keys(utilizationMetrics).length || 0) // Inverted for radar
      };

      return {
        labels: ['Utilization', 'Completion Rate', 'Productivity Score', 'Response Time'],
        datasets: [{
          label: 'Team Average',
          data: [avgMetrics.utilization, avgMetrics.completionRate, avgMetrics.productivity, Math.max(0, avgMetrics.responseTime)],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(99, 102, 241, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
        }]
      };
    }

    const techMetrics = utilizationMetrics[selectedTechnician];
    if (!techMetrics) return null;

    return {
      labels: ['Utilization', 'Completion Rate', 'Productivity Score', 'Response Time'],
      datasets: [{
        label: techMetrics.name,
        data: [
          parseFloat(techMetrics.utilization),
          parseFloat(techMetrics.completionRate),
          techMetrics.productivityScore,
          Math.max(0, 100 - parseFloat(techMetrics.avgResponseTime)) // Inverted for radar
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)'
      }]
    };
  }, [utilizationMetrics, selectedTechnician]);

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Technician Utilization & Performance Metrics'
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          afterBody: function(context) {
            const techName = context[0].label;
            const metrics = Object.values(utilizationMetrics).find(m => m.name === techName);
            if (metrics) {
              return [
                `Total Hours: ${metrics.totalHours}h`,
                `Billable Hours: ${metrics.billableHours}h`,
                `Avg Response: ${metrics.avgResponseTime}h`,
                `Efficiency: ${metrics.efficiency}h/order`
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
          text: 'Technicians'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Utilization Rate (%)'
        },
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Completion Rate (%)'
        },
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Performance Radar Analysis'
      },
      legend: {
        position: 'top',
      }
    },
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20
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
        link.download = `technician-utilization-${Date.now()}.png`;
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
        pdf.save(`technician-utilization-${Date.now()}.pdf`);
      }

      if (onDataExport) {
        onDataExport({
          type: 'chart_export',
          format,
          data: utilizationMetrics,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, utilizationMetrics, onDataExport]);

  const exportData = useCallback(() => {
    const csvData = [
      ['Technician', 'Utilization %', 'Completion Rate %', 'Total Hours', 'Billable Hours', 'Avg Response Time (h)', 'Efficiency (h/order)'],
      ...Object.values(utilizationMetrics).map(metric => [
        metric.name,
        metric.utilization,
        metric.completionRate,
        metric.totalHours,
        metric.billableHours,
        metric.avgResponseTime,
        metric.efficiency
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `technician-utilization-data-${Date.now()}.csv`;
    link.click();

    if (onDataExport) {
      onDataExport({
        type: 'data_export',
        format: 'csv',
        data: utilizationMetrics,
        timestamp: Date.now()
      });
    }
  }, [utilizationMetrics, onDataExport]);

  if (!technicians.length) {
    return (
      <div className="technician-utilization-chart">
        <div className="no-data">
          <h3>No Technician Data Available</h3>
          <p>Add technicians and time entries to view utilization metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="technician-utilization-chart" ref={containerRef}>
      <div className="chart-header">
        <div className="chart-title">
          <h3>Technician Performance Analysis</h3>
          <div className="chart-controls">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="view-mode-select"
            >
              <option value="utilization">Utilization Overview</option>
              <option value="performance">Performance Radar</option>
              <option value="comparison">Detailed Comparison</option>
            </select>

            {viewMode === 'performance' && (
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="technician-select"
              >
                <option value="all">Team Average</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </option>
                ))}
              </select>
            )}

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
              <button
                onClick={exportData}
                className="export-btn"
                title="Export Data as CSV"
              >
                📊 CSV
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

      <div className="chart-content">
        {viewMode === 'utilization' && (
          <div className="chart-wrapper utilization-chart">
            <Bar
              ref={chartRef}
              data={getUtilizationChartData()}
              options={barChartOptions}
            />
          </div>
        )}

        {viewMode === 'performance' && getPerformanceRadarData() && (
          <div className="chart-wrapper radar-chart">
            <Radar
              ref={chartRef}
              data={getPerformanceRadarData()}
              options={radarChartOptions}
            />
          </div>
        )}

        {viewMode === 'comparison' && (
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Technician</th>
                  <th>Utilization</th>
                  <th>Completion Rate</th>
                  <th>Total Hours</th>
                  <th>Billable Hours</th>
                  <th>Response Time</th>
                  <th>Efficiency</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(utilizationMetrics)
                  .sort((a, b) => b.productivityScore - a.productivityScore)
                  .map((metric, index) => (
                  <tr key={index} className={index < 3 ? 'top-performer' : ''}>
                    <td className="technician-name">{metric.name}</td>
                    <td className="metric-value">
                      <div className="progress-bar">
                        <div
                          className="progress-fill utilization"
                          style={{ width: `${Math.min(100, metric.utilization)}%` }}
                        ></div>
                        <span>{metric.utilization}%</span>
                      </div>
                    </td>
                    <td className="metric-value">
                      <div className="progress-bar">
                        <div
                          className="progress-fill completion"
                          style={{ width: `${Math.min(100, metric.completionRate)}%` }}
                        ></div>
                        <span>{metric.completionRate}%</span>
                      </div>
                    </td>
                    <td>{metric.totalHours}h</td>
                    <td>{metric.billableHours}h</td>
                    <td>{metric.avgResponseTime}h</td>
                    <td>{metric.efficiency}h/order</td>
                    <td className="score-cell">
                      <span className={`score ${metric.productivityScore >= 80 ? 'excellent' : metric.productivityScore >= 60 ? 'good' : 'needs-improvement'}`}>
                        {metric.productivityScore.toFixed(0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

TechnicianUtilizationChart.displayName = 'TechnicianUtilizationChart';

export default TechnicianUtilizationChart;
