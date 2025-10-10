import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import PostList from '../../components/PostList';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

const mockPosts = [
  {
    id: 1,
    title: 'First Blog Post',
    author_username: 'john_doe',
    created_at: '2024-09-15T10:30:00Z',
    rich_content: '<p>This is the first blog post content with <strong>rich formatting</strong>. It contains multiple sentences to test the truncation functionality properly.</p>'
  },
  {
    id: 2,
    title: 'Second Blog Post',
    author_username: 'jane_smith',
    created_at: '2024-09-20T14:45:00Z',
    rich_content: '<p>This is the second blog post with more detailed content about various topics including technology, business, and personal development.</p>'
  },
  {
    id: 3,
    title: 'Third Blog Post',
    author_username: null, // Test unknown author case
    created_at: '2024-09-25T09:15:00Z',
    rich_content: '<p>A post without an author username to test the fallback behavior.</p>'
  }
];

const renderPostList = () => {
  return render(
    <BrowserRouter>
      <PostList />
    </BrowserRouter>
  );
};

describe('PostList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: { results: mockPosts } });
  });

  // Component Rendering Tests
  describe('Component Rendering', () => {
    it('renders post list page with main heading', async () => {
      renderPostList();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Latest Posts');
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts/');
      });
    });

    it('shows loading state initially', () => {
      renderPostList();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders posts after loading', async () => {
      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('First Blog Post')).toBeInTheDocument();
        expect(screen.getByText('Second Blog Post')).toBeInTheDocument();
        expect(screen.getByText('Third Blog Post')).toBeInTheDocument();
      });
    });

    it('renders post list with proper HTML structure', async () => {
      renderPostList();

      await waitFor(() => {
        const postList = document.querySelector('.post-list');
        expect(postList).toBeInTheDocument();
        expect(postList.tagName.toLowerCase()).toBe('ul');

        const listItems = postList.querySelectorAll('li');
        expect(listItems).toHaveLength(3);
      });
    });

    it('displays posts with proper heading levels', async () => {
      renderPostList();

      await waitFor(() => {
        const postHeadings = screen.getAllByRole('heading', { level: 2 });
        expect(postHeadings).toHaveLength(3);
        expect(postHeadings[0]).toHaveTextContent('First Blog Post');
        expect(postHeadings[1]).toHaveTextContent('Second Blog Post');
        expect(postHeadings[2]).toHaveTextContent('Third Blog Post');
      });
    });
  });

  // Data Loading Tests
  describe('Data Loading', () => {
    it('fetches posts from API on component mount', async () => {
      renderPostList();

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts/');
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });
    });

    it('handles API response with results array', async () => {
      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('First Blog Post')).toBeInTheDocument();
        expect(screen.getByText(/john_doe/)).toBeInTheDocument();
      });
    });

    it('handles API response without results array', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockPosts });

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('No posts found.')).toBeInTheDocument();
      });
    });

    it('displays correct author information', async () => {
      renderPostList();

      await waitFor(() => {
        expect(screen.getByText(/By john_doe on/)).toBeInTheDocument();
        expect(screen.getByText(/By jane_smith on/)).toBeInTheDocument();
        expect(screen.getByText(/By Unknown Author on/)).toBeInTheDocument();
      });
    });

    it('formats dates correctly', async () => {
      renderPostList();

      await waitFor(() => {
        // Check that dates are displayed in locale format
        const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/;
        const dateElements = screen.getAllByText(dateRegex);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Failed to load posts.')).toBeInTheDocument();
      });
    });

    it('logs error to console when API call fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      renderPostList();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'There was an error fetching the posts!',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('sets empty posts array on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Failed to load posts.')).toBeInTheDocument();
        expect(screen.queryByText('First Blog Post')).not.toBeInTheDocument();
      });
    });

    it('handles malformed API response gracefully', async () => {
      mockedAxios.get.mockResolvedValue({ data: null });

      renderPostList();

      await waitFor(() => {
        // When data is null, it triggers an error in the component
        expect(screen.getByText('Failed to load posts.')).toBeInTheDocument();
      });
    });

    it('handles empty posts array', async () => {
      mockedAxios.get.mockResolvedValue({ data: { results: [] } });

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('No posts found.')).toBeInTheDocument();
      });
    });
  });

  // Content Display Tests
  describe('Content Display', () => {
    it('displays post titles as clickable links', async () => {
      renderPostList();

      await waitFor(() => {
        const titleLinks = screen.getAllByRole('link', { name: /First Blog Post|Second Blog Post|Third Blog Post/ });
        expect(titleLinks).toHaveLength(3);

        titleLinks.forEach(link => {
          expect(link).toHaveAttribute('href');
        });
      });
    });

    it('creates correct links for post detail pages', async () => {
      renderPostList();

      await waitFor(() => {
        const firstPostLink = screen.getByRole('link', { name: 'First Blog Post' });
        expect(firstPostLink).toHaveAttribute('href', '/posts/1');

        const secondPostLink = screen.getByRole('link', { name: 'Second Blog Post' });
        expect(secondPostLink).toHaveAttribute('href', '/posts/2');
      });
    });

    it('displays "Read more" links for each post', async () => {
      renderPostList();

      await waitFor(() => {
        const readMoreLinks = screen.getAllByText('Read more');
        expect(readMoreLinks).toHaveLength(3);

        readMoreLinks.forEach((link, index) => {
          expect(link).toHaveAttribute('href', `/posts/${mockPosts[index].id}`);
        });
      });
    });

    it('truncates post content properly', async () => {
      renderPostList();

      await waitFor(() => {
        // Check that content is truncated with ellipsis
        const contentElements = document.querySelectorAll('li div');
        contentElements.forEach(element => {
          expect(element.innerHTML).toMatch(/\.\.\.$/);
        });
      });
    });

    it('displays rich HTML content safely', async () => {
      renderPostList();

      await waitFor(() => {
        // Check that HTML is rendered (dangerouslySetInnerHTML)
        const strongElement = document.querySelector('strong');
        expect(strongElement).toBeInTheDocument();
        expect(strongElement).toHaveTextContent('rich formatting');
      });
    });

    it('handles posts without rich content', async () => {
      const postsWithoutContent = [{
        id: 4,
        title: 'Post Without Content',
        author_username: 'test_user',
        created_at: '2024-09-30T12:00:00Z',
        rich_content: null
      }];

      mockedAxios.get.mockResolvedValue({ data: { results: postsWithoutContent } });

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Post Without Content')).toBeInTheDocument();
        // Should handle null content gracefully
      });
    });

    it('handles posts with empty rich content', async () => {
      const postsWithEmptyContent = [{
        id: 5,
        title: 'Post With Empty Content',
        author_username: 'test_user',
        created_at: '2024-09-30T12:00:00Z',
        rich_content: ''
      }];

      mockedAxios.get.mockResolvedValue({ data: { results: postsWithEmptyContent } });

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Post With Empty Content')).toBeInTheDocument();
        // Should handle empty content gracefully
      });
    });
  });

  // Navigation Tests
  describe('Navigation', () => {
    it('renders within BrowserRouter context', () => {
      expect(() => renderPostList()).not.toThrow();
    });

    it('creates proper Link components for navigation', async () => {
      renderPostList();

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        // Should have title links + read more links (6 total)
        expect(links.length).toBeGreaterThanOrEqual(6);
      });
    });

    it('handles navigation without BrowserRouter gracefully', () => {
      // Test that component doesn't break if used outside BrowserRouter
      expect(() => render(<PostList />)).not.toThrow();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('renders efficiently with multiple posts', async () => {
      const startTime = performance.now();
      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Latest Posts')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('handles large post lists efficiently', async () => {
      const largePosts = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Post ${i + 1}`,
        author_username: `user_${i + 1}`,
        created_at: '2024-09-15T10:30:00Z',
        rich_content: `<p>Content for post ${i + 1}</p>`
      }));

      mockedAxios.get.mockResolvedValue({ data: { results: largePosts } });

      const startTime = performance.now();
      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Post 1')).toBeInTheDocument();
        expect(screen.getByText('Post 50')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should handle large lists efficiently
    });

    it('cleans up properly on unmount', async () => {
      const { unmount } = renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Latest Posts')).toBeInTheDocument();
      });

      expect(() => unmount()).not.toThrow();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      renderPostList();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        const h2s = screen.getAllByRole('heading', { level: 2 });

        expect(h1).toBeInTheDocument();
        expect(h2s.length).toBe(3); // One for each post
      });
    });

    it('provides accessible list structure', async () => {
      renderPostList();

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
      });
    });

    it('has accessible link descriptions', async () => {
      renderPostList();

      await waitFor(() => {
        const titleLinks = screen.getAllByRole('link', { name: /Blog Post/ });
        titleLinks.forEach(link => {
          expect(link).toHaveAccessibleName();
        });

        const readMoreLinks = screen.getAllByRole('link', { name: 'Read more' });
        readMoreLinks.forEach(link => {
          expect(link).toHaveAccessibleName();
        });
      });
    });

    it('maintains semantic HTML structure', async () => {
      renderPostList();

      await waitFor(() => {
        // Check for proper semantic elements
        expect(document.querySelector('h1')).toBeInTheDocument();
        expect(document.querySelector('ul.post-list')).toBeInTheDocument();
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('h2')).toHaveLength(3);
      });
    });

    it('provides meaningful content for screen readers', async () => {
      renderPostList();

      await waitFor(() => {
        // Check that author and date information is accessible
        const authorInfo = screen.getByText(/By john_doe on/);
        expect(authorInfo).toBeInTheDocument();
        expect(authorInfo.textContent).toMatch(/By .+ on \d{1,2}\/\d{1,2}\/\d{4}/);
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('handles posts with missing required fields', async () => {
      const incompletePost = [{
        id: 6,
        // Missing title, author_username, created_at, rich_content
      }];

      mockedAxios.get.mockResolvedValue({ data: { results: incompletePost } });

      renderPostList();

      await waitFor(() => {
        // Should not crash, might show undefined/null values
        expect(screen.getByText('Latest Posts')).toBeInTheDocument();
      });
    });

    it('handles posts with very long titles', async () => {
      const longTitlePost = [{
        id: 7,
        title: 'This is a very long title that should be handled gracefully by the component without breaking the layout or causing any rendering issues',
        author_username: 'test_user',
        created_at: '2024-09-30T12:00:00Z',
        rich_content: '<p>Content</p>'
      }];

      mockedAxios.get.mockResolvedValue({ data: { results: longTitlePost } });

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText(/This is a very long title/)).toBeInTheDocument();
      });
    });

    it('handles posts with malformed dates', async () => {
      const malformedDatePost = [{
        id: 8,
        title: 'Post with Bad Date',
        author_username: 'test_user',
        created_at: 'invalid-date',
        rich_content: '<p>Content</p>'
      }];

      mockedAxios.get.mockResolvedValue({ data: { results: malformedDatePost } });

      renderPostList();

      await waitFor(() => {
        expect(screen.getByText('Post with Bad Date')).toBeInTheDocument();
        // Should handle invalid date gracefully
      });
    });
  });
});
