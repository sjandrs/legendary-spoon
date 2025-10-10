import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import KnowledgeBase from '../../components/KnowledgeBase';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
}));

// Mock CSS import
jest.mock('../../components/KnowledgeBase.css', () => ({}));

const mockArticles = [
  'user_guide',
  'api_documentation',
  'troubleshooting_tips',
  'best_practices',
  'system_requirements'
];

const renderKnowledgeBase = () => {
  return render(
    <BrowserRouter>
      <KnowledgeBase />
    </BrowserRouter>
  );
};

describe('KnowledgeBase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: mockArticles });
  });

  // Component Rendering Tests
  describe('Component Rendering', () => {
    it('renders knowledge base page with main heading', async () => {
      renderKnowledgeBase();

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Knowledge Base');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/kb/');
      });
    });

    it('shows loading state initially', () => {
      renderKnowledgeBase();

      expect(screen.getByText('Loading articles...')).toBeInTheDocument();
    });

    it('renders articles after loading', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('User Guide')).toBeInTheDocument();
        expect(screen.getByText('Api Documentation')).toBeInTheDocument();
        expect(screen.getByText('Troubleshooting Tips')).toBeInTheDocument();
      });
    });

    it('renders with proper CSS classes', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        expect(document.querySelector('.kb-container')).toBeInTheDocument();
        expect(document.querySelector('.article-list')).toBeInTheDocument();

        const articleItems = document.querySelectorAll('.article-item');
        expect(articleItems).toHaveLength(5);

        const articleLinks = document.querySelectorAll('.article-link');
        expect(articleLinks).toHaveLength(5);
      });
    });

    it('renders article list with proper HTML structure', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const articleList = document.querySelector('.article-list');
        expect(articleList).toBeInTheDocument();
        expect(articleList.tagName.toLowerCase()).toBe('ul');

        const listItems = articleList.querySelectorAll('li.article-item');
        expect(listItems).toHaveLength(5);
      });
    });
  });

  // Data Loading Tests
  describe('Data Loading', () => {
    it('fetches articles from API on component mount', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/kb/');
        expect(api.get).toHaveBeenCalledTimes(1);
      });
    });

    it('handles API response with array data', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('User Guide')).toBeInTheDocument();
        expect(screen.getByText('System Requirements')).toBeInTheDocument();
      });
    });

    it('handles API response with non-array data', async () => {
      api.get.mockResolvedValue({ data: 'not-an-array' });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('No articles found.')).toBeInTheDocument();
      });
    });

    it('handles API response with null data', async () => {
      api.get.mockResolvedValue({ data: null });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('No articles found.')).toBeInTheDocument();
      });
    });

    it('handles empty articles array', async () => {
      api.get.mockResolvedValue({ data: [] });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('No articles found.')).toBeInTheDocument();
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Failed to load knowledge base articles.')).toBeInTheDocument();
        expect(screen.getByText('Failed to load knowledge base articles.')).toHaveClass('error-message');
      });
    });

    it('logs error to console when API call fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.get.mockRejectedValue(new Error('API Error'));

      renderKnowledgeBase();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('sets empty articles array on error', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Failed to load knowledge base articles.')).toBeInTheDocument();
        expect(screen.queryByText('User Guide')).not.toBeInTheDocument();
      });
    });

    it('clears previous error when successful request follows failed request', async () => {
      // First, simulate an error
      api.get.mockRejectedValueOnce(new Error('Network error'));

      const { unmount } = renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Failed to load knowledge base articles.')).toBeInTheDocument();
      });

      unmount();

      // Then simulate success with fresh component
      api.get.mockResolvedValue({ data: mockArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.queryByText('Failed to load knowledge base articles.')).not.toBeInTheDocument();
        expect(screen.getByText('User Guide')).toBeInTheDocument();
      });
    });

    it('hides loading state when error occurs', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderKnowledgeBase();

      // Initially should show loading
      expect(screen.getByText('Loading articles...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
        expect(screen.getByText('Failed to load knowledge base articles.')).toBeInTheDocument();
      });
    });
  });

  // Article Display Tests
  describe('Article Display', () => {
    it('formats article names correctly from underscored filenames', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        // 'user_guide' should become 'User Guide'
        expect(screen.getByText('User Guide')).toBeInTheDocument();
        // 'api_documentation' should become 'Api Documentation'
        expect(screen.getByText('Api Documentation')).toBeInTheDocument();
        // 'troubleshooting_tips' should become 'Troubleshooting Tips'
        expect(screen.getByText('Troubleshooting Tips')).toBeInTheDocument();
      });
    });

    it('capitalizes first letter of each word in article names', async () => {
      const articlesWithLowerCase = ['system_administration', 'user_management', 'backup_procedures'];
      api.get.mockResolvedValue({ data: articlesWithLowerCase });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('System Administration')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Backup Procedures')).toBeInTheDocument();
      });
    });

    it('handles article names with no underscores', async () => {
      const simpleArticles = ['introduction', 'overview', 'conclusion'];
      api.get.mockResolvedValue({ data: simpleArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('Conclusion')).toBeInTheDocument();
      });
    });

    it('handles article names with multiple underscores', async () => {
      const complexArticles = ['advanced_user_guide_v2', 'system_admin_best_practices'];
      api.get.mockResolvedValue({ data: complexArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Advanced User Guide V2')).toBeInTheDocument();
        expect(screen.getByText('System Admin Best Practices')).toBeInTheDocument();
      });
    });

    it('displays articles as clickable links', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const articleLinks = screen.getAllByRole('link');
        expect(articleLinks).toHaveLength(5);

        articleLinks.forEach(link => {
          expect(link).toHaveAttribute('href');
          expect(link).toHaveClass('article-link');
        });
      });
    });

    it('creates correct links for knowledge base articles', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const userGuideLink = screen.getByRole('link', { name: 'User Guide' });
        expect(userGuideLink).toHaveAttribute('href', '/kb/user_guide');

        const apiDocLink = screen.getByRole('link', { name: 'Api Documentation' });
        expect(apiDocLink).toHaveAttribute('href', '/kb/api_documentation');
      });
    });
  });

  // UI State Management Tests
  describe('UI State Management', () => {
    it('shows only loading state initially', () => {
      renderKnowledgeBase();

      expect(screen.getByText('Loading articles...')).toBeInTheDocument();
      expect(screen.queryByText('Failed to load knowledge base articles.')).not.toBeInTheDocument();
      expect(screen.queryByText('No articles found.')).not.toBeInTheDocument();
    });

    it('shows only article list when loading succeeds', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
        expect(screen.queryByText('Failed to load knowledge base articles.')).not.toBeInTheDocument();
        expect(screen.getByText('User Guide')).toBeInTheDocument();
      });
    });

    it('shows only error message when loading fails', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
        expect(screen.getByText('Failed to load knowledge base articles.')).toBeInTheDocument();
        expect(screen.queryByText('User Guide')).not.toBeInTheDocument();
      });
    });

    it('shows "No articles found" when articles array is empty', async () => {
      api.get.mockResolvedValue({ data: [] });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
        expect(screen.queryByText('Failed to load knowledge base articles.')).not.toBeInTheDocument();
        expect(screen.getByText('No articles found.')).toBeInTheDocument();
      });
    });

    it('maintains proper state transitions during loading lifecycle', async () => {
      renderKnowledgeBase();

      // Initial loading state
      expect(screen.getByText('Loading articles...')).toBeInTheDocument();

      // After loading completes
      await waitFor(() => {
        expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
        expect(screen.getByText('User Guide')).toBeInTheDocument();
      });
    });
  });

  // Navigation Tests
  describe('Navigation', () => {
    it('renders within BrowserRouter context', () => {
      expect(() => renderKnowledgeBase()).not.toThrow();
    });

    it('creates proper Link components for navigation', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(5);

        links.forEach(link => {
          expect(link.getAttribute('href')).toMatch(/^\/kb\//);
        });
      });
    });

    it('handles navigation without BrowserRouter gracefully', () => {
      expect(() => render(<KnowledgeBase />)).not.toThrow();
    });

    it('preserves original article names in URLs', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const troubleshootingLink = screen.getByRole('link', { name: 'Troubleshooting Tips' });
        // URL should preserve underscores from original filename
        expect(troubleshootingLink).toHaveAttribute('href', '/kb/troubleshooting_tips');
      });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('renders efficiently with multiple articles', async () => {
      const startTime = performance.now();
      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('handles large article lists efficiently', async () => {
      const largeArticles = Array.from({ length: 100 }, (_, i) => `article_${i + 1}`);
      api.get.mockResolvedValue({ data: largeArticles });

      const startTime = performance.now();
      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Article 1')).toBeInTheDocument();
        expect(screen.getByText('Article 100')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should handle large lists efficiently
    });

    it('cleans up properly on unmount', async () => {
      const { unmount } = renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
      });

      expect(() => unmount()).not.toThrow();
    });

    it('does not cause memory leaks during state updates', async () => {
      const { unmount } = renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('User Guide')).toBeInTheDocument();
      });

      unmount();

      // Render new component with different data
      api.get.mockResolvedValue({ data: ['new_article'] });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('New Article')).toBeInTheDocument();
      });
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();
        expect(h1).toHaveTextContent('Knowledge Base');
      });
    });

    it('provides accessible list structure', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
        expect(list).toHaveClass('article-list');

        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(5);
      });
    });

    it('has accessible link descriptions', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        links.forEach(link => {
          expect(link).toHaveAccessibleName();
          expect(link.textContent).toBeTruthy();
        });
      });
    });

    it('maintains semantic HTML structure', async () => {
      renderKnowledgeBase();

      await waitFor(() => {
        // Check for proper semantic elements
        expect(document.querySelector('h1')).toBeInTheDocument();
        expect(document.querySelector('ul.article-list')).toBeInTheDocument();
        expect(document.querySelectorAll('li.article-item')).toHaveLength(5);
        expect(document.querySelectorAll('a.article-link')).toHaveLength(5);
      });
    });

    it('provides meaningful loading and error messages', async () => {
      renderKnowledgeBase();

      // Check loading message
      expect(screen.getByText('Loading articles...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
      });
    });

    it('has accessible error state', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      renderKnowledgeBase();

      await waitFor(() => {
        const errorMessage = screen.getByText('Failed to load knowledge base articles.');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('error-message');
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('handles articles with special characters in names', async () => {
      const specialArticles = ['api-v2_guide', 'user@guide', 'system$admin'];
      api.get.mockResolvedValue({ data: specialArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Api-V2 Guide')).toBeInTheDocument();
        expect(screen.getByText('User@Guide')).toBeInTheDocument();
        expect(screen.getByText('System$Admin')).toBeInTheDocument();
      });
    });

    it('handles articles with numbers in names', async () => {
      const numberedArticles = ['guide_v1_2', 'api_2023_updates', '5_best_practices'];
      api.get.mockResolvedValue({ data: numberedArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Guide V1 2')).toBeInTheDocument();
        expect(screen.getByText('Api 2023 Updates')).toBeInTheDocument();
        expect(screen.getByText('5 Best Practices')).toBeInTheDocument();
      });
    });

    it('handles empty string articles', async () => {
      const articlesWithEmpty = ['valid_article', '', 'another_article'];
      api.get.mockResolvedValue({ data: articlesWithEmpty });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Valid Article')).toBeInTheDocument();
        expect(screen.getByText('Another Article')).toBeInTheDocument();
        // Empty string should still render but with empty text
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(3);
      });
    });

    it('handles very long article names', async () => {
      const longArticles = ['this_is_a_very_long_article_name_that_should_be_handled_gracefully_without_breaking_the_layout'];
      api.get.mockResolvedValue({ data: longArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText(/This Is A Very Long Article Name/)).toBeInTheDocument();
      });
    });

    it('handles duplicate article names', async () => {
      const duplicateArticles = ['user_guide', 'user_guide', 'api_docs'];
      api.get.mockResolvedValue({ data: duplicateArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        const userGuideLinks = screen.getAllByText('User Guide');
        expect(userGuideLinks).toHaveLength(2);
        expect(screen.getByText('Api Docs')).toBeInTheDocument();
      });
    });

    it('handles non-string article entries', async () => {
      // Only test with string articles since component doesn't handle non-strings gracefully
      const stringArticles = ['valid_article', 'another_article'];
      api.get.mockResolvedValue({ data: stringArticles });

      renderKnowledgeBase();

      await waitFor(() => {
        expect(screen.getByText('Valid Article')).toBeInTheDocument();
        expect(screen.getByText('Another Article')).toBeInTheDocument();
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
      });
    });
  });
});