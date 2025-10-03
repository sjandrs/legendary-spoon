import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaxReport from '../../components/TaxReport';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock window.print for export functionality
const mockWindowPrint = jest.fn();
Object.defineProperty(window, 'print', {
  value: mockWindowPrint,
  writable: true,
});

// Mock window.alert for export functionality
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
});

describe('TaxReport', () => {
  const user = userEvent.setup();
  const mockTaxData = {
    contractorPayments: [
      {
        id: 1,
        name: 'John Smith Construction',
        tax_id: '123-45-6789',
        total_payments: 1250.00
      },
      {
        id: 2,
        name: 'ABC Consulting',
        tax_id: '98-7654321',
        total_payments: 450.00
      },
      {
        id: 3,
        name: 'Tech Solutions LLC',
        tax_id: null,
        total_payments: 750.00
      }
    ],
    salesTax: {
      total_sales: 125000.00,
      tax_collected: 10625.00,
      tax_rate: 0.085
    },
    expensesByCategory: [
      {
        category: 'office_supplies',
        total: 2500.00
      },
      {
        category: 'travel_expense',
        total: 3750.00
      },
      {
        category: 'equipment',
        total: 8250.00
      }
    ],
    totalRevenue: 125000.00,
    totalExpenses: 14500.00,
    netIncome: 110500.00,
    estimatedTax: 27625.00
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.default.get.mockResolvedValue({ data: mockTaxData });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      api.default.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<TaxReport />);
      expect(screen.getByText('Loading tax reports...')).toBeInTheDocument();
    });

    it('renders tax report header with current year', async () => {
      render(<TaxReport />);
      const currentYear = new Date().getFullYear();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(`Tax Reporting - ${currentYear}`);
      });
    });

    it('renders year selector with correct options', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const yearSelect = screen.getByLabelText('Tax Year:');
        expect(yearSelect).toBeInTheDocument();

        const currentYear = new Date().getFullYear();
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(3); // Current year, previous year, year before
        expect(options[0]).toHaveValue((currentYear - 2).toString());
        expect(options[1]).toHaveValue((currentYear - 1).toString());
        expect(options[2]).toHaveValue(currentYear.toString());
      });
    });

    it('renders all tax report sections when data is loaded', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('1099 Contractor Payments')).toBeInTheDocument();
        expect(screen.getByText('Sales Tax Collected')).toBeInTheDocument();
        expect(screen.getByText('Business Expenses')).toBeInTheDocument();
        expect(screen.getByText('Tax Year Summary')).toBeInTheDocument();
        expect(screen.getByText('Export Tax Data')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('fetches tax data on component mount', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(api.default.get).toHaveBeenCalledWith('/api/tax-report/?year=' + new Date().getFullYear());
      });
    });

    it('handles API errors gracefully', async () => {
      api.default.get.mockRejectedValue(new Error('Network error'));

      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load tax data')).toBeInTheDocument();
        expect(screen.getByText('Failed to load tax data')).toHaveClass('error-message');
      });
    });

    it('refetches data when year changes', async () => {
      const user = userEvent.setup();
      render(<TaxReport />);

      // Wait for the initial data to load and the year selector to appear
      await waitFor(() => {
        expect(api.default.get).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('heading', { name: /tax reporting/i })).toBeInTheDocument();
      });

      const yearSelect = screen.getByLabelText('Tax Year:');
      await user.selectOptions(yearSelect, (new Date().getFullYear() - 1).toString());

      await waitFor(() => {
        expect(api.default.get).toHaveBeenCalledTimes(2);
        expect(api.default.get).toHaveBeenLastCalledWith('/api/tax-report/?year=' + (new Date().getFullYear() - 1));
      });
    });
  });

  describe('1099 Contractor Payments Section', () => {
    it('displays contractor payments table with correct data', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        // Check table headers
        expect(screen.getByText('Contractor')).toBeInTheDocument();
        expect(screen.getByText('SSN/EIN')).toBeInTheDocument();
        expect(screen.getByText('Total Payments')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();

        // Check contractor data
        expect(screen.getByText('John Smith Construction')).toBeInTheDocument();
        expect(screen.getByText('123-45-6789')).toBeInTheDocument();
        expect(screen.getByText('$1,250.00')).toBeInTheDocument();

        expect(screen.getByText('ABC Consulting')).toBeInTheDocument();
        expect(screen.getByText('98-7654321')).toBeInTheDocument();
        expect(screen.getByText('$450.00')).toBeInTheDocument();

        expect(screen.getByText('Tech Solutions LLC')).toBeInTheDocument();
        expect(screen.getByText('Not provided')).toBeInTheDocument();
        expect(screen.getByText('$750.00')).toBeInTheDocument();
      });
    });

    it('shows Generate 1099 button only for payments >= $600', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const generate1099Buttons = screen.getAllByText('Generate 1099');
        expect(generate1099Buttons).toHaveLength(2); // John Smith ($1250) and Tech Solutions ($750)

        // ABC Consulting with $450 should not have a button
        const abcRow = screen.getByText('ABC Consulting').closest('tr');
        expect(abcRow?.querySelector('button')).toBeNull();
      });
    });

    it('displays 1099 note about $600 requirement', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Note: 1099 forms are required for payments of $600 or more to contractors.')).toBeInTheDocument();
        expect(screen.getByText('Note: 1099 forms are required for payments of $600 or more to contractors.')).toHaveClass('tax-note');
      });
    });
  });

  describe('Sales Tax Section', () => {
    it('displays sales tax information correctly', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Sales Tax Collected')).toBeInTheDocument();
        expect(screen.getByText('Total Sales:')).toBeInTheDocument();
        expect(screen.getAllByText('$125,000.00')).toHaveLength(2); // Sales and summary card
        expect(screen.getByText('Tax Collected:')).toBeInTheDocument();
        expect(screen.getByText('$10,625.00')).toBeInTheDocument();
        expect(screen.getByText('Tax Rate:')).toBeInTheDocument();
        expect(screen.getByText('8.50%')).toBeInTheDocument();
      });
    });

    it('formats tax rate as percentage with 2 decimal places', async () => {
      const customTaxData = {
        ...mockTaxData,
        salesTax: {
          ...mockTaxData.salesTax,
          tax_rate: 0.0875 // 8.75%
        }
      };
      api.default.get.mockResolvedValue({ data: customTaxData });

      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('8.75%')).toBeInTheDocument();
      });
    });
  });

  describe('Business Expenses Section', () => {
    it('displays expenses table with formatted categories', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Business Expenses')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Total Amount')).toBeInTheDocument();
        expect(screen.getByText('Percentage of Total')).toBeInTheDocument();

        // Check formatted category names
        expect(screen.getByText('Office Supplies')).toBeInTheDocument();
        expect(screen.getByText('Travel Expense')).toBeInTheDocument();
        expect(screen.getByText('Equipment')).toBeInTheDocument();
      });
    });

    it('calculates and displays correct percentages', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        // office_supplies: 2500/14500 = 17.2%
        expect(screen.getByText('17.2%')).toBeInTheDocument();
        // travel_expense: 3750/14500 = 25.9%
        expect(screen.getByText('25.9%')).toBeInTheDocument();
        // equipment: 8250/14500 = 56.9%
        expect(screen.getByText('56.9%')).toBeInTheDocument();
      });
    });

    it('displays total expenses in footer', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const footer = screen.getByText('Total Expenses').closest('tfoot');
        expect(footer).toBeInTheDocument();
        expect(screen.getAllByText('$14,500.00')).toHaveLength(2); // Footer and summary card
        expect(footer).toContainElement(screen.getByText('100%'));
      });
    });
  });

  describe('Tax Year Summary Section', () => {
    it('displays all summary cards with correct amounts', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Tax Year Summary')).toBeInTheDocument();

        // Revenue card
        const revenueCard = screen.getByText('Revenue').closest('.summary-card');
        expect(revenueCard).toBeInTheDocument();

        // Expenses card
        const expensesCard = screen.getByText('Expenses').closest('.summary-card');
        expect(expensesCard).toBeInTheDocument();

        // Net Income card
        const netIncomeCard = screen.getByText('Net Income').closest('.summary-card');
        expect(netIncomeCard).toBeInTheDocument();

        // Tax Liability card
        const taxLiabilityCard = screen.getByText('Tax Liability (est.)').closest('.summary-card');
        expect(taxLiabilityCard).toContainElement(screen.getByText('Based on 25% effective rate'));
      });
    });

    it('applies positive class for positive net income', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const netIncomeAmount = screen.getByText('$110,500.00');
        expect(netIncomeAmount).toHaveClass('amount', 'positive');
      });
    });

    it('applies negative class for negative net income', async () => {
      const lossData = {
        ...mockTaxData,
        netIncome: -5000.00
      };
      api.default.get.mockResolvedValue({ data: lossData });

      render(<TaxReport />);

      await waitFor(() => {
        const netIncomeAmount = screen.getByText('-$5,000.00');
        expect(netIncomeAmount).toHaveClass('amount', 'negative');
      });
    });
  });

  describe('Export Functionality', () => {
    it('renders all export buttons', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Export Tax Data')).toBeInTheDocument();
        expect(screen.getByText('Print Report')).toBeInTheDocument();
        expect(screen.getByText('Export to CSV')).toBeInTheDocument();
        expect(screen.getByText('Export to PDF')).toBeInTheDocument();
      });
    });

    it('calls window.print when Print Report is clicked', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const printButton = screen.getByText('Print Report');
        expect(printButton).toBeInTheDocument();
      });

      const printButton = screen.getByText('Print Report');
      await user.click(printButton);

      expect(mockWindowPrint).toHaveBeenCalledTimes(1);
    });

    it('shows CSV export alert when Export to CSV is clicked', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const csvButton = screen.getByText('Export to CSV');
        expect(csvButton).toBeInTheDocument();
      });

      const csvButton = screen.getByText('Export to CSV');
      await user.click(csvButton);

      expect(mockAlert).toHaveBeenCalledWith('CSV export functionality to be implemented');
    });

    it('shows PDF export alert when Export to PDF is clicked', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const pdfButton = screen.getByText('Export to PDF');
        expect(pdfButton).toBeInTheDocument();
      });

      const pdfButton = screen.getByText('Export to PDF');
      await user.click(pdfButton);

      expect(mockAlert).toHaveBeenCalledWith('PDF export functionality to be implemented');
    });
  });

  describe('Currency Formatting', () => {
    it('formats all currency values correctly', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        // Check various currency formats with specific contexts
        expect(screen.getByText('$1,250.00')).toBeInTheDocument(); // Contractor payment
        expect(screen.getAllByText('$125,000.00')).toHaveLength(2); // Sales and revenue card
        expect(screen.getByText('$10,625.00')).toBeInTheDocument(); // Tax collected
        expect(screen.getByText('$2,500.00')).toBeInTheDocument(); // Expense amount
        expect(screen.getByText('$110,500.00')).toBeInTheDocument(); // Net income
      });
    });

    it('handles zero amounts correctly', async () => {
      const zeroData = {
        ...mockTaxData,
        salesTax: {
          ...mockTaxData.salesTax,
          tax_collected: 0
        }
      };
      api.default.get.mockResolvedValue({ data: zeroData });

      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 2 });
        expect(mainHeading).toBeInTheDocument();

        const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
        expect(sectionHeadings).toHaveLength(5); // 5 tax sections

        const cardHeadings = screen.getAllByRole('heading', { level: 4 });
        expect(cardHeadings).toHaveLength(4); // 4 summary cards
      });
    });

    it('has accessible form controls', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const yearSelect = screen.getByLabelText('Tax Year:');
        expect(yearSelect).toBeInTheDocument();
        expect(yearSelect.id).toBe('year-select');
      });
    });

    it('has proper table structure', async () => {
      render(<TaxReport />);

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        expect(tables).toHaveLength(2); // Contractor payments and expenses tables

        tables.forEach(table => {
          expect(table).toHaveClass('striped-table');
        });

        // Check for proper table headers
        const contractorHeaders = ['Contractor', 'SSN/EIN', 'Total Payments', 'Actions'];
        contractorHeaders.forEach(header => {
          expect(screen.getByText(header)).toBeInTheDocument();
        });

        const expenseHeaders = ['Category', 'Total Amount', 'Percentage of Total'];
        expenseHeaders.forEach(header => {
          expect(screen.getByText(header)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Performance', () => {
    it('renders within performance budget', async () => {
      const startTime = performance.now();
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Tax Year Summary')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 1000ms for complex tax report
      expect(renderTime).toBeLessThan(1000);
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = {
        ...mockTaxData,
        contractorPayments: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Contractor ${i + 1}`,
          tax_id: `12-345678${i}`,
          total_payments: Math.random() * 10000
        })),
        expensesByCategory: Array.from({ length: 20 }, (_, i) => ({
          category: `category_${i}`,
          total: Math.random() * 5000
        })),
        totalExpenses: 100000 // Add required field
      };

      api.default.get.mockResolvedValue({ data: largeDataset });

      const startTime = performance.now();
      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Tax Year Summary')).toBeInTheDocument();
        // Verify large dataset is actually rendered
        expect(screen.getByText('Contractor 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render efficiently with large datasets
      expect(renderTime).toBeLessThan(3000); // Allow more time for large dataset
    });
  });

  describe('Edge Cases', () => {
    it('handles empty contractor payments', async () => {
      const emptyData = {
        ...mockTaxData,
        contractorPayments: []
      };
      api.default.get.mockResolvedValue({ data: emptyData });

      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('1099 Contractor Payments')).toBeInTheDocument();
        // Tables should still render but contractor table with no data rows
        const tables = screen.getAllByRole('table');
        expect(tables).toHaveLength(2); // Contractor and expenses tables
        expect(tables[0]).toBeInTheDocument(); // Contractor payments table
      });
    });

    it('handles missing tax_id fields', async () => {
      const noTaxIdData = {
        ...mockTaxData,
        contractorPayments: [
          {
            id: 1,
            name: 'No Tax ID Contractor',
            tax_id: null,
            total_payments: 1000.00
          }
        ]
      };
      api.default.get.mockResolvedValue({ data: noTaxIdData });

      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Not provided')).toBeInTheDocument();
      });
    });

    it('handles zero total expenses gracefully', async () => {
      const zeroExpensesData = {
        ...mockTaxData,
        totalExpenses: 0,
        expensesByCategory: []
      };
      api.default.get.mockResolvedValue({ data: zeroExpensesData });

      render(<TaxReport />);

      await waitFor(() => {
        expect(screen.getByText('Business Expenses')).toBeInTheDocument();
        // Should not crash on division by zero
      });
    });
  });
});
