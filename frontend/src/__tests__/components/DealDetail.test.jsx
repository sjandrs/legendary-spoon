import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from '../helpers/test-utils';
import DealDetail from '../../components/DealDetail';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: jest.fn(),
}));

const mockDealDetail = {
  id: 1,
  title: 'Enterprise Software Implementation',
  status: 'in_progress',
  owner_username: 'john.manager',
  value: 150000.00,
  stage_name: 'Proposal',
  close_date: '2025-12-31',
  account_name: 'Tech Solutions Corp',
  primary_contact_name: 'Jane Smith',
  description: 'Complete ERP system implementation with training',
  probability: 75,
  created_date: '2025-01-15',
  modified_date: '2025-09-15'
};

const mockMinimalDeal = {
  id: 2,
  title: 'Basic Deal',
  status: 'new',
  value: null,
  stage_name: null,
  close_date: '2025-11-30',
  account_name: null,
  primary_contact_name: null,
  owner_username: null
};

const mockCompleteDeal = {
  id: 3,
  title: 'Complex Enterprise Deal',
  status: 'negotiation',
  owner_username: 'sarah.sales',
  value: 500000.00,
  stage_name: 'Negotiation',
  close_date: '2025-10-15',
  account_name: 'Global Manufacturing Inc',
  primary_contact_name: 'Robert Johnson',
  description: 'Multi-year enterprise solution with support',
  probability: 90,
  created_date: '2025-02-01',
  modified_date: '2025-09-30'
};

