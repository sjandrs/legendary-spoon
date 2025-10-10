/**
 * Jest Tests for BlogPostList Component
 * TASK-087: CMS Components Testing
 * Target: 70%+ coverage
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BlogPostList from '../../components/BlogPostList';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

// Mock API Server
const server = setupServer(
  rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 3,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            title: 'Test Blog Post 1',
            slug: 'test-blog-post-1',
            content: 'This is test content for blog post 1',
            status: 'published',
            author: { id: 1, username: 'admin' },
            tags: ['test', 'blog'],
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
            published_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 2,
            title: 'Test Blog Post 2',
            slug: 'test-blog-post-2',
            content: 'This is test content for blog post 2',
            status: 'draft',
            author: { id: 1, username: 'admin' },
            tags: ['test'],
            created_at: '2025-01-14T10:00:00Z',
            updated_at: '2025-01-14T10:00:00Z',
            published_at: null,
          },
          {
            id: 3,
            title: 'Test Blog Post 3',
            slug: 'test-blog-post-3',
            content: 'This is test content for blog post 3',
            status: 'published',
            author: { id: 2, username: 'editor' },
            tags: [],
            created_at: '2025-01-13T10:00:00Z',
            updated_at: '2025-01-13T10:00:00Z',
            published_at: '2025-01-13T10:00:00Z',
          },
        ],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BlogPostList Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Rendering and Data Loading', () => {
    it('should render loading skeleton initially', () => {
      renderWithProviders(<BlogPostList />);
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should display blog posts after loading', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Blog Post 2')).toBeInTheDocument();
      expect(screen.getByText('Test Blog Post 3')).toBeInTheDocument();
    });

    it('should display blog post metadata correctly', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getAllByText('published')).toHaveLength(2);
      expect(screen.getByText('draft')).toBeInTheDocument();

      // Check authors
      expect(screen.getAllByText(/admin/i)).toBeTruthy();
      expect(screen.getByText(/editor/i)).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should render search input', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search blog posts/i)).toBeInTheDocument();
      });
    });

    it('should filter blog posts by search term', async () => {
      server.use(
        rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
          const search = req.url.searchParams.get('search');
          if (search === 'Post 1') {
            return res(
              ctx.json({
                count: 1,
                results: [
                  {
                    id: 1,
                    title: 'Test Blog Post 1',
                    slug: 'test-blog-post-1',
                    content: 'Content',
                    status: 'published',
                    author: { id: 1, username: 'admin' },
                    tags: [],
                    created_at: '2025-01-15T10:00:00Z',
                    updated_at: '2025-01-15T10:00:00Z',
                  },
                ],
              })
            );
          }
          return res(ctx.json({ count: 0, results: [] }));
        })
      );

      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search blog posts/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search blog posts/i);
      fireEvent.change(searchInput, { target: { value: 'Post 1' } });

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Blog Post 2')).not.toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'published' } });

      await waitFor(() => {
        expect(screen.getAllByText('published')).toHaveLength(2);
        expect(screen.queryByText('draft')).not.toBeInTheDocument();
      });
    });
  });

  describe('Actions and Navigation', () => {
    it('should render "New Blog Post" button', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByTestId('new-blog-post-button')).toBeInTheDocument();
      });
    });

    it('should navigate to blog post detail on click', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText('Test Blog Post 1')).toBeInTheDocument();
      });

      const postLink = screen.getByText('Test Blog Post 1');
      expect(postLink).toHaveAttribute('href', '/blog/1');
    });

    it('should render edit and delete buttons for each post', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/edit-blog-post-/)).toHaveLength(3);
      });

      expect(screen.getAllByTestId(/delete-blog-post-/)).toHaveLength(3);
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no blog posts exist', async () => {
      server.use(
        rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
          return res(ctx.json({ count: 0, results: [] }));
        })
      );

      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText(/no blog posts found/i)).toBeInTheDocument();
      });
    });

    it('should display "Create your first blog post" CTA in empty state', async () => {
      server.use(
        rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
          return res(ctx.json({ count: 0, results: [] }));
        })
      );

      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText(/create your first blog post/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      server.use(
        rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
        })
      );

      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText(/error loading blog posts/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      server.use(
        rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
        })
      );

      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when results exceed page size', async () => {
      server.use(
        rest.get('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
          return res(
            ctx.json({
              count: 25,
              next: 'http://localhost:8000/api/blog-posts/?page=2',
              previous: null,
              results: Array.from({ length: 20 }, (_, i) => ({
                id: i + 1,
                title: `Blog Post ${i + 1}`,
                slug: `blog-post-${i + 1}`,
                content: 'Content',
                status: 'published',
                author: { id: 1, username: 'admin' },
                tags: [],
                created_at: '2025-01-15T10:00:00Z',
                updated_at: '2025-01-15T10:00:00Z',
              })),
            })
          );
        })
      );

      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      expect(screen.getByText(/next/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on action buttons', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        const newButton = screen.getByTestId('new-blog-post-button');
        expect(newButton).toHaveAttribute('aria-label', 'Create new blog post');
      });
    });

    it('should have accessible table structure', async () => {
      renderWithProviders(<BlogPostList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(screen.getAllByRole('columnheader')).toBeTruthy();
      expect(screen.getAllByRole('row')).toBeTruthy();
    });
  });
});
