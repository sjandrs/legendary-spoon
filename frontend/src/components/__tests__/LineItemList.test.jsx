import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, testComponentAccessibility } from '../../__tests__/helpers/test-utils';
import LineItemList from '../LineItemList';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  getLineItems: jest.fn(),
}));
const mockedApi = api;

describe('LineItemList Component', () => {
  const mockLineItems = [
    {
      id: 1,
      work_order: 'WO-001',
      description: 'Installation Service',
      quantity: 2,
      unit_price: 150.00,
      total: 300.00
    },
    {
      id: 2,
      work_order: 'WO-002',
      description: 'Parts Replacement',
      quantity: 1,
      unit_price: 75.50,
      total: 75.50
    },
    {
      id: 3,
      work_order: 'WO-001',
      description: 'Diagnostic Fee',
      quantity: 1,
      unit_price: 95.00,
      total: 95.00
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading state initially', () => {
      mockedApi.getLineItems.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithProviders(<LineItemList />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('transitions from loading to loaded state', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('renders table with correct headers', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Work Order')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
        expect(screen.getByText('Unit Price')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    it('displays line item data correctly', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        // Check specific cells by their position or use more specific queries
        expect(screen.getByText('Installation Service')).toBeInTheDocument();
        expect(screen.getByText('Parts Replacement')).toBeInTheDocument();
        expect(screen.getByText('Diagnostic Fee')).toBeInTheDocument();

        // Check work orders
        expect(screen.getAllByText('WO-001')).toHaveLength(2);
        expect(screen.getByText('WO-002')).toBeInTheDocument();

        // Check quantities - use getAllByText since "1" appears three times (ID, quantity, quantity)
        expect(screen.getAllByText('1')).toHaveLength(3);
        expect(screen.getAllByText('2')).toHaveLength(2);  // quantity for item 1, ID for item 2

        // Check prices and totals
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getAllByText('75.5')).toHaveLength(2);  // unit_price and total for Parts Replacement
        expect(screen.getAllByText('95')).toHaveLength(2);  // unit_price and total for Diagnostic Fee
        expect(screen.getByText('300')).toBeInTheDocument();
      });
    });

    it('applies striped table class', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('striped-table');
      });
    });
  });

  describe('API Integration', () => {
    it('calls getLineItems on mount', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(mockedApi.getLineItems).toHaveBeenCalledTimes(1);
        expect(mockedApi.getLineItems).toHaveBeenCalledWith();
      });
    });

    it('handles paginated response format', async () => {
      const paginatedResponse = {
        data: {
          results: mockLineItems,
          count: 3,
          next: null,
          previous: null
        }
      };

      mockedApi.getLineItems.mockResolvedValue(paginatedResponse);

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByText('Installation Service')).toBeInTheDocument();
        expect(screen.getByText('Parts Replacement')).toBeInTheDocument();
        expect(screen.getByText('Diagnostic Fee')).toBeInTheDocument();
      });
    });

    it('handles direct array response format', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByText('Installation Service')).toBeInTheDocument();
        expect(screen.getByText('Parts Replacement')).toBeInTheDocument();
        expect(screen.getByText('Diagnostic Fee')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedApi.getLineItems.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch line items:', expect.any(Error));
      });

      // Should still render table structure even with error
      expect(screen.getByRole('table')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles malformed response data', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: null // Malformed response
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        // Should render empty table
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('Installation Service')).not.toBeInTheDocument();
      });
    });

    it('handles non-object response data', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: 'invalid response'
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        // Should render empty table
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('Installation Service')).not.toBeInTheDocument();
      });
    });

    it('handles empty results array', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: {
          results: []
        }
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        // Should render table with no rows
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.queryByText('Installation Service')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('renders table structure with no line items', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: []
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Work Order')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
        expect(screen.getByText('Unit Price')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
      });
    });

    it('handles empty paginated response', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: {
          results: [],
          count: 0
        }
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        // Header row should exist
        expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
      });
    });
  });

  describe('Data Transformation', () => {
    it('handles line items with missing fields gracefully', async () => {
      const incompleteItems = [
        { id: 1, work_order: 'WO-001', description: 'Test Item' }, // Missing quantity, unit_price, total
        { id: 2, quantity: 1, unit_price: 10.00 }, // Missing work_order, description, total
        { id: 3, total: 50.00 } // Missing other fields
      ];

      mockedApi.getLineItems.mockResolvedValue({
        data: incompleteItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        // Should handle undefined values gracefully - check that table renders
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('displays numeric values correctly', async () => {
      const numericItems = [
        { id: 1, work_order: 'WO-001', description: 'Item 1', quantity: 1, unit_price: 10.00, total: 10.00 },
        { id: 2, work_order: 'WO-002', description: 'Item 2', quantity: 2, unit_price: 15.50, total: 31.00 },
        { id: 3, work_order: 'WO-003', description: 'Item 3', quantity: 0, unit_price: 0.00, total: 0.00 }
      ];

      mockedApi.getLineItems.mockResolvedValue({
        data: numericItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();

        // Check specific values that are unique
        expect(screen.getByText('15.5')).toBeInTheDocument();
        expect(screen.getByText('31')).toBeInTheDocument();
        expect(screen.getAllByText('10')).toHaveLength(2); // quantity and total for item 1
        expect(screen.getAllByText('0')).toHaveLength(3); // quantity, unit_price, and total for item 3
      });
    });
  });

  describe('Performance', () => {
    it('renders large line item lists efficiently', async () => {
      const largeItemList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        work_order: `WO-${String(i + 1).padStart(3, '0')}`,
        description: `Service Item ${i + 1}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unit_price: Math.round((Math.random() * 500 + 10) * 100) / 100,
        total: 0 // Would be calculated on backend
      }));

      mockedApi.getLineItems.mockResolvedValue({
        data: largeItemList
      });

      const startTime = performance.now();
      renderWithProviders(<LineItemList />);
      const endTime = performance.now();

      // Initial render should be fast
      expect(endTime - startTime).toBeLessThan(100);

      await waitFor(() => {
        expect(screen.getByText('Service Item 1')).toBeInTheDocument();
        expect(screen.getByText('Service Item 100')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      await testComponentAccessibility(<LineItemList />);
    });

    it('has proper table structure', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Work Order' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Quantity' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Unit Price' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
      });
    });

    it('has proper table data cells', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        // Should have proper table cell structure
        const cells = screen.getAllByRole('cell');
        expect(cells.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('only calls API once on mount', async () => {
      mockedApi.getLineItems.mockResolvedValue({
        data: mockLineItems
      });

      const { rerender } = renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(mockedApi.getLineItems).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger additional API calls
      rerender(<LineItemList />);

      expect(mockedApi.getLineItems).toHaveBeenCalledTimes(1);
    });

    it('handles component unmounting during API call', async () => {
      mockedApi.getLineItems.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: mockLineItems }), 100))
      );

      const { unmount } = renderWithProviders(<LineItemList />);

      // Unmount before API resolves
      unmount();

      // Should not cause any errors
      await new Promise(resolve => setTimeout(resolve, 200));
    });
  });

  describe('Data Consistency', () => {
    it('displays line items in correct order', async () => {
      const orderedItems = [
        { id: 1, work_order: 'WO-001', description: 'First Item', quantity: 1, unit_price: 10.00, total: 10.00 },
        { id: 2, work_order: 'WO-002', description: 'Second Item', quantity: 2, unit_price: 15.00, total: 30.00 },
        { id: 3, work_order: 'WO-003', description: 'Third Item', quantity: 1, unit_price: 20.00, total: 20.00 }
      ];

      mockedApi.getLineItems.mockResolvedValue({
        data: orderedItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // First row is header, then data rows
        expect(rows[1]).toHaveTextContent('1');
        expect(rows[1]).toHaveTextContent('First Item');
        expect(rows[2]).toHaveTextContent('2');
        expect(rows[2]).toHaveTextContent('Second Item');
        expect(rows[3]).toHaveTextContent('3');
        expect(rows[3]).toHaveTextContent('Third Item');
      });
    });

    it('handles duplicate work orders', async () => {
      const itemsWithDuplicates = [
        { id: 1, work_order: 'WO-001', description: 'Item A', quantity: 1, unit_price: 10.00, total: 10.00 },
        { id: 2, work_order: 'WO-001', description: 'Item B', quantity: 2, unit_price: 15.00, total: 30.00 },
        { id: 3, work_order: 'WO-002', description: 'Item C', quantity: 1, unit_price: 20.00, total: 20.00 }
      ];

      mockedApi.getLineItems.mockResolvedValue({
        data: itemsWithDuplicates
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        // Should display all items even with duplicate work orders
        expect(screen.getAllByText('WO-001')).toHaveLength(2);
        expect(screen.getByText('WO-002')).toBeInTheDocument();
      });
    });
  });

  describe('Financial Calculations', () => {
    it('displays total calculations correctly', async () => {
      const calculationItems = [
        { id: 1, work_order: 'WO-001', description: 'Simple Item', quantity: 1, unit_price: 100.00, total: 100.00 },
        { id: 2, work_order: 'WO-002', description: 'Multi Quantity', quantity: 3, unit_price: 25.00, total: 75.00 },
        { id: 3, work_order: 'WO-003', description: 'Decimal Price', quantity: 2, unit_price: 12.50, total: 25.00 }
      ];

      mockedApi.getLineItems.mockResolvedValue({
        data: calculationItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByText('Simple Item')).toBeInTheDocument();
        expect(screen.getByText('Multi Quantity')).toBeInTheDocument();
        expect(screen.getByText('Decimal Price')).toBeInTheDocument();

        // Check unique values
        expect(screen.getByText('75')).toBeInTheDocument();  // 3 * 25.00
        expect(screen.getAllByText('25')).toHaveLength(2);  // unit_price for item 3 and total for item 3
        expect(screen.getAllByText('100')).toHaveLength(2); // unit_price and total for item 1
      });
    });

    it('handles zero and negative values appropriately', async () => {
      const edgeCaseItems = [
        { id: 1, work_order: 'WO-001', description: 'Free Item', quantity: 1, unit_price: 0.00, total: 0.00 },
        { id: 2, work_order: 'WO-002', description: 'Discount Item', quantity: 1, unit_price: -10.00, total: -10.00 },
        { id: 3, work_order: 'WO-003', description: 'Zero Quantity', quantity: 0, unit_price: 50.00, total: 0.00 }
      ];

      mockedApi.getLineItems.mockResolvedValue({
        data: edgeCaseItems
      });

      renderWithProviders(<LineItemList />);

      await waitFor(() => {
        expect(screen.getByText('Free Item')).toBeInTheDocument();
        expect(screen.getByText('Discount Item')).toBeInTheDocument();
        expect(screen.getByText('Zero Quantity')).toBeInTheDocument();

        // Check unique negative value
        expect(screen.getAllByText('-10')).toHaveLength(2);  // unit_price and total for discount item
        // Check that zero appears multiple times (unit_price and total for free item, quantity and total for zero quantity)
        expect(screen.getAllByText('0')).toHaveLength(4);
      });
    });
  });
});
