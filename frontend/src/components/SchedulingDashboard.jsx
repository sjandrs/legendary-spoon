import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../api';
import './SchedulingDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SchedulingDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    loadDashboardData();
    loadAnalyticsData();
    loadTechnicians();
  }, [selectedPeriod, selectedTechnician]);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/api/analytics/dashboard/', {
        params: { period: selectedPeriod, technician: selectedTechnician }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const response = await api.get('/api/scheduling-analytics/', {
        params: { period: selectedPeriod, technician: selectedTechnician }
      });
      setAnalyticsData(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await api.get('/api/technicians/');
      setTechnicians(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const getUtilizationData = () => {
    if (!analyticsData.length) return null;

    const labels = analyticsData.map(item =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Technician Utilization %',
          data: analyticsData.map(item => (item.scheduled_hours / item.available_hours * 100).toFixed(1)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'On-Time Performance %',
          data: analyticsData.map(item => item.on_time_percentage || 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        }
      ],
    };
  };

  const getAppointmentStatusData = () => {
    if (!dashboardData) return null;

    return {
      labels: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      datasets: [
        {
          data: [
            dashboardData.scheduled_appointments || 0,
            dashboardData.in_progress_appointments || 0,
            dashboardData.completed_appointments || 0,
            dashboardData.cancelled_appointments || 0
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const getEfficiencyData = () => {
    if (!analyticsData.length) return null;

    const labels = analyticsData.map(item =>
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Average Travel Time (mins)',
          data: analyticsData.map(item => item.average_travel_time || 0),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Average Service Time (mins)',
          data: analyticsData.map(item => item.average_service_time || 0),
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 1,
        }
      ],
    };
  };

  const chartOptions = {
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  if (loading) {
    return (
      <div className="scheduling-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="scheduling-dashboard">
      <div className="dashboard-header">
        <h1>Scheduling Analytics Dashboard</h1>
        <div className="dashboard-controls">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="technician-select"
          >
            <option value="all">All Technicians</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.first_name} {tech.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{dashboardData?.total_appointments || 0}</div>
          <div className="metric-label">Total Appointments</div>
          <div className="metric-change positive">
            +{dashboardData?.appointment_growth || 0}% vs last period
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{dashboardData?.average_utilization || 0}%</div>
          <div className="metric-label">Avg Utilization</div>
          <div className="metric-change negative">
            {dashboardData?.utilization_change || 0}% vs last period
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{dashboardData?.on_time_rate || 0}%</div>
          <div className="metric-label">On-Time Rate</div>
          <div className="metric-change positive">
            +{dashboardData?.on_time_improvement || 0}% vs last period
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">${dashboardData?.revenue || 0}</div>
          <div className="metric-label">Revenue</div>
          <div className="metric-change positive">
            +{dashboardData?.revenue_growth || 0}% vs last period
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Utilization & Performance Trends</h3>
          <div className="chart-wrapper">
            {getUtilizationData() && (
              <Line data={getUtilizationData()} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="chart-container">
          <h3>Appointment Status Distribution</h3>
          <div className="chart-wrapper">
            {getAppointmentStatusData() && (
              <Doughnut data={getAppointmentStatusData()} options={doughnutOptions} />
            )}
          </div>
        </div>

        <div className="chart-container full-width">
          <h3>Travel Time vs Service Time Analysis</h3>
          <div className="chart-wrapper">
            {getEfficiencyData() && (
              <Bar data={getEfficiencyData()} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="insights-section">
        <h3>Performance Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>🎯 Efficiency Opportunity</h4>
            <p>
              Average travel time of {dashboardData?.average_travel_time || 0} minutes
              could be reduced by 15% with better route optimization.
            </p>
          </div>

          <div className="insight-card">
            <h4>📈 Utilization Trend</h4>
            <p>
              Technician utilization has {dashboardData?.utilization_trend === 'up' ? 'increased' : 'decreased'}
              by {Math.abs(dashboardData?.utilization_change || 0)}% this period.
            </p>
          </div>

          <div className="insight-card">
            <h4>⏱️ Peak Hours</h4>
            <p>
              Most appointments scheduled between {dashboardData?.peak_start || '9 AM'}
              and {dashboardData?.peak_end || '3 PM'}. Consider adjusting staff allocation.
            </p>
          </div>

          <div className="insight-card">
            <h4>📊 Service Quality</h4>
            <p>
              {dashboardData?.on_time_rate || 0}% on-time rate
              {(dashboardData?.on_time_rate || 0) >= 85 ? 'exceeds' : 'falls below'}
              industry benchmark of 85%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingDashboard;
