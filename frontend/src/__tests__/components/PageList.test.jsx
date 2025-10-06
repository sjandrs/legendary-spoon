/**
 * Jest Tests for PageList Component
 * TASK-087: CMS Components Testing
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PageList from '../../components/PageList';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

const server = setupServer(
  rest.get('http://localhost:8000/api/pages/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 2,
        results: [
          {
            id: 1,
            title: 'About Us',
            slug: 'about-us',
            content: '<p>About us content</p>',
            meta_title: 'About Us | Company',
            meta_description: 'Learn about our company',
            is_published: true,
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 2,
            title: 'Contact',
            slug: 'contact',
            content: '<p>Contact us</p>',
            meta_title: 'Contact Us',
            meta_description: 'Get in touch',
            is_published: false,
            created_at: '2025-01-14T10:00:00Z',
            updated_at: '2025-01-14T10:00:00Z',
          },
        ],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{component}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PageList Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('should display pages after loading', async () => {
    renderWithProviders(<PageList />);

    await waitFor(() => {
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });

    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('should display published status', async () => {
    renderWithProviders(<PageList />);

    await waitFor(() => {
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });

    expect(screen.getByText(/published/i)).toBeInTheDocument();
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });

  it('should render "New Page" button', async () => {
    renderWithProviders(<PageList />);

    await waitFor(() => {
      expect(screen.getByTestId('new-page-button')).toBeInTheDocument();
    });
  });

  it('should display empty state when no pages exist', async () => {
    server.use(
      rest.get('http://localhost:8000/api/pages/', (req, res, ctx) => {
        return res(ctx.json({ count: 0, results: [] }));
      })
    );

    renderWithProviders(<PageList />);

    await waitFor(() => {
      expect(screen.getByText(/no pages found/i)).toBeInTheDocument();
    });
  });

  it('should filter pages by search term', async () => {
    renderWithProviders(<PageList />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search pages/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search pages/i);
    fireEvent.change(searchInput, { target: { value: 'About' } });

    await waitFor(() => {
      expect(screen.getByText('About Us')).toBeInTheDocument();
    });
  });

  it('should render edit and delete buttons', async () => {
    renderWithProviders(<PageList />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/edit-page-/)).toHaveLength(2);
    });

    expect(screen.getAllByTestId(/delete-page-/)).toHaveLength(2);
  });
});
