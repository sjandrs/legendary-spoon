import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchResults from '../../components/SearchResults';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock data factory
const mockData = {
  emptyResults: [],
  contactResults: [
    {
      id: 1,
      title: 'John Doe',
      type: 'contacts',
      email: 'john@example.com',
      phone: '555-0123',
      status: 'active'
    }
  ],
  accountResults: [
    {
      id: 1,
      title: 'Acme Corp',
      type: 'accounts',
      value: '-Force50,000.00',
      status: 'active'
    }
  ]
};

// Test wrapper with providers
const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SearchResults Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State Rendering', () => {
    it('renders empty state message when no results provided', () => {
      renderWithProviders(<SearchResults results={mockData.emptyResults} />);

      // Component shows "no results" text for empty array
      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });

    it('displays empty state with proper styling', () => {
      renderWithProviders(<SearchResults results={[]} />);

      const emptyMessage = screen.getByText(/Enter search terms or filters to find results/);
      expect(emptyMessage).toBeVisible();
      expect(emptyMessage.closest('.no-results')).toBeInTheDocument();
    });
  });

  describe('Basic Component Structure', () => {
    it('renders with proper container element', () => {
      renderWithProviders(<SearchResults results={[]} />);

      const container = document.querySelector('.search-results');
      expect(container).toBeInTheDocument();
    });

    it('has accessible text content', () => {
      renderWithProviders(<SearchResults results={[]} />);

      const textElement = screen.getByRole('paragraph');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveTextContent(/Enter search terms or filters to find results/);
    });
  });

  describe('Props Handling', () => {
    it('handles undefined results prop gracefully', () => {
      renderWithProviders(<SearchResults />);

      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });

    it('handles null results prop gracefully', () => {
      renderWithProviders(<SearchResults results={null} />);

      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });

    it('handles query prop when provided', () => {
      renderWithProviders(<SearchResults results={[]} query="test search" />);

      // Component should still show empty state regardless of query
      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides semantic HTML structure', () => {
      renderWithProviders(<SearchResults results={[]} />);

      const paragraph = screen.getByRole('paragraph');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toBeVisible();
    });

    it('has accessible text for screen readers', () => {
      renderWithProviders(<SearchResults results={[]} />);

      const accessibleText = screen.getByText(/Enter search terms or filters to find results/);
      expect(accessibleText).toBeInTheDocument();
      expect(accessibleText).not.toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Performance', () => {
    it('renders quickly with empty results', () => {
      const startTime = performance.now();
      renderWithProviders(<SearchResults results={[]} />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(50); // Should render very quickly
      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });

    it('maintains performance with large empty result arrays', () => {
      const largeEmptyArray = new Array(1000).fill(null);

      const startTime = performance.now();
      renderWithProviders(<SearchResults results={largeEmptyArray} />);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('integrates with React Router without errors', () => {
      expect(() => {
        renderWithProviders(<SearchResults results={[]} />);
      }).not.toThrow();

      expect(screen.getByText(/Enter search terms or filters to find results/)).toBeInTheDocument();
    });

    it('integrates with AuthContext without errors', () => {
      expect(() => {
        renderWithProviders(<SearchResults results={[]} />);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles malformed result objects gracefully', () => {
      const malformedResults = [
        { /* missing required fields */ },
        { id: 'invalid', title: null },
        undefined,
        null
      ];

      expect(() => {
        renderWithProviders(<SearchResults results={malformedResults} />);
      }).not.toThrow();

      // Component should still show content (likely no-results state)
      expect(document.querySelector('.search-results')).toBeInTheDocument();
    });
  });

  describe('CSS Class Structure', () => {
    it('applies proper CSS classes', () => {
      renderWithProviders(<SearchResults results={[]} />);

      const container = document.querySelector('.search-results');
      expect(container).toBeInTheDocument();

      const noResults = container.querySelector('.no-results');
      expect(noResults).toBeInTheDocument();
    });
  });
});
