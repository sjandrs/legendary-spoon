import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from '../helpers/test-utils';
import Deals from '../../components/Deals';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

const mockDeals = [
  {
    id: 1,
    name: 'Software Implementation Deal',
    account_name: 'Tech Corp',
    stage_name: 'Qualification',
    value: 50000.00,
    expected_close_date: '2025-12-31',
    stage: 1
  },
  {
    id: 2,
    name: 'Hardware Upgrade Project',
    account_name: 'Manufacturing Inc',
    stage_name: 'Proposal',
    value: 75000.00,
    expected_close_date: '2025-11-15',
    stage: 2
  },
  {
    id: 3,
    name: 'Consulting Services',
    account_name: 'Retail Solutions',
    stage_name: 'Negotiation',
    value: 25000.00,
    expected_close_date: '2025-10-30',
    stage: 3
  },
  {
    id: 4,
    name: 'Enterprise License',
    account_name: null, // Test null account name
    stage_name: 'Won',
    value: 100000.00,
    expected_close_date: '2025-09-30',
    stage: 4
  }
];

const mockStageFilteredDeals = [
  {
    id: 1,
    name: 'Software Implementation Deal',
    account_name: 'Tech Corp',
    stage_name: 'Qualification',
    value: 50000.00,
    expected_close_date: '2025-12-31',
    stage: 1
  }
];

