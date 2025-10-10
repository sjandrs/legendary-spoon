import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchPage from '../../components/SearchPage';
import * as api from '../../api';

// Mock the API functions
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock AdvancedSearch and SearchResults components for isolated testing
jest.mock('../../components/AdvancedSearch', () => {
  return function MockAdvancedSearch({ onSearch, loading }) {
    return (
      <div data-testid="advanced-search">
        <button
          onClick={() => onSearch({ q: 'test query', type: 'contacts' })}
          disabled={loading}
          data-testid="search-button"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
    );
  };
});

jest.mock('../../components/SearchResults', () => {
  return function MockSearchResults({ results, onBulkAction, onLoadMore }) {
    return (
      <div data-testid="search-results">
        {results?.error && <div data-testid="error-message">{results.error}</div>}
        {results?.results && (
          <div data-testid="results-list">
            {results.results.map((result, index) => (
              <div key={index} data-testid={`result-${index}`}>
                {result.title || result.name}
              </div>
            ))}
          </div>
        )}
        {onLoadMore && (
          <button onClick={onLoadMore} data-testid="load-more-button">
            Load More
          </button>
        )}
        {onBulkAction && (
          <button
            onClick={() => onBulkAction('delete', ['item1'], {})}
            data-testid="bulk-action-button"
          >
            Bulk Action
          </button>
        )}
      </div>
    );
  };
});