describe('DealDetail Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    const { useParams } = require('react-router-dom');
    useParams.mockReturnValue({ id: '1' });
  });

  const renderDealDetail = (authUser = mockUsers.salesManager, dealId = '1') => {
    const { useParams } = require('react-router-dom');
    useParams.mockReturnValue({ id: dealId });

    return renderWithProviders(
      <DealDetail />,
      {
        authValue: {
          user: authUser,
          token: 'mock-token',
          loading: false,
          login: jest.fn(),
          logout: jest.fn(),
        },
        initialEntries: [`/deals/${dealId}`]
      }
    );
  };

  describe('Data Loading and Display', () => {
    it('shows loading state while fetching deal details', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderDealDetail();

      expect(screen.getByText('Loading deal details...')).toBeInTheDocument();
      expect(screen.getByText('Loading deal details...')).toHaveClass('loading-spinner');
    });

    it('displays complete deal information correctly', async () => {
      api.get.mockResolvedValue({ data: mockDealDetail });

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      // Check header information
      expect(screen.getByRole('heading', { level: 1, name: 'Enterprise Software Implementation' })).toBeInTheDocument();
      expect(screen.getByText('in progress')).toBeInTheDocument();
      expect(screen.getByText('in progress')).toHaveClass('status-badge', 'status-in_progress');

      // Check deal information card
      expect(screen.getByText('Deal Information')).toBeInTheDocument();
      expect(screen.getByText('john.manager')).toBeInTheDocument();
      expect(screen.getByText('$150,000.00')).toBeInTheDocument();
      expect(screen.getByText('Proposal')).toBeInTheDocument();
      expect(screen.getByText('12/30/2025')).toBeInTheDocument();

      // Check associated parties card
      expect(screen.getByText('Associated Parties')).toBeInTheDocument();
      expect(screen.getByText('Tech Solutions Corp')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('handles deal with minimal information gracefully', async () => {
      api.get.mockResolvedValue({ data: mockMinimalDeal });

      renderDealDetail(mockUsers.salesManager, '2');

      await waitFor(() => {
        expect(screen.getByText('Basic Deal')).toBeInTheDocument();
      });

      // Should display N/A for missing fields
      const naElements = screen.getAllByText('N/A');
      expect(naElements.length).toBeGreaterThanOrEqual(4); // owner, stage, account, contact

      // Should handle null value gracefully (empty currency display)
      expect(screen.queryByText('$')).not.toBeInTheDocument();

      // Should still display date
      expect(screen.getByText('11/29/2025')).toBeInTheDocument();
    });

    it('displays all deal information sections', async () => {
      api.get.mockResolvedValue({ data: mockCompleteDeal });

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('Complex Enterprise Deal')).toBeInTheDocument();
      });

      // Check all required sections are present
      expect(screen.getByText('Deal Information')).toBeInTheDocument();
      expect(screen.getByText('Associated Parties')).toBeInTheDocument();

      // Check all information fields
      expect(screen.getByText(/Owner:/)).toBeInTheDocument();
      expect(screen.getByText(/Value:/)).toBeInTheDocument();
      expect(screen.getByText(/Stage:/)).toBeInTheDocument();
      expect(screen.getByText(/Expected Close Date:/)).toBeInTheDocument();
      expect(screen.getByText(/Account:/)).toBeInTheDocument();
      expect(screen.getByText(/Primary Contact:/)).toBeInTheDocument();
    });

    it('makes correct API call with deal ID', async () => {
      api.get.mockResolvedValue({ data: mockDealDetail });

      renderDealDetail(mockUsers.salesManager, '123');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/deals/123/');
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      api.get.mockResolvedValue({ data: mockDealDetail });
    });

    it('displays back button and handles navigation', async () => {
      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      expect(backButton).toHaveClass('back-button');

      await user.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('back button has proper styling and arrow', async () => {
      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton.textContent).toContain('←');
      expect(backButton.textContent).toContain('Back');
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency values correctly', async () => {
      const dealsWithVariousValues = [
        { ...mockDealDetail, value: 100000.50 },
        { ...mockDealDetail, value: 0 },
        { ...mockDealDetail, value: 1234567.89 },
        { ...mockDealDetail, value: -5000 }
      ];

      for (const deal of dealsWithVariousValues) {
        api.get.mockResolvedValue({ data: deal });

        const { unmount } = renderDealDetail();

        await waitFor(() => {
          expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
        });

        if (deal.value === 100000.50) {
          expect(screen.getByText('$100,000.50')).toBeInTheDocument();
        } else if (deal.value === 0) {
          expect(screen.getByText('$0.00')).toBeInTheDocument();
        } else if (deal.value === 1234567.89) {
          expect(screen.getByText('$1,234,567.89')).toBeInTheDocument();
        } else if (deal.value === -5000) {
          expect(screen.getByText('-$5,000.00')).toBeInTheDocument();
        }

        unmount();
      }
    });

    it('handles null and undefined values gracefully', async () => {
      const dealsWithMissingValues = [
        { ...mockDealDetail, value: null },
        { ...mockDealDetail, value: undefined }
      ];

      for (const deal of dealsWithMissingValues) {
        api.get.mockResolvedValue({ data: deal });

        const { unmount } = renderDealDetail();

        await waitFor(() => {
          expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
        });

        // Should not display any currency value
        expect(screen.queryByText(/\$/)).not.toBeInTheDocument();

        unmount();
      }
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', async () => {
      const dealsWithVariousDates = [
        { ...mockDealDetail, close_date: '2025-01-01' },
        { ...mockDealDetail, close_date: '2025-12-31' },
        { ...mockDealDetail, close_date: '2025-06-15' }
      ];

      for (const deal of dealsWithVariousDates) {
        api.get.mockResolvedValue({ data: deal });

        const { unmount } = renderDealDetail();

        await waitFor(() => {
          expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
        });

        if (deal.close_date === '2025-01-01') {
          expect(screen.getByText('12/31/2024')).toBeInTheDocument();
        } else if (deal.close_date === '2025-12-31') {
          expect(screen.getByText('12/30/2025')).toBeInTheDocument();
        } else if (deal.close_date === '2025-06-15') {
          expect(screen.getByText('6/14/2025')).toBeInTheDocument();
        }

        unmount();
      }
    });
  });

  describe('Status Badge Formatting', () => {
    it('formats status badges correctly', async () => {
      const dealsWithVariousStatuses = [
        { ...mockDealDetail, status: 'in_progress' },
        { ...mockDealDetail, status: 'new' },
        { ...mockDealDetail, status: 'on_hold' },
        { ...mockDealDetail, status: 'completed' }
      ];

      for (const deal of dealsWithVariousStatuses) {
        api.get.mockResolvedValue({ data: deal });

        const { unmount } = renderDealDetail();

        await waitFor(() => {
          expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
        });

        if (deal.status === 'in_progress') {
          const statusBadge = screen.getByText('in progress');
          expect(statusBadge).toHaveClass('status-badge', 'status-in_progress');
        } else if (deal.status === 'on_hold') {
          const statusBadge = screen.getByText('on hold');
          expect(statusBadge).toHaveClass('status-badge', 'status-on_hold');
        } else {
          const statusBadge = screen.getByText(deal.status);
          expect(statusBadge).toHaveClass('status-badge');
        }

        unmount();
      }
    });

    it('handles non-string status values', async () => {
      const dealsWithSpecialStatuses = [
        { ...mockDealDetail, status: null },
        { ...mockDealDetail, status: undefined },
        { ...mockDealDetail, status: 123 },
        { ...mockDealDetail, status: true }
      ];

      for (const deal of dealsWithSpecialStatuses) {
        api.get.mockResolvedValue({ data: deal });

        const { unmount } = renderDealDetail();

        await waitFor(() => {
          expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
        });

        // Should handle non-string values gracefully - just verify component rendered
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();

        unmount();
      }
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue(new Error('Network error'));

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch deal details.*not exist.*permission/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to fetch deal details.*not exist.*permission/i)).toHaveClass('error-message');
      expect(consoleError).toHaveBeenCalledWith(expect.any(Error));

      consoleError.mockRestore();
    });

    it('handles 404 errors appropriately', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Deal not found' } }
      });

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch deal details.*not exist.*permission/i)).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('handles 403 permission errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue({
        response: { status: 403, data: { message: 'Permission denied' } }
      });

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch deal details.*not exist.*permission/i)).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('recovers from error when data loads successfully on retry', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      // First render - API call fails
      api.get.mockRejectedValueOnce(new Error('Network error'));

      renderDealDetail();

      // Should show error first
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch deal details/i)).toBeInTheDocument();
      });

      // Second render - API call succeeds (simulating user retry/refresh)
      api.get.mockResolvedValueOnce({ data: mockDealDetail });

      // Simulate a fresh component mount (like user refresh)
      renderDealDetail();

      // Should show data on retry
      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Role-Based Access Control', () => {
    it('displays deal details for Sales Manager', async () => {
      api.get.mockResolvedValue({ data: mockDealDetail });

      renderDealDetail(mockUsers.salesManager);

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      // Sales Manager should see all deal information
      expect(screen.getByText('Deal Information')).toBeInTheDocument();
      expect(screen.getByText('Associated Parties')).toBeInTheDocument();
      expect(screen.getByText('$150,000.00')).toBeInTheDocument();
    });

    it('displays deal details for Sales Rep', async () => {
      api.get.mockResolvedValue({ data: mockDealDetail });

      renderDealDetail(mockUsers.salesRep);

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      // Sales Rep should also see deal information (backend handles filtering)
      expect(screen.getByText('Deal Information')).toBeInTheDocument();
      expect(screen.getByText('Associated Parties')).toBeInTheDocument();
    });

    it('handles unauthorized access gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue({
        response: { status: 403, data: { message: 'You do not have permission to view this deal' } }
      });

      renderDealDetail(mockUsers.salesRep);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch deal details.*permission/i)).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Component State Management', () => {
    it('resets state when deal ID changes', async () => {
      // First render with deal 1
      api.get.mockResolvedValue({ data: mockDealDetail });
      const { rerender } = renderDealDetail(mockUsers.salesManager, '1');

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      // Change to deal 2
      api.get.mockResolvedValue({ data: mockCompleteDeal });
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '3' });

      rerender(
        <DealDetail />
      );

      await waitFor(() => {
        expect(screen.getByText('Complex Enterprise Deal')).toBeInTheDocument();
      });

      expect(api.get).toHaveBeenCalledWith('/api/deals/3/');
    });

    it('shows loading state on deal ID change', async () => {
      // First render
      api.get.mockResolvedValue({ data: mockDealDetail });
      const { rerender } = renderDealDetail(mockUsers.salesManager, '1');

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      // Change deal ID and simulate loading
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { useParams } = require('react-router-dom');
      useParams.mockReturnValue({ id: '2' });

      rerender(
        <DealDetail />
      );

      expect(screen.getByText('Loading deal details...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      api.get.mockResolvedValue({ data: mockDealDetail });
    });

    it('has proper heading structure', async () => {
      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: 'Enterprise Software Implementation' })).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 3, name: 'Deal Information' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Associated Parties' })).toBeInTheDocument();
    });

    it('has accessible navigation button', async () => {
      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
      // Button element without explicit type attribute defaults to 'button'
      expect(backButton.tagName).toBe('BUTTON');
    });

    it('provides meaningful text content for screen readers', async () => {
      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('Enterprise Software Implementation')).toBeInTheDocument();
      });

      // Check that information is properly labeled
      expect(screen.getByText('Owner:')).toBeInTheDocument();
      expect(screen.getByText('Value:')).toBeInTheDocument();
      expect(screen.getByText('Stage:')).toBeInTheDocument();
      expect(screen.getByText('Expected Close Date:')).toBeInTheDocument();
      expect(screen.getByText('Account:')).toBeInTheDocument();
      expect(screen.getByText('Primary Contact:')).toBeInTheDocument();
    });

    it('handles keyboard navigation', async () => {
      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back/i });
      backButton.focus();
      expect(backButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large deal titles efficiently', async () => {
      const dealWithLongTitle = {
        ...mockDealDetail,
        title: 'A'.repeat(500) // Very long title
      };

      api.get.mockResolvedValue({ data: dealWithLongTitle });

      const startTime = performance.now();
      renderDealDetail();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render quickly

      await waitFor(() => {
        expect(screen.getByText(dealWithLongTitle.title)).toBeInTheDocument();
      });
    });

    it('handles special characters in deal data', async () => {
      const dealWithSpecialChars = {
        ...mockDealDetail,
        title: 'Deal with & Special <Characters> "Quotes" \'Apostrophes\'',
        account_name: 'Company with émojis 🚀 & symbols',
        primary_contact_name: 'John O\'Connor & Associates'
      };

      api.get.mockResolvedValue({ data: dealWithSpecialChars });

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('Deal with & Special <Characters> "Quotes" \'Apostrophes\'')).toBeInTheDocument();
      });

      expect(screen.getByText('Company with émojis 🚀 & symbols')).toBeInTheDocument();
      expect(screen.getByText('John O\'Connor & Associates')).toBeInTheDocument();
    });

    it('handles missing deal gracefully', async () => {
      api.get.mockResolvedValue({ data: null });

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('No deal found.')).toBeInTheDocument();
      });
    });

    it('handles malformed API response', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockResolvedValue({}); // No 'data' property

      renderDealDetail();

      await waitFor(() => {
        expect(screen.getByText('No deal found.')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });
});
