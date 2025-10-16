import React, {
  useState,
  useEffect,
} from 'react';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
// Field service optimization hooks - removed unused imports
import { VirtualizationUtils } from '../utils/component-performance';
import AdvancedMetricsChart from './charts/AdvancedMetricsChartSimplified';
import InteractiveVisualizationDashboard from './charts/InteractiveVisualization';
import TechnicianUtilizationChart from './charts/TechnicianUtilizationChart';
import ServiceCompletionTrends from './charts/ServiceCompletionTrends';
import CustomerSatisfactionMetrics from './charts/CustomerSatisfactionMetrics';
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
  const { formatDate } = useLocaleFormatting();
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week' maps to "Last 7 Days"
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState('all');
  const [technicians, setTechnicians] = useState([]);

  // Advanced metrics data
  const [workOrders, setWorkOrders] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [warehouseItems, setWarehouseItems] = useState([]);

  useEffect(() => {
    loadDashboardData();
    loadAnalyticsData();
    loadTechnicians();
    loadAdvancedMetricsData();
  }, [selectedPeriod, selectedTechnician]);

  const loadAdvancedMetricsData = async () => {
    try {
      // Load work orders
      const workOrdersResponse = await api.get('/api/work-orders/', {
        params: { period: selectedPeriod }
      });
  const wo = workOrdersResponse.data.results ?? workOrdersResponse.data ?? [];
  setWorkOrders(Array.isArray(wo) ? wo : []);

      // Load time entries
      const timeEntriesResponse = await api.get('/api/time-entries/', {
        params: { period: selectedPeriod }
      });
  const te = timeEntriesResponse.data.results ?? timeEntriesResponse.data ?? [];
  setTimeEntries(Array.isArray(te) ? te : []);

      // Load expenses
      const expensesResponse = await api.get('/api/expenses/', {
        params: { period: selectedPeriod }
      });
  const ex = expensesResponse.data.results ?? expensesResponse.data ?? [];
  setExpenses(Array.isArray(ex) ? ex : []);

      // Load warehouse items
      const warehouseResponse = await api.get('/api/warehouse-items/');
  const wh = warehouseResponse.data.results ?? warehouseResponse.data ?? [];
  setWarehouseItems(Array.isArray(wh) ? wh : []);

      // Mock feedback data for now
      setFeedbackData([
        { workOrderId: 1, rating: 4.5, comments: 'Great service' },
        { workOrderId: 2, rating: 5.0, comments: 'Excellent work' },
        { workOrderId: 3, rating: 4.2, comments: 'Good job' }
      ]);
    } catch (_err) {
      console.error('Error loading advanced metrics data:', _err);
    }
  };

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/api/analytics/dashboard/', {
        params: { period: selectedPeriod, technician: selectedTechnician }
      });
      setDashboardData(response.data);
    } catch (_err) {
      console.error('Error loading dashboard data:', _err);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const response = await api.get('/api/scheduling-analytics/', {
        params: { period: selectedPeriod, technician: selectedTechnician }
      });
      setAnalyticsData(response.data.results || response.data);
    } catch (_err) {
      console.error('Error loading analytics data:', _err);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await api.get('/api/technicians/');
      setTechnicians(response.data.results || response.data);
    } catch (_err) {
      console.error('Error loading technicians:', _err);
    }
  };

  const getUtilizationData = () => {
    if (!analyticsData.length) return null;

    const labels = analyticsData.map(item => formatDate(new Date(item.date), { month: 'short', day: 'numeric' }));

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

    const labels = analyticsData.map(item => formatDate(new Date(item.date), { month: 'short', day: 'numeric' }));

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

      {/* Advanced Metrics Dashboard */}
      <div className="advanced-analytics-section">
        <AdvancedMetricsChart
          workOrders={workOrders}
          timeEntries={timeEntries}
          expenses={expenses}
          warehouseItems={warehouseItems}
          feedbackData={feedbackData}
          realTimeEnabled={true}
        />
      </div>

      {/* Interactive Visualization Dashboard */}
      <div className="interactive-visualization-section">
        <InteractiveVisualizationDashboard
          workOrders={workOrders}
          timeEntries={timeEntries}
          expenses={expenses}
          realTimeEnabled={true}
        />
      </div>

      {/* Advanced Analytics Charts */}
      <div className="advanced-charts-section">
        <TechnicianUtilizationChart
          technicians={technicians}
          timeEntries={timeEntries}
          workOrders={workOrders}
          dateRange={selectedPeriod}
          realTimeEnabled={true}
          onDataExport={(data) => console.log('Technician chart export:', data)}
        />

        <ServiceCompletionTrends
          workOrders={workOrders}
          timeEntries={timeEntries}
          dateRange={selectedPeriod}
          realTimeEnabled={true}
          onDataExport={(data) => console.log('Service trends export:', data)}
        />

        <CustomerSatisfactionMetrics
          workOrders={workOrders}
          feedbackData={feedbackData}
          timeEntries={timeEntries}
          dateRange={selectedPeriod}
          realTimeEnabled={true}
          onDataExport={(data) => console.log('Satisfaction metrics export:', data)}
        />
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
