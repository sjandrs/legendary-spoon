/**
 * Jest Tests for BlogPostForm Component
 * TASK-087: CMS Components Testing
 * Target: 70%+ coverage
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BlogPostForm from '../../components/BlogPostForm';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import api from '../../api';
import '@testing-library/jest-dom';

const server = setupServer(
  rest.post('http://localhost:8000/api/blog-posts/', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 1,
        title: req.body.title,
        slug: req.body.slug,
        content: req.body.content,
        status: req.body.status,
        author: { id: 1, username: 'admin' },
        tags: req.body.tags || [],
        created_at: '2025-01-16T10:00:00Z',
        updated_at: '2025-01-16T10:00:00Z',
      })
    );
  }),
  rest.put('http://localhost:8000/api/blog-posts/1/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 1,
        title: req.body.title,
        slug: req.body.slug,
        content: req.body.content,
        status: req.body.status,
        author: { id: 1, username: 'admin' },
        tags: req.body.tags || [],
        updated_at: '2025-01-16T10:30:00Z',
      })
    );
  }),
  rest.get('http://localhost:8000/api/blog-posts/1/', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 1,
        title: 'Existing Blog Post',
        slug: 'existing-blog-post',
        content: 'Existing content',
        status: 'draft',
        author: { id: 1, username: 'admin' },
        tags: ['existing', 'test'],
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      })
    );
  }),
  rest.get('http://localhost:8000/api/tags/', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          { id: 1, name: 'Technology' },
          { id: 2, name: 'Business' },
          { id: 3, name: 'Marketing' },
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

const renderWithProviders = (component, initialRoute = '/blog/new') => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/blog/new" element={component} />
          <Route path="/blog/:id/edit" element={component} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('BlogPostForm Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Create Mode', () => {
    it('should render all form fields for new blog post', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    });

    it('should have empty form fields initially', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/slug/i)).toHaveValue('');
      expect(screen.getByLabelText(/content/i)).toHaveValue('');
    });

    it('should auto-generate slug from title', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'My New Blog Post');

      await waitFor(() => {
        expect(screen.getByLabelText(/slug/i)).toHaveValue('my-new-blog-post');
      });
    });

    it('should submit new blog post successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test Blog Post');
      await user.type(screen.getByLabelText(/content/i), 'This is test content');
      await user.selectOptions(screen.getByLabelText(/status/i), 'published');

      const submitButton = screen.getByText(/save blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/blog post created successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should load existing blog post data', async () => {
      renderWithProviders(<BlogPostForm />, '/blog/1/edit');

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Blog Post');
      });

      expect(screen.getByLabelText(/slug/i)).toHaveValue('existing-blog-post');
      expect(screen.getByLabelText(/content/i)).toHaveValue('Existing content');
      expect(screen.getByLabelText(/status/i)).toHaveValue('draft');
    });

    it('should update existing blog post successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />, '/blog/1/edit');

      await waitFor(() => {
        expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Blog Post');
      });

      await user.clear(screen.getByLabelText(/title/i));
      await user.type(screen.getByLabelText(/title/i), 'Updated Blog Post');

      const submitButton = screen.getByText(/update blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/blog post updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty title', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      const submitButton = screen.getByText(/save blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test Title');

      const submitButton = screen.getByText(/save blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/content is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid slug format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/slug/i), 'Invalid Slug With Spaces!');

      await waitFor(() => {
        expect(screen.getByText(/slug must be lowercase with hyphens/i)).toBeInTheDocument();
      });
    });

    it('should validate title length (max 200 characters)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      const longTitle = 'a'.repeat(201);
      await user.type(screen.getByLabelText(/title/i), longTitle);

      await waitFor(() => {
        expect(screen.getByText(/title must be 200 characters or less/i)).toBeInTheDocument();
      });
    });
  });

  describe('Rich Text Editor', () => {
    it('should render rich text editor for content', () => {
      renderWithProviders(<BlogPostForm />);

      const contentEditor = screen.getByLabelText(/content/i);
      expect(contentEditor).toBeInTheDocument();
      expect(contentEditor).toHaveAttribute('data-richtext', 'true');
    });

    it('should support markdown formatting', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      const contentEditor = screen.getByLabelText(/content/i);
      await user.type(contentEditor, '# Heading\n\n**Bold text**');

      expect(contentEditor).toHaveValue('# Heading\n\n**Bold text**');
    });

    it('should have formatting toolbar', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
      expect(screen.getByTitle(/bold/i)).toBeInTheDocument();
      expect(screen.getByTitle(/italic/i)).toBeInTheDocument();
      expect(screen.getByTitle(/link/i)).toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    it('should load available tags', async () => {
      renderWithProviders(<BlogPostForm />);

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
      });

      expect(screen.getByText('Business')).toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });

    it('should add tag to blog post', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await waitFor(() => {
        expect(screen.getByText('Technology')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Technology'));

      expect(screen.getByTestId('selected-tag-Technology')).toBeInTheDocument();
    });

    it('should remove tag from blog post', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />, '/blog/1/edit');

      await waitFor(() => {
        expect(screen.getByTestId('selected-tag-existing')).toBeInTheDocument();
      });

      const removeButton = screen.getByTestId('remove-tag-existing');
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('selected-tag-existing')).not.toBeInTheDocument();
      });
    });

    it('should create new tag inline', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      const tagInput = screen.getByPlaceholderText(/add new tag/i);
      await user.type(tagInput, 'NewTag{enter}');

      await waitFor(() => {
        expect(screen.getByTestId('selected-tag-NewTag')).toBeInTheDocument();
      });
    });
  });

  describe('Status Management', () => {
    it('should have draft status selected by default', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByLabelText(/status/i)).toHaveValue('draft');
    });

    it('should allow changing status to published', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.selectOptions(screen.getByLabelText(/status/i), 'published');

      expect(screen.getByLabelText(/status/i)).toHaveValue('published');
    });

    it('should show published date when status is published', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.selectOptions(screen.getByLabelText(/status/i), 'published');

      await waitFor(() => {
        expect(screen.getByText(/publish date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API error message on save failure', async () => {
      const spy = jest.spyOn(api, 'post').mockRejectedValueOnce({
        response: { status: 400, data: { error: 'A blog post with this slug already exists' } }
      });

      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test Post');
      await user.type(screen.getByLabelText(/content/i), 'Test content');

      const submitButton = screen.getByText(/save blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/a blog post with this slug already exists/i)
        ).toBeInTheDocument();
      });

      spy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      // No response property simulates network failure
      const spy = jest.spyOn(api, 'post').mockRejectedValueOnce(networkError);

      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/title/i), 'Test Post');
      await user.type(screen.getByLabelText(/content/i), 'Test content');

      const submitButton = screen.getByText(/save blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      spy.mockRestore();
    });
  });

  describe('Preview Mode', () => {
    it('should have preview toggle button', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByText(/preview/i)).toBeInTheDocument();
    });

    it('should show preview when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/title/i), 'Preview Test');
      await user.type(screen.getByLabelText(/content/i), '# Heading\n\nTest content');

      await user.click(screen.getByText(/preview/i));

      await waitFor(() => {
        expect(screen.getByTestId('blog-post-preview')).toBeInTheDocument();
      });

      expect(screen.getByText('Preview Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all form fields', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/content/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<BlogPostForm />);

      const submitButton = screen.getByText(/save blog post/i);
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/title is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(<BlogPostForm />);

      const titleInput = screen.getByLabelText(/title/i);
      titleInput.focus();

      expect(document.activeElement).toBe(titleInput);
    });
  });

  describe('Autosave Feature', () => {
    it('should display autosave indicator', () => {
      renderWithProviders(<BlogPostForm />);

      expect(screen.getByTestId('autosave-indicator')).toBeInTheDocument();
    });

    it('should autosave after user stops typing', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      renderWithProviders(<BlogPostForm />);

      await user.type(screen.getByLabelText(/title/i), 'Autosave Test');

      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
