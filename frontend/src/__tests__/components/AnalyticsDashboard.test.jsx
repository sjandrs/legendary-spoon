import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getAdvancedAnalyticsDashboard: jest.fn(),
  predictDealOutcome: jest.fn(),
  calculateCustomerLifetimeValue: jest.fn(),
  generateRevenueForecast: jest.fn(),
}));

// Mock window.alert for user feedback
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
});

describe('AnalyticsDashboard', () => {
  const user = userEvent.setup();

  const mockAnalyticsData = {
    current_metrics: {
      total_revenue: 1250000,
      total_deals: 45,
      won_deals: 28,
      conversion_rate: 62.2,
      active_projects: 15,
      inventory_value: 85000,
      outstanding_invoices: 125000
    },
    predictions: {
      deal_predictions: [
        {
          deal_title: 'Enterprise Deal A',
          predicted_outcome: 'Won',
          confidence: 0.85,
          estimated_close_days: 14
        },
        {
          deal_title: 'SMB Deal B',
          predicted_outcome: 'Lost',
          confidence: 0.72,
          estimated_close_days: 7
        }
      ],
      revenue_forecast_next_week: 75000,
      forecast_data: [
        {
          date: '2024-01-01',
          period: 'Week 1',
          predicted_revenue: 125000,
          confidence_lower: 100000,
          confidence_upper: 150000
        }
      ]
    },
    insights: {
      customer_lifetime_value: [
        {
          contact_name: 'ACME Corp',
          predicted_clv: 250000,
          segments: ['Enterprise', 'Technology']
        }
      ],
      revenue_trend: [
        { date: '2024-01-01', revenue: 85000 },
        { date: '2024-01-02', revenue: 92000 }
      ],
      top_performing_segments: [
        { segment: 'Enterprise', count: 45, avg_clv: 185000 }
      ]
    }
  };

  const mockDealPrediction = {
    predicted_outcome: 'Won',
    confidence_score: 0.87
  };

  const mockCLVData = {
    predicted_clv: 175000,
    confidence: 0.94,
    segments: ['Enterprise', 'Technology']
  };

  const mockForecastData = {
    message: 'Revenue forecast generated successfully',
    forecast_data: [
      { period: 'Month 1', predicted_revenue: 485000, confidence_lower: 420000, confidence_upper: 550000 }
    ],
    revenue_forecast_next_week: 135000
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default API responses
    api.getAdvancedAnalyticsDashboard.mockResolvedValue({ data: mockAnalyticsData });
    api.predictDealOutcome.mockResolvedValue({ data: mockDealPrediction });
    api.calculateCustomerLifetimeValue.mockResolvedValue({ data: mockCLVData });
    api.generateRevenueForecast.mockResolvedValue({ data: mockForecastData });
  });

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText('Loading advanced analytics...')).toBeInTheDocument();
    });

    it('renders dashboard content after loading', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Current Business Metrics')).toBeInTheDocument();
        expect(screen.getByText('$1,250,000')).toBeInTheDocument();
        expect(screen.getByText('Total Deals')).toBeInTheDocument();
        expect(screen.getByText('Won Deals')).toBeInTheDocument();
      });
    });

    it('renders all metric cards', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('Total Deals')).toBeInTheDocument();
        expect(screen.getByText('Won Deals')).toBeInTheDocument();
        expect(screen.getByText('Active Projects')).toBeInTheDocument();
        expect(screen.getByText('Inventory Value')).toBeInTheDocument();
        expect(screen.getByText('Outstanding Invoices')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches analytics data on component mount', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(api.getAdvancedAnalyticsDashboard).toHaveBeenCalledTimes(1);
      });
    });

    it('handles API errors gracefully', async () => {
      api.getAdvancedAnalyticsDashboard.mockRejectedValue(new Error('API Error'));

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch advanced analytics.')).toBeInTheDocument();
      });
    });
  });

  describe('Deal Prediction Functionality', () => {
    it('renders deal prediction controls', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Deal ID')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /predict outcome/i })).toBeInTheDocument();
      });
    });

    it('makes prediction when button is clicked', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Deal ID')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter Deal ID');
      const button = screen.getByRole('button', { name: /predict outcome/i });

      await user.type(input, '123');
      await user.click(button);

      await waitFor(() => {
        expect(api.predictDealOutcome).toHaveBeenCalledWith('123');
      });
    });

    it('displays prediction feedback', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Deal ID')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter Deal ID');
      const button = screen.getByRole('button', { name: /predict outcome/i });

      await user.type(input, '123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Prediction: Won \(87\.0% confidence\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Customer Lifetime Value Functionality', () => {
    it('renders CLV controls', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Contact ID')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /calculate clv/i })).toBeInTheDocument();
      });
    });

    it('calculates CLV when button is clicked', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Contact ID')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter Contact ID');
      const button = screen.getByRole('button', { name: /calculate clv/i });

      await user.type(input, '456');
      await user.click(button);

      await waitFor(() => {
        expect(api.calculateCustomerLifetimeValue).toHaveBeenCalledWith('456');
        expect(mockAlert).toHaveBeenCalledWith('CLV: $175,000 (94.0% confidence)');
      });
    });
  });

  describe('Revenue Forecasting Functionality', () => {
    it('renders forecast controls', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
        expect(screen.getByDisplayValue('6')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generate forecast/i })).toBeInTheDocument();
      });
    });

    it('generates forecast when button is clicked', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate forecast/i })).toBeInTheDocument();
      });

      const button = screen.getByRole('button', { name: /generate forecast/i });
      await user.click(button);

      await waitFor(() => {
        expect(api.generateRevenueForecast).toHaveBeenCalledWith({
          period: 'monthly',
          periods_ahead: 6
        });
        expect(mockAlert).toHaveBeenCalledWith('Generated Revenue forecast generated successfully');
      });
    });
  });

  describe('Data Display', () => {
    it('displays deal outcome predictions table', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Deal Outcome Predictions')).toBeInTheDocument();
        expect(screen.getByText('Enterprise Deal A')).toBeInTheDocument();
        expect(screen.getByText('Won')).toBeInTheDocument();
        expect(screen.getByText('85.0%')).toBeInTheDocument();
      });
    });

    it('displays customer lifetime value data', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Customer Lifetime Value Analysis')).toBeInTheDocument();
        expect(screen.getByText('ACME Corp')).toBeInTheDocument();
        expect(screen.getByText('$250,000')).toBeInTheDocument();
      });
    });

    it('displays revenue forecast next week', async () => {
      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Revenue Forecasting')).toBeInTheDocument();
        expect(screen.getByText('$75,000')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles deal prediction errors gracefully', async () => {
      api.predictDealOutcome.mockRejectedValue(new Error('Prediction failed'));

      render(<AnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter Deal ID')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter Deal ID');
      const button = screen.getByRole('button', { name: /predict outcome/i });

      await user.type(input, '123');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to predict deal outcome.')).toBeInTheDocument();
      });
    });
  });
});