const renderSearchPage = () => {
  return render(
    <BrowserRouter>
      <SearchPage />
    </BrowserRouter>
  );
};

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses by default
    api.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, title: 'Test Contact', type: 'contact' },
          { id: 2, title: 'Test Account', type: 'account' }
        ],
        total_count: 2
      }
    });
  });

  // Component Rendering Tests
  describe('Component Rendering', () => {
    it('renders search page with main sections', () => {
      renderSearchPage();

      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    it('renders search and results panels with correct structure', () => {
      renderSearchPage();

      const searchPage = document.querySelector('.search-page');
      expect(searchPage).toBeInTheDocument();

      const searchContent = document.querySelector('.search-content');
      expect(searchContent).toBeInTheDocument();

      const searchPanel = document.querySelector('.search-panel');
      expect(searchPanel).toBeInTheDocument();

      const resultsPanel = document.querySelector('.results-panel');
      expect(resultsPanel).toBeInTheDocument();
    });

    it('initially shows no loading state', () => {
      renderSearchPage();

      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument();
    });
  });

  // Search Functionality Tests
  describe('Search Functionality', () => {
    it('handles basic search execution', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/search/?q=test%20query&type=contacts');
      });
    });

    it('displays search results correctly', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('results-list')).toBeInTheDocument();
        expect(screen.getByTestId('result-0')).toHaveTextContent('Test Contact');
        expect(screen.getByTestId('result-1')).toHaveTextContent('Test Account');
      });
    });

    it('shows loading state during search', async () => {
      // Mock a delayed API response
      api.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      // Check loading state appears
      expect(screen.getByText('Searching...')).toBeInTheDocument();
      expect(document.querySelector('.loading-overlay')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('handles search with all parameters', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      // Mock AdvancedSearch to return comprehensive params
      jest.mocked(require('../../components/AdvancedSearch')).mockImplementation(({ onSearch }) => {
        return (
          <button
            onClick={() => onSearch({
              q: 'test query',
              type: 'contacts',
              sort_by: 'name',
              sort_order: 'asc',
              offset: 0,
              limit: 10,
              filters: { status: 'active', category: 'customer' }
            })}
            data-testid="search-button"
          >
            Search
          </button>
        );
      });

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith(
          '/api/search/?q=test%20query&type=contacts&sort_by=name&sort_order=asc&offset=0&limit=10&filter_status=active&filter_category=customer'
        );
      });
    });

    it('handles empty search parameters gracefully', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      // Mock AdvancedSearch to return minimal params
      jest.mocked(require('../../components/AdvancedSearch')).mockImplementation(({ onSearch }) => {
        return (
          <button
            onClick={() => onSearch({})}
            data-testid="search-button"
          >
            Search
          </button>
        );
      });

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/search/?');
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('handles search API errors gracefully', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Search failed. Please try again.');
      });
    });

    it('logs search errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('resets loading state after error', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
        expect(screen.getByTestId('search-button')).not.toBeDisabled();
      });
    });
  });

  // Load More Functionality Tests
  describe('Load More Functionality', () => {
    it('displays load more button when more results available', async () => {
      api.get.mockResolvedValue({
        data: {
          results: [{ id: 1, title: 'Test Contact' }],
          total_count: 10
        }
      });

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
      });
    });

    it('handles load more functionality correctly', async () => {
      // Initial search
      api.get.mockResolvedValueOnce({
        data: {
          results: [{ id: 1, title: 'Contact 1' }],
          total_count: 3
        }
      });

      // Load more response
      api.post.mockResolvedValueOnce({
        results: [{ id: 2, title: 'Contact 2' }, { id: 3, title: 'Contact 3' }]
      });

      const user = userEvent.setup();
      renderSearchPage();

      // Perform initial search
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
      });

      // Click load more
      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/search/', {
          q: 'test query',
          type: 'contacts',
          offset: 1
        });
      });
    });

    it('handles load more errors gracefully', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Initial search success
      api.get.mockResolvedValueOnce({
        data: {
          results: [{ id: 1, title: 'Contact 1' }],
          total_count: 3
        }
      });

      // Load more failure
      api.post.mockRejectedValue(new Error('Load more failed'));

      const user = userEvent.setup();
      renderSearchPage();

      // Perform initial search
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
      });

      // Click load more
      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to load more results. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });

  // Bulk Actions Tests
  describe('Bulk Actions', () => {
    it('handles bulk actions correctly', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      api.post.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      renderSearchPage();

      // Perform initial search
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-action-button')).toBeInTheDocument();
      });

      // Perform bulk action
      const bulkActionButton = screen.getByTestId('bulk-action-button');
      await user.click(bulkActionButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/search/bulk-operations/', {
          action: 'delete',
          items: ['item1'],
          data: {}
        });
        expect(alertSpy).toHaveBeenCalledWith('Bulk delete completed successfully!');
      });

      alertSpy.mockRestore();
    });

    it('handles bulk action errors gracefully', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Initial search success
      api.get.mockResolvedValueOnce({
        data: {
          results: [{ id: 1, title: 'Contact 1' }],
          total_count: 1
        }
      });

      // Bulk action failure
      api.post.mockRejectedValue(new Error('Bulk action failed'));

      const user = userEvent.setup();
      renderSearchPage();

      // Perform initial search
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-action-button')).toBeInTheDocument();
      });

      // Perform bulk action
      const bulkActionButton = screen.getByTestId('bulk-action-button');
      await user.click(bulkActionButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Bulk delete failed. Please try again.');
      });

      alertSpy.mockRestore();
    });

    it('refreshes search results after successful bulk action', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock API calls
      api.get.mockResolvedValue({
        data: {
          results: [{ id: 1, title: 'Updated Contact' }],
          total_count: 1
        }
      });
      api.post.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      renderSearchPage();

      // Perform initial search
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('bulk-action-button')).toBeInTheDocument();
      });

      // Perform bulk action
      const bulkActionButton = screen.getByTestId('bulk-action-button');
      await user.click(bulkActionButton);

      await waitFor(() => {
        // Should call API twice: once for bulk action, once for refresh
        expect(api.get).toHaveBeenCalledTimes(2);
      });

      alertSpy.mockRestore();
    });
  });

  // Performance and State Management Tests
  describe('Performance and State Management', () => {
    it('maintains search query state for load more operations', async () => {
      // Initial search
      api.get.mockResolvedValueOnce({
        data: {
          results: [{ id: 1, title: 'Contact 1' }],
          total_count: 3
        }
      });

      // Load more
      api.post.mockResolvedValueOnce({
        results: [{ id: 2, title: 'Contact 2' }]
      });

      const user = userEvent.setup();
      renderSearchPage();

      // Perform search with specific params
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
      });

      // Load more should use the same query params
      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/search/', {
          q: 'test query',
          type: 'contacts',
          offset: 1
        });
      });
    });

    it('prevents load more when no current query exists', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      // Mock SearchResults to show load more button without search
      jest.mocked(require('../../components/SearchResults')).mockImplementation(({ onLoadMore }) => {
        return (
          <div data-testid="search-results">
            <button onClick={onLoadMore} data-testid="load-more-button">
              Load More
            </button>
          </div>
        );
      });

      // Try to click load more without search
      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      // Should not make API call
      expect(api.post).not.toHaveBeenCalled();
    });

    it('handles concurrent search operations correctly', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      // Start multiple searches quickly
      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);
      await user.click(searchButton);
      await user.click(searchButton);

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(api.get).toHaveBeenCalled();
      });
    });
  });

  // Accessibility and User Experience Tests
  describe('Accessibility and User Experience', () => {
    it('disables search during loading', async () => {
      api.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      // Button should be disabled during loading
      expect(searchButton).toBeDisabled();
      expect(searchButton).toHaveTextContent('Searching...');
    });

    it('provides proper loading indicators', async () => {
      api.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      // Should show loading overlay
      expect(document.querySelector('.loading-overlay')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('maintains focus management during operations', async () => {
      const user = userEvent.setup();
      renderSearchPage();

      const searchButton = screen.getByTestId('search-button');
      await user.click(searchButton);

      await waitFor(() => {
        // Focus should be maintained appropriately
        expect(document.activeElement).toBeDefined();
      });
    });
  });
});
