// Mock Chart.js to avoid canvas reimport SchedulingDashboard from '../../components/SchedulingDashboard';dering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
}));

// Mock Chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock API
jest.mock('../../api', () => ({
  __esModule__: true,
  get: jest.fn(),
}));

const { get: mockGet } = require('../../api');

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import SchedulingDashboard from '../../components/SchedulingDashboard';
import { renderWithProviders, testComponentAccessibility } from '../../__tests__/helpers/test-utils';

describe('SchedulingDashboard Component - REQ-203.6', () => {
  const mockDashboardData = {
    total_appointments: 145,
    appointment_growth: 12,
    average_utilization: 78,
    utilization_change: -3,
    on_time_rate: 92,
    on_time_improvement: 5,
    revenue: 45280,
    revenue_growth: 18,
    scheduled_appointments: 45,
    in_progress_appointments: 12,
    completed_appointments: 88,
    cancelled_appointments: 5,
    average_travel_time: 24,
    utilization_trend: 'up',
    peak_start: '9 AM',
    peak_end: '3 PM'
  };

  const mockAnalyticsData = [
    {
      date: '2024-01-15',
      scheduled_hours: 8,
      available_hours: 10,
      on_time_percentage: 95,
      average_travel_time: 22,
      average_service_time: 45
    },
    {
      date: '2024-01-16',
      scheduled_hours: 9,
      available_hours: 10,
      on_time_percentage: 88,
      average_travel_time: 28,
      average_service_time: 52
    },
    {
      date: '2024-01-17',
      scheduled_hours: 7,
      available_hours: 10,
      on_time_percentage: 100,
      average_travel_time: 18,
      average_service_time: 38
    }
  ];

  const mockTechnicians = [
    { id: 1, first_name: 'John', last_name: 'Smith' },
    { id: 2, first_name: 'Sarah', last_name: 'Johnson' },
    { id: 3, first_name: 'Mike', last_name: 'Davis' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((url) => {
      if (url.includes('/api/analytics/dashboard/')) {
        return Promise.resolve({ data: mockDashboardData });
      }
      if (url.includes('/api/scheduling-analytics/')) {
        return Promise.resolve({ data: mockAnalyticsData });
      }
      if (url.includes('/api/technicians/')) {
        return Promise.resolve({ data: mockTechnicians });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  describe('Component Rendering', () => {
    it('renders dashboard with loading state initially', () => {
      renderWithProviders(<SchedulingDashboard />);

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('renders dashboard header with title and controls', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      const comboboxes = screen.getAllByRole('combobox', { name: '' });
      expect(comboboxes).toHaveLength(2);
    });

    it('loads and displays key metrics', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('145')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Appointments')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('Avg Utilization')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('On-Time Rate')).toBeInTheDocument();
      expect(screen.getByText('$45280')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('renders all chart containers', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Utilization & Performance Trends')).toBeInTheDocument();
      expect(screen.getByText('Appointment Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('Travel Time vs Service Time Analysis')).toBeInTheDocument();

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('displays performance insights section', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Performance Insights')).toBeInTheDocument();
      });

      expect(screen.getByText('🎯 Efficiency Opportunity')).toBeInTheDocument();
      expect(screen.getByText('📈 Utilization Trend')).toBeInTheDocument();
      expect(screen.getByText('⏱️ Peak Hours')).toBeInTheDocument();
      expect(screen.getByText('📊 Service Quality')).toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('loads dashboard data on component mount', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/api/analytics/dashboard/', expect.any(Object));
      });

      expect(mockGet).toHaveBeenCalledWith('/api/scheduling-analytics/', expect.any(Object));
      expect(mockGet).toHaveBeenCalledWith('/api/technicians/');
    });

    it('passes correct parameters to API calls', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(3);
      });

      const dashboardCall = mockGet.mock.calls.find(call => call[0].includes('/api/analytics/dashboard/'));
      const analyticsCall = mockGet.mock.calls.find(call => call[0].includes('/api/scheduling-analytics/'));

      expect(dashboardCall[1].params).toEqual({ period: 'week', technician: 'all' });
      expect(analyticsCall[1].params).toEqual({ period: 'week', technician: 'all' });
    });

    it('handles API loading errors gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      // Should still render the component even with API error
      expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
    });
  });

  describe('Period Selection', () => {
    it('allows changing time period', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      const periodSelect = document.querySelector('.period-select');
      await user.selectOptions(periodSelect, 'month');

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(6); // Initial 3 + 3 reloads
      });

      const dashboardCalls = mockGet.mock.calls.filter(call => call[0].includes('/api/analytics/dashboard/'));
      expect(dashboardCalls[dashboardCalls.length - 1][1].params.period).toBe('month');
    });

    it('displays correct period options', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      const periodSelect = document.querySelector('.period-select');
      expect(screen.getByRole('option', { name: 'Last 7 Days' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Last 30 Days' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Last 90 Days' })).toBeInTheDocument();
    });
  });

  describe('Technician Filtering', () => {
    it('loads and displays technician options', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      const technicianSelect = document.querySelector('.technician-select');
      expect(screen.getByRole('option', { name: 'All Technicians' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'John Smith' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sarah Johnson' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Mike Davis' })).toBeInTheDocument();
    });

    it('allows filtering by specific technician', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      const technicianSelect = document.querySelector('.technician-select');
      await user.selectOptions(technicianSelect, '1');

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledTimes(6); // Initial 3 + 3 reloads
      });

      const dashboardCalls = mockGet.mock.calls.filter(call => call[0].includes('/api/analytics/dashboard/'));
      expect(dashboardCalls[dashboardCalls.length - 1][1].params.technician).toBe('1');
    });
  });

  describe('Metrics Display', () => {
    it('displays metric values correctly', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('145')).toBeInTheDocument();
      });

      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('$45280')).toBeInTheDocument();
    });

    it('displays metric change indicators', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('+12% vs last period')).toBeInTheDocument();
      });

      expect(screen.getByText('-3% vs last period')).toBeInTheDocument();
      expect(screen.getByText('+5% vs last period')).toBeInTheDocument();
      expect(screen.getByText('+18% vs last period')).toBeInTheDocument();
    });

    it('handles missing metric data gracefully', async () => {
      const incompleteData = { ...mockDashboardData };
      delete incompleteData.total_appointments;
      delete incompleteData.average_utilization;

      mockGet.mockImplementation((url) => {
        if (url.includes('/api/analytics/dashboard/')) {
          return Promise.resolve({ data: incompleteData });
        }
        if (url.includes('/api/scheduling-analytics/')) {
          return Promise.resolve({ data: mockAnalyticsData });
        }
        if (url.includes('/api/technicians/')) {
          return Promise.resolve({ data: mockTechnicians });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('0')).toBeInTheDocument(); // Default values for missing data
    });
  });

  describe('Chart Data Processing', () => {
    it('renders charts when data is available', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('handles missing analytics data gracefully', async () => {
      mockGet.mockImplementation((url) => {
        if (url.includes('/api/analytics/dashboard/')) {
          return Promise.resolve({ data: mockDashboardData });
        }
        if (url.includes('/api/scheduling-analytics/')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/api/technicians/')) {
          return Promise.resolve({ data: mockTechnicians });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      // Charts should still be present but may not render data
      expect(screen.getByText('Utilization & Performance Trends')).toBeInTheDocument();
      expect(screen.getByText('Appointment Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('Travel Time vs Service Time Analysis')).toBeInTheDocument();
    });
  });

  describe('Performance Insights', () => {
    it('displays efficiency insights with correct data', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Average travel time of/)).toBeInTheDocument();
        expect(screen.getByText(/24/)).toBeInTheDocument();
        expect(screen.getByText(/minutes could be reduced/)).toBeInTheDocument();
      });
    });

    it('displays utilization trend insights', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Technician utilization has/)).toBeInTheDocument();
        expect(screen.getByText(/increased/)).toBeInTheDocument();
        expect(screen.getByText(/by 3/)).toBeInTheDocument();
        expect(screen.getByText(/% this period/)).toBeInTheDocument();
      });
    });

    it('displays peak hours information', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Most appointments scheduled between/)).toBeInTheDocument();
        expect(screen.getByText(/9 AM/)).toBeInTheDocument();
        expect(screen.getByText(/and/)).toBeInTheDocument();
        expect(screen.getByText(/3 PM/)).toBeInTheDocument();
        expect(screen.getByText(/Consider adjusting staff allocation/)).toBeInTheDocument();
      });
    });

    it('displays service quality insights', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/92.*% on-time rate/)).toBeInTheDocument();
        expect(screen.getByText(/exceeds/)).toBeInTheDocument();
        expect(screen.getByText(/industry benchmark of 85/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<SchedulingDashboard />);
    });

    it('has proper heading structure', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Scheduling Analytics Dashboard');
      });
    });

    it('provides proper form labels', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('All Technicians')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      const periodSelect = document.querySelector('.period-select');
      periodSelect.focus();
      expect(periodSelect).toHaveFocus();
    });

    it('provides descriptive chart labels', async () => {
      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Utilization & Performance Trends')).toBeInTheDocument();
      expect(screen.getByText('Appointment Status Distribution')).toBeInTheDocument();
      expect(screen.getByText('Travel Time vs Service Time Analysis')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles technician loading errors gracefully', async () => {
      mockGet.mockImplementation((url) => {
        if (url.includes('/api/technicians/')) {
          return Promise.reject(new Error('Technicians API error'));
        }
        if (url.includes('/api/analytics/dashboard/')) {
          return Promise.resolve({ data: mockDashboardData });
        }
        if (url.includes('/api/scheduling-analytics/')) {
          return Promise.resolve({ data: mockAnalyticsData });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      // Should still render with default technician option
      expect(screen.getByRole('option', { name: 'All Technicians' })).toBeInTheDocument();
    });

    it('handles analytics data loading errors gracefully', async () => {
      mockGet.mockImplementation((url) => {
        if (url.includes('/api/scheduling-analytics/')) {
          return Promise.reject(new Error('Analytics API error'));
        }
        if (url.includes('/api/analytics/dashboard/')) {
          return Promise.resolve({ data: mockDashboardData });
        }
        if (url.includes('/api/technicians/')) {
          return Promise.resolve({ data: mockTechnicians });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderWithProviders(<SchedulingDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      });

      // Should still render dashboard with available data
      expect(screen.getByText('Scheduling Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });
  });
});
