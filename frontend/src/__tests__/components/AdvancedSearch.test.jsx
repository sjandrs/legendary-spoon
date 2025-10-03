import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { renderWithProviders } from '../helpers/test-utils';
import AdvancedSearch from '../../components/AdvancedSearch';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

const mockApi = require('../../api');

// Mock react-router-dom hooks
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

describe('AdvancedSearch', () => {
  const user = userEvent.setup();
  const mockOnSearch = jest.fn();
  const mockOnSaveSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear all URL parameters
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key);
    }
    mockApi.get.mockResolvedValue({ data: {} });
    mockApi.post.mockResolvedValue({ data: { id: 1, name: 'Test Search' } });
  });

  describe('Component Rendering', () => {
    it('renders advanced search with all main sections', () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
      expect(screen.getByText('Save Search')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter search terms...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Global Search')).toBeInTheDocument();
    });

    it('renders search type selector with all options', () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      expect(searchTypeSelect).toBeInTheDocument();

      // Check all options are present
      expect(screen.getByText('Global Search')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Contacts')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Deals')).toBeInTheDocument();
      expect(screen.getByText('Quotes')).toBeInTheDocument();
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    it('shows sort options when search type is not global', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        expect(screen.getByText('Sort by:')).toBeInTheDocument();
        expect(screen.getByText('Order:')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Created Date')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Descending')).toBeInTheDocument();
      });
    });

    it('loads URL parameters on component mount', () => {
      mockSearchParams.set('q', 'test query');
      mockSearchParams.set('type', 'contacts');
      mockSearchParams.set('filter_status', 'active');

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('handles basic search execution', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      const searchButton = screen.getByText('Search');

      await user.type(searchInput, 'test query');
      await user.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: 'test query',
        type: 'global',
        filters: {},
        sort_by: 'created_at',
        sort_order: 'desc',
        offset: 0,
        limit: 50
      });
    });

    it('handles search with specific type and filters', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          contacts: {
            text_filters: ['name', 'email'],
            choice_filters: { status: ['active', 'inactive'] },
            date_filters: ['created_at'],
            number_filters: []
          }
        }
      });

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      // Change search type
      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      // Wait for filters to load
      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/search/filters/?entity_type=contacts');
      });

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'john doe');

      const searchButton = screen.getByText('Search');
      await user.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: 'john doe',
        type: 'contacts',
        filters: {},
        sort_by: 'created_at',
        sort_order: 'desc',
        offset: 0,
        limit: 50
      });
    });

    it('disables search button during loading', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      // Mock loading state by not resolving the promise immediately
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSearch.mockReturnValue(promise);

      const searchButton = screen.getByText('Search');
      await user.click(searchButton);

      // Button should show loading state
      expect(screen.getByText('Searching...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise();
      await waitFor(() => {
        expect(screen.getByText('Search')).toBeInTheDocument();
      });
    });
  });

  describe('Search Suggestions', () => {
    it('shows suggestions when typing query with 2+ characters', async () => {
      const suggestions = ['John Doe', 'Jane Smith', 'Acme Corp'];
      mockApi.get.mockResolvedValue({ data: { suggestions } });

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'jo');

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith(
          '/api/search/suggestions/?q=jo&type=global'
        );
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
    });

    it('does not show suggestions for queries less than 2 characters', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'j');

      // Should not make API call
      expect(mockApi.get).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/search/suggestions/')
      );
    });

    it('allows selecting suggestions', async () => {
      const suggestions = ['John Doe', 'Jane Smith'];
      mockApi.get.mockResolvedValue({ data: { suggestions } });

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'jo');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const suggestion = screen.getByText('John Doe');
      await user.click(suggestion);

      expect(searchInput).toHaveValue('John Doe');
    });

    it('handles suggestion API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test');

      // Should not crash and should not show suggestions
      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Advanced Filters', () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          contacts: {
            text_filters: ['name', 'email'],
            choice_filters: {
              status: ['active', 'inactive'],
              priority: ['high', 'medium', 'low']
            },
            date_filters: ['created_at', 'updated_at'],
            number_filters: ['value']
          }
        }
      });
    });

    it('shows filters section when search type is not global', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });
    });

    it('loads and displays text filters', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      // Click to expand filters
      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Filter by name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Filter by email')).toBeInTheDocument();
      });
    });

    it('loads and displays choice filters', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      // Click to expand filters
      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Priority')).toBeInTheDocument();
        expect(screen.getByText('All Status')).toBeInTheDocument();
        expect(screen.getByText('All Priority')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('high')).toBeInTheDocument();
      });
    });

    it('loads and displays date filters', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(() => {
        expect(screen.getByText('Created At Range')).toBeInTheDocument();
        expect(screen.getByText('Updated At Range')).toBeInTheDocument();

        const dateInputs = screen.getAllByDisplayValue('');
        const dateInputElements = dateInputs.filter(input => input.type === 'date');
        expect(dateInputElements).toHaveLength(4); // 2 filters * 2 inputs each
      });
    });

    it('loads and displays number filters', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(() => {
        expect(screen.getByText('Value Range')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
      });
    });

    it('applies filter values to search', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(async () => {
        const nameFilter = screen.getByPlaceholderText('Filter by name');
        await user.type(nameFilter, 'John');

        const statusFilter = screen.getByDisplayValue('All Status');
        await user.selectOptions(statusFilter, 'active');
      });

      const searchButton = screen.getByText('Search');
      await user.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: '',
        type: 'contacts',
        filters: {
          name: 'John',
          status: 'active'
        },
        sort_by: 'created_at',
        sort_order: 'desc',
        offset: 0,
        limit: 50
      });
    });
  });

  describe('Sort Options', () => {
    it('shows sort options for specific search types', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'tasks');

      await waitFor(() => {
        const sortBySelect = screen.getByDisplayValue('Created Date');
        expect(sortBySelect).toBeInTheDocument();
        expect(screen.getByText('Due Date')).toBeInTheDocument(); // Tasks have due date option
      });
    });

    it('shows deal-specific sort options', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'deals');

      await waitFor(() => {
        expect(screen.getByText('Value')).toBeInTheDocument(); // Deals have value option
      });
    });

    it('applies sort options to search', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(async () => {
        const sortBySelect = screen.getByDisplayValue('Created Date');
        await user.selectOptions(sortBySelect, 'name');

        const sortOrderSelect = screen.getByDisplayValue('Descending');
        await user.selectOptions(sortOrderSelect, 'asc');
      });

      const searchButton = screen.getByText('Search');
      await user.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalledWith({
        q: '',
        type: 'contacts',
        filters: {},
        sort_by: 'name',
        sort_order: 'asc',
        offset: 0,
        limit: 50
      });
    });
  });

  describe('Clear Functionality', () => {
    it('clears all filters and search query', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test query');

      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('resets filters after clearing', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          contacts: {
            text_filters: ['name'],
            choice_filters: { status: ['active', 'inactive'] }
          }
        }
      });

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(async () => {
        const nameFilter = screen.getByPlaceholderText('Filter by name');
        await user.type(nameFilter, 'John');
      });

      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      await waitFor(() => {
        const nameFilter = screen.getByPlaceholderText('Filter by name');
        expect(nameFilter).toHaveValue('');
      });
    });
  });

  describe('Save Search Functionality', () => {
    it('disables save button when no query or filters', () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const saveButton = screen.getByRole('button', { name: 'Save Search' });
      expect(saveButton).toBeDisabled();
    });

    it('enables save button when query is present', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test');

      const saveButton = screen.getByText('Save Search');
      expect(saveButton).not.toBeDisabled();
    });

    it('shows save search modal when save button is clicked', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test query');

      const saveButton = screen.getByRole('button', { name: 'Save Search' });
      await user.click(saveButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByText('Make this search public (available to all users)')).toBeInTheDocument();
    });

    it('saves search with correct parameters', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test query');

      const saveButton = screen.getByText('Save Search');
      await user.click(saveButton);

      const nameInput = screen.getByPlaceholderText('Enter search name');
      await user.type(nameInput, 'My Test Search');

      const descriptionInput = screen.getByPlaceholderText('Describe this search (optional)');
      await user.type(descriptionInput, 'This is a test search');

      const publicCheckbox = screen.getByRole('checkbox', { name: /Make this search public/ });
      await user.click(publicCheckbox);

      const saveSubmitButton = screen.getByTestId('save-search-submit');
      await user.click(saveSubmitButton);

      expect(mockApi.post).toHaveBeenCalledWith('/api/saved-searches/', {
        name: 'My Test Search',
        description: 'This is a test search',
        search_type: 'global',
        search_query: 'test query',
        filters: {},
        sort_by: 'created_at',
        sort_order: 'desc',
        is_public: true
      });

      expect(mockOnSaveSearch).toHaveBeenCalledWith({
        id: 1,
        name: 'Test Search'
      });
    });

    it('closes save modal when cancel is clicked', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test query');

      const saveButton = screen.getByRole('button', { name: 'Save Search' });
      await user.click(saveButton);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByLabelText('Name *')).not.toBeInTheDocument();
    });

    it('requires name field for saving', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test query');

      const saveButton = screen.getByRole('button', { name: 'Save Search' });
      await user.click(saveButton);

      const saveSubmitButton = screen.getByTestId('save-search-submit');
      await user.click(saveSubmitButton);

      // Should not call API without name
      expect(mockApi.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles filter loading errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      // Should not crash and should still show the component
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    });

    it('handles save search errors gracefully', async () => {
      mockApi.post.mockRejectedValue(new Error('Save failed'));

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      await user.type(searchInput, 'test query');

      const saveButton = screen.getByRole('button', { name: 'Save Search' });
      await user.click(saveButton);

      const nameInput = screen.getByPlaceholderText('Enter search name');
      await user.type(nameInput, 'Test Search');

      const saveSubmitButton = screen.getByTestId('save-search-submit');
      await user.click(saveSubmitButton);

      // Should attempt to save but handle error gracefully
      expect(mockApi.post).toHaveBeenCalled();
      expect(mockOnSaveSearch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      expect(screen.getByRole('heading', { name: 'Advanced Search' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /Enter search terms/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Search type selector
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    });

    it('has keyboard navigation support', async () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');

      // Focus should be manageable
      searchInput.focus();
      expect(searchInput).toHaveFocus();

      // Tab navigation should work - focus moves to next focusable element
      await user.tab();
      // After search input, focus should move to next focusable element (could be search type select or search button)
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeTruthy();
      expect(focusedElement).not.toBe(searchInput);
    });

    it('provides proper ARIA attributes', () => {
      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchInput = screen.getByPlaceholderText('Enter search terms...');
      expect(searchInput).toHaveAttribute('type', 'text');

      const searchButton = screen.getByRole('button', { name: 'Search' });
      expect(searchButton).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly with complex filter configuration', () => {
      const startTime = performance.now();

      mockApi.get.mockResolvedValue({
        data: {
          contacts: {
            text_filters: Array.from({ length: 10 }, (_, i) => `field_${i}`),
            choice_filters: Object.fromEntries(
              Array.from({ length: 5 }, (_, i) => [`choice_${i}`, ['option1', 'option2', 'option3']])
            ),
            date_filters: Array.from({ length: 5 }, (_, i) => `date_${i}`),
            number_filters: Array.from({ length: 3 }, (_, i) => `number_${i}`)
          }
        }
      });

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    });

    it('handles rapid filter changes efficiently', async () => {
      mockApi.get.mockResolvedValue({
        data: {
          contacts: {
            text_filters: ['name', 'email'],
            choice_filters: { status: ['active', 'inactive'] }
          }
        }
      });

      renderWithProviders(
        <AdvancedSearch onSearch={mockOnSearch} onSaveSearch={mockOnSaveSearch} />
      );

      const searchTypeSelect = screen.getByDisplayValue('Global Search');
      await user.selectOptions(searchTypeSelect, 'contacts');

      await waitFor(() => {
        const filtersToggle = screen.getByText('Filters');
        fireEvent.click(filtersToggle);
      });

      await waitFor(async () => {
        const nameFilter = screen.getByPlaceholderText('Filter by name');

        // Rapid typing should not cause issues
        await user.type(nameFilter, 'abcdef');
        await user.clear(nameFilter);
        await user.type(nameFilter, 'xyz');
      });

      // Component should still be responsive
      expect(screen.getByPlaceholderText('Filter by name')).toHaveValue('xyz');
    });
  });
});