describe('Deals Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderDeals = (authUser = mockUsers.salesManager, locationSearch = '') => {
    // Mock useLocation to return the search parameter
    const { useLocation } = require('react-router-dom');
    useLocation.mockReturnValue({
      search: locationSearch,
      pathname: '/deals'
    });

    return renderWithProviders(
      <Deals />,
      {
        authValue: {
          user: authUser,
          token: 'mock-token',
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
        },
        initialEntries: [`/deals${locationSearch}`]
      }
    );
  };

  describe('Data Loading and Display', () => {
    it('shows loading state while fetching deals', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderDeals();

      expect(screen.getByText('Loading deals...')).toBeInTheDocument();
    });

    it('displays deals in table format correctly', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Deals')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('Deal Name')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Stage')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Close Date')).toBeInTheDocument();

      // Check deal data
      expect(screen.getByText('Software Implementation Deal')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Qualification')).toBeInTheDocument();
      expect(screen.getByText('$50,000.00')).toBeInTheDocument();
      expect(screen.getByText('12/30/2025')).toBeInTheDocument();

      expect(screen.getByText('Hardware Upgrade Project')).toBeInTheDocument();
      expect(screen.getByText('Manufacturing Inc')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('$75,000.00')).toBeInTheDocument();
    });

    it('handles empty deals list', async () => {
      api.get.mockResolvedValue({ data: { results: [] } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('No deals found.')).toBeInTheDocument();
      });
    });

    it('handles missing account names gracefully', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Enterprise License')).toBeInTheDocument();
      });

      // Should display 'N/A' for null account name
      const rows = screen.getAllByText('N/A');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('handles direct array response format', async () => {
      api.get.mockResolvedValue({ data: mockDeals }); // Direct array, not wrapped in results

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Software Implementation Deal')).toBeInTheDocument();
      });

      expect(screen.getByText('Hardware Upgrade Project')).toBeInTheDocument();
    });
  });

  describe('Stage Filtering', () => {
    it('displays stage filter information when filtered', async () => {
      api.get.mockResolvedValue({ data: { results: mockStageFilteredDeals } });

      renderDeals(mockUsers.salesManager, '?stage=1');

      await waitFor(() => {
        expect(screen.getByText('Filtered by Stage:')).toBeInTheDocument();
      });

      // Use getAllByText to handle multiple "Qualification" occurrences
      const qualificationElements = screen.getAllByText('Qualification');
      expect(qualificationElements.length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument();
    });

    it('makes correct API call with stage filter', async () => {
      api.get.mockResolvedValue({ data: { results: mockStageFilteredDeals } });

      renderDeals(mockUsers.salesManager, '?stage=1');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/deals/?stage=1');
      });
    });

    it('clears filter when clear button is clicked', async () => {
      api.get.mockResolvedValue({ data: { results: mockStageFilteredDeals } });

      renderDeals(mockUsers.salesManager, '?stage=1');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear filter/i });
      await user.click(clearButton);

      expect(mockNavigate).toHaveBeenCalledWith('/deals');
    });

    it('does not show filter info when no stage filter is applied', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Deals')).toBeInTheDocument();
      });

      expect(screen.queryByText('Filtered by Stage:')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /clear filter/i })).not.toBeInTheDocument();
    });
  });

  describe('Navigation and Interactions', () => {
    beforeEach(() => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });
    });

    it('navigates to deal detail when row is clicked', async () => {
      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Software Implementation Deal')).toBeInTheDocument();
      });

      const dealRow = screen.getByText('Software Implementation Deal').closest('tr');
      await user.click(dealRow);

      expect(mockNavigate).toHaveBeenCalledWith('/deals/1');
    });

    it('makes each table row clickable', async () => {
      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Hardware Upgrade Project')).toBeInTheDocument();
      });

      const dealRow = screen.getByText('Hardware Upgrade Project').closest('tr');
      expect(dealRow).toHaveClass('deal-row');

      await user.click(dealRow);
      expect(mockNavigate).toHaveBeenCalledWith('/deals/2');
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency values correctly', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('$50,000.00')).toBeInTheDocument();
      });

      expect(screen.getByText('$75,000.00')).toBeInTheDocument();
      expect(screen.getByText('$25,000.00')).toBeInTheDocument();
      expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    });

    it('handles zero and negative values', async () => {
      const dealsWithSpecialValues = [
        {
          id: 1,
          name: 'Zero Value Deal',
          account_name: 'Test Corp',
          stage_name: 'Qualification',
          value: 0,
          expected_close_date: '2025-12-31',
          stage: 1
        },
        {
          id: 2,
          name: 'Negative Value Deal',
          account_name: 'Test Corp',
          stage_name: 'Lost',
          value: -1000,
          expected_close_date: '2025-12-31',
          stage: 2
        }
      ];

      api.get.mockResolvedValue({ data: { results: dealsWithSpecialValues } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });

      expect(screen.getByText('-$1,000.00')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('12/30/2025')).toBeInTheDocument();
      });

      expect(screen.getByText('11/14/2025')).toBeInTheDocument();
      expect(screen.getByText('10/29/2025')).toBeInTheDocument();
      expect(screen.getByText('9/29/2025')).toBeInTheDocument();
    });
  });

  describe('Stage Color Coding', () => {
    it('applies consistent color coding to deal stages', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Qualification')).toBeInTheDocument();
      });

      const qualificationStage = screen.getByText('Qualification');
      const proposalStage = screen.getByText('Proposal');
      const negotiationStage = screen.getByText('Negotiation');
      const wonStage = screen.getByText('Won');

      expect(qualificationStage).toHaveClass('deal-stage');
      expect(proposalStage).toHaveClass('deal-stage');
      expect(negotiationStage).toHaveClass('deal-stage');
      expect(wonStage).toHaveClass('deal-stage');

      // Each stage should have a background color style
      expect(qualificationStage).toHaveAttribute('style', expect.stringContaining('background-color:'));
      expect(proposalStage).toHaveAttribute('style', expect.stringContaining('background-color:'));
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue(new Error('Network error'));

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText(/Could not load deals.*try again later/i)).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch deals:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('recovers from error when data loads successfully on retry', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      // First render - API call fails
      api.get.mockRejectedValueOnce(new Error('Network error'));

      renderDeals();

      // Should show error first
      await waitFor(() => {
        expect(screen.getByText(/Could not load deals/i)).toBeInTheDocument();
      });

      // Second render - API call succeeds (simulating user retry/refresh)
      api.get.mockResolvedValueOnce({ data: { results: mockDeals } });

      // Simulate a fresh component mount (like user refresh)
      renderDeals();

      // Should show data on retry
      await waitFor(() => {
        expect(screen.getByText('Software Implementation Deal')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Role-Based Access Control', () => {
    it('displays deals for Sales Manager', async () => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });

      renderDeals(mockUsers.salesManager);

      await waitFor(() => {
        expect(screen.getByText('Software Implementation Deal')).toBeInTheDocument();
      });

      expect(screen.getByText('Hardware Upgrade Project')).toBeInTheDocument();
      expect(screen.getByText('Consulting Services')).toBeInTheDocument();
      expect(screen.getByText('Enterprise License')).toBeInTheDocument();
    });

    it('displays appropriate deals for Sales Rep', async () => {
      // Sales rep might see only their own deals (depends on backend logic)
      const salesRepDeals = [mockDeals[0], mockDeals[2]]; // Subset of deals
      api.get.mockResolvedValue({ data: { results: salesRepDeals } });

      renderDeals(mockUsers.salesRep);

      await waitFor(() => {
        expect(screen.getByText('Software Implementation Deal')).toBeInTheDocument();
      });

      expect(screen.getByText('Consulting Services')).toBeInTheDocument();
      expect(screen.queryByText('Hardware Upgrade Project')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      api.get.mockResolvedValue({ data: { results: mockDeals } });
    });

    it('has proper heading structure', async () => {
      renderDeals();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Deals' })).toBeInTheDocument();
      });
    });

    it('has accessible table structure', async () => {
      renderDeals();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');
      expect(headers).toHaveLength(5);

      expect(headers[0]).toHaveTextContent('Deal Name');
      expect(headers[1]).toHaveTextContent('Account');
      expect(headers[2]).toHaveTextContent('Stage');
      expect(headers[3]).toHaveTextContent('Value');
      expect(headers[4]).toHaveTextContent('Close Date');

      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('provides meaningful button labels', async () => {
      renderDeals(mockUsers.salesManager, '?stage=1');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filter/i })).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear filter/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large datasets efficiently', async () => {
      const largeDealsData = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Deal ${i + 1}`,
        account_name: `Account ${i + 1}`,
        stage_name: `Stage ${(i % 4) + 1}`,
        value: (i + 1) * 1000,
        expected_close_date: '2025-12-31',
        stage: (i % 4) + 1
      }));

      api.get.mockResolvedValue({ data: { results: largeDealsData } });

      const startTime = performance.now();
      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Deal 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second

      expect(screen.getByText('Deal 100')).toBeInTheDocument();
    });

    it('handles special characters in deal data', async () => {
      const dealsWithSpecialChars = [
        {
          id: 1,
          name: 'Deal with & Special <Characters>',
          account_name: 'Company "Quotes" & More',
          stage_name: 'Stage with émojis 🎯',
          value: 50000.00,
          expected_close_date: '2025-12-31',
          stage: 1
        }
      ];

      api.get.mockResolvedValue({ data: { results: dealsWithSpecialChars } });

      renderDeals();

      await waitFor(() => {
        expect(screen.getByText('Deal with & Special <Characters>')).toBeInTheDocument();
      });

      expect(screen.getByText('Company "Quotes" & More')).toBeInTheDocument();
      expect(screen.getByText('Stage with émojis 🎯')).toBeInTheDocument();
    });
  });
});
