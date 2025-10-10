import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import PostDetail from '../../components/PostDetail';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock React Router useParams
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

// Wrapper component for routing
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Sample post data for testing
const samplePost = {
  id: 1,
  title: 'Test Post Title',
  author: 'John Doe',
  created_at: '2024-01-15T10:30:00.000Z',
  rich_content: '<p>This is the <strong>rich content</strong> of the post.</p>',
  content: 'This is the rich content of the post.',
  excerpt: 'This is the rich content...',
  slug: 'test-post-title',
  status: 'published',
  featured_image: null,
  meta_description: 'Test post description',
  tags: ['test', 'sample'],
};

describe('PostDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===== COMPONENT RENDERING TESTS =====
  describe('Component Rendering', () => {
    test('renders loading state initially', () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<PostDetail />, { wrapper: RouterWrapper });

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('renders post title as main heading', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Post Title');
      });
    });

    test('renders author and date information', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText(/By John Doe on/)).toBeInTheDocument();
        expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
      });
    });

    test('renders rich content with HTML', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const strongElement = screen.getByText('rich content');
        expect(strongElement).toBeInTheDocument();
        expect(strongElement.tagName).toBe('STRONG');
      });
    });

    test('renders back to posts link', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: 'Back to Posts' });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/posts');
        expect(backLink).toHaveClass('button');
      });
    });
  });

  // ===== DATA LOADING TESTS =====
  describe('Data Loading', () => {
    test('makes API call with correct post ID', async () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/posts/123/');
      });
    });

    test('updates state with fetched post data', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('handles post data with empty rich content', async () => {
      const postWithEmptyContent = {
        ...samplePost,
        rich_content: '',
      };

      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: postWithEmptyContent });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
        // Should not crash with empty content
      });
    });
  });

  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load post. It may not exist or the server is down.')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    test('logs error to console when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockUseParams.mockReturnValue({ id: '1' });
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValue(networkError);

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'There was an error fetching the post!',
          networkError
        );
      });
    });

    test('displays not found message when post is null', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: null });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Post not found.')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  // ===== NAVIGATION TESTS =====
  describe('Navigation', () => {
    test('back link navigates to posts list', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: 'Back to Posts' });
        expect(backLink).toHaveAttribute('href', '/posts');
      });
    });

    test('back link has proper styling class', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: 'Back to Posts' });
        expect(backLink).toHaveClass('button');
      });
    });
  });

  // ===== ACCESSIBILITY TESTS =====
  describe('Accessibility', () => {
    test('uses proper heading hierarchy', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent('Test Post Title');
      });
    });

    test('provides meaningful link text', async () => {
      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: samplePost });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: 'Back to Posts' });
        expect(backLink).toBeInTheDocument();
        // Link text is descriptive, not generic like "click here"
      });
    });
  });

  // ===== EDGE CASES TESTS =====
  describe('Edge Cases', () => {
    test('handles malformed date strings', async () => {
      const postWithBadDate = {
        ...samplePost,
        created_at: 'invalid-date-string',
      };

      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: postWithBadDate });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
        // Should not crash with invalid date
      });
    });

    test('handles null or undefined author', async () => {
      const postWithoutAuthor = {
        ...samplePost,
        author: null,
      };

      mockUseParams.mockReturnValue({ id: '1' });
      mockedAxios.get.mockResolvedValue({ data: postWithoutAuthor });

      render(<PostDetail />, { wrapper: RouterWrapper });

      await waitFor(() => {
        expect(screen.getByText('Test Post Title')).toBeInTheDocument();
        // Should handle null author gracefully
      });
    });
  });
});
