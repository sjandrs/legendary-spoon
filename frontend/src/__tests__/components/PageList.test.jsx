/**
 * Jest Tests for PageList Component
 * TASK-087: CMS Components Testing
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PageList from '../../components/PageList';
import '@testing-library/jest-dom';

// Use global MSW server from setupTests.js
const { server, http, HttpResponse } = globalThis;

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
      http.get('http://localhost:8000/api/pages/', () => {
        return HttpResponse.json({ count: 0, results: [] });
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
