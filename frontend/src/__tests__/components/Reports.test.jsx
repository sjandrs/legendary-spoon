import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from '../../components/Reports';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('Reports', () => {
  const user = userEvent.setup();

  const mockBalanceSheetData = {
    as_of_date: '2024-12-31',
    assets: {
      'Cash': 50000.00,
      'Accounts Receivable': 25000.00,
    },
    liabilities: {
      'Accounts Payable': 12000.00,
    },
    equity: {
      'Owner Equity': 63000.00,
    },
    total_assets: 75000.00,
    total_liabilities: 12000.00,
    total_equity: 63000.00
  };

  const mockProfitLossData = {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    revenue: {
      'Service Revenue': 180000.00,
    },
    expenses: {
      'Cost of Goods Sold': 120000.00,
    },
    total_revenue: 320000.00,
    total_expenses: 230000.00,
    net_profit: 90000.00
  };

  const mockCashFlowData = {
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    operating_activities: {
      'Cash from Operations': 85000.00,
    },
    investing_activities: {
      'Equipment Purchase': -15000.00,
    },
    financing_activities: {
      'Loan Payment': -25000.00,
    },
    net_cash_flow: 45000.00
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default API mocks
    api.default.get.mockImplementation((url) => {
      if (url.includes('/api/reports/balance-sheet/')) {
        return Promise.resolve({ data: mockBalanceSheetData });
      } else if (url.includes('/api/reports/pnl/')) {
        return Promise.resolve({ data: mockProfitLossData });
      } else if (url.includes('/api/reports/cash-flow/')) {
        return Promise.resolve({ data: mockCashFlowData });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe('Component Rendering', () => {
    it('renders without crashing', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Financial Reports')).toBeInTheDocument();
      });
    });

    it('renders date filter controls', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByLabelText(/balance sheet as of/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/period start/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/period end/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /refresh reports/i })).toBeInTheDocument();
      });
    });

    it('renders report tab navigation', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /balance sheet/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /profit & loss/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cash flow/i })).toBeInTheDocument();
      });
    });

    it('renders balance sheet by default', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /balance sheet \(as of 2024-12-31\)/i })).toBeInTheDocument();
        expect(screen.getByText('Assets')).toBeInTheDocument();
        expect(screen.getByText('Liabilities')).toBeInTheDocument();
        expect(screen.getByText('Equity')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches all reports on component mount', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(api.default.get).toHaveBeenCalledTimes(3);
        expect(api.default.get).toHaveBeenCalledWith(expect.stringContaining('/api/reports/balance-sheet/'));
        expect(api.default.get).toHaveBeenCalledWith(expect.stringContaining('/api/reports/pnl/'));
        expect(api.default.get).toHaveBeenCalledWith(expect.stringContaining('/api/reports/cash-flow/'));
      });
    });

    it('handles API errors gracefully', async () => {
      api.default.get.mockRejectedValue(new Error('Network error'));

      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load reports. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Balance Sheet Report', () => {
    it('displays balance sheet data correctly', async () => {
      render(<Reports />);

      await waitFor(() => {
        // Check that main sections exist
        expect(screen.getByText('Assets')).toBeInTheDocument();
        expect(screen.getByText('Liabilities')).toBeInTheDocument();
        expect(screen.getByText('Equity')).toBeInTheDocument();

        // Check specific line items
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Accounts Receivable')).toBeInTheDocument();
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
        expect(screen.getByText('Owner Equity')).toBeInTheDocument();

        // Check total labels
        expect(screen.getByText('Total Assets')).toBeInTheDocument();
        expect(screen.getByText('Total Liabilities')).toBeInTheDocument();
        expect(screen.getByText('Total Equity')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches to profit & loss tab', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /balance sheet/i })).toBeInTheDocument();
      });

      const pnlTab = screen.getByRole('button', { name: /profit & loss/i });
      await user.click(pnlTab);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /profit & loss \(2024-01-01 to 2024-12-31\)/i })).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Expenses')).toBeInTheDocument();
      });
    });

    it('switches to cash flow tab', async () => {
      render(<Reports />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /balance sheet/i })).toBeInTheDocument();
      });

      const cashFlowTab = screen.getByRole('button', { name: /cash flow/i });
      await user.click(cashFlowTab);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /cash flow statement \(2024-01-01 to 2024-12-31\)/i })).toBeInTheDocument();
        expect(screen.getByText('Operating Activities')).toBeInTheDocument();
      });
    });
  });
});
