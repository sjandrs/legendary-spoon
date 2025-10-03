import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/helpers/test-utils';
import DashboardPage from '../DashboardPage';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getDashboardAnalytics: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
const mockedApi = api;

// Mock Chart.js
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
  })),
  registerables: [],
}));

describe('DashboardPage Component', () => {
  const mockAnalytics = {
    sales: {
      win_rate: 75.5,
      won_deals: 15,
      total_deals: 20,
      total_value: 125000,
    },
    financial: {
      total_revenue: 45000,
      profit_margin: 25.5,
    },
    projects: {
      completion_rate: 85.0,
      overdue_projects: 2,
      total_projects: 12,
      completed_projects: 10,
    },
    time_tracking: {
      total_hours: 320,
      billable_percentage: 80.5,
    },
    period: {
      start_date: '2025-01-01T00:00:00Z',
      end_date: '2025-01-31T23:59:59Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the specific getDashboardAnalytics function
    mockedApi.getDashboardAnalytics.mockResolvedValue({ data: mockAnalytics });
  });

  it('renders dashboard with loading state', async () => {
    renderWithProviders(<DashboardPage />);

    // Should show loading initially
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Business Dashboard')).toBeInTheDocument();
    });
  });

  it('displays analytics metrics correctly', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('75.5%')).toBeInTheDocument(); // sales win_rate
      expect(screen.getByText('15 won of 20 deals')).toBeInTheDocument(); // sales stats
      expect(screen.getByText('$45,000')).toBeInTheDocument(); // financial total_revenue
      expect(screen.getByText('85%')).toBeInTheDocument(); // projects completion_rate
      expect(screen.getByText('320h')).toBeInTheDocument(); // time_tracking total_hours
    });
  });

  it('displays revenue metrics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('$45,000')).toBeInTheDocument(); // total_revenue
      expect(screen.getByText('Margin: 25.5%')).toBeInTheDocument(); // profit_margin
    });
  });

  it('displays project metrics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Deal Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
      expect(screen.getByText('2 overdue')).toBeInTheDocument(); // overdue projects
    });
  });

  it('handles API error gracefully', async () => {
    mockedApi.getDashboardAnalytics.mockRejectedValue({
      response: { data: { message: 'Failed to load analytics' } },
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch dashboard analytics/i)).toBeInTheDocument();
    });
  });

  it('makes correct API calls on mount', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(mockedApi.getDashboardAnalytics).toHaveBeenCalled();
    });
  });

  it('displays business dashboard title', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Business Dashboard')).toBeInTheDocument();
    });
  });

  it('renders charts containers', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Deal Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
    });
  });

  it('displays proper metric cards layout', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Sales Performance')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Project Completion')).toBeInTheDocument();
      expect(screen.getByText('Time Tracking')).toBeInTheDocument();
    });
  });
});
