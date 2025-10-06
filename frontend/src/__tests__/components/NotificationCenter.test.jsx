/**
 * Jest Tests for NotificationCenter Component
 * TASK-087: Admin Components Testing
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationCenter from '../../components/NotificationCenter';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

const server = setupServer(
  rest.get('http://localhost:8000/api/notifications/', (req, res, ctx) => {
    return res(
      ctx.json({
        count: 3,
        results: [
          {
            id: 1,
            type: 'info',
            title: 'New Message',
            message: 'You have a new message from John Doe',
            is_read: false,
            created_at: '2025-01-16T10:00:00Z',
          },
          {
            id: 2,
            type: 'warning',
            title: 'Deadline Approaching',
            message: 'Project deadline is in 2 days',
            is_read: false,
            created_at: '2025-01-15T10:00:00Z',
          },
          {
            id: 3,
            type: 'success',
            title: 'Task Completed',
            message: 'Task #123 has been completed',
            is_read: true,
            created_at: '2025-01-14T10:00:00Z',
          },
        ],
      })
    );
  }),
  rest.patch('http://localhost:8000/api/notifications/:id/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ ...req.body, id: parseInt(req.params.id) }));
  }),
  rest.delete('http://localhost:8000/api/notifications/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
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

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Rendering and Data Loading', () => {
    it('should display notifications after loading', async () => {
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument();
      });

      expect(screen.getByText('Deadline Approaching')).toBeInTheDocument();
      expect(screen.getByText('Task Completed')).toBeInTheDocument();
    });

    it('should display notification types correctly', async () => {
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-1-type-info')).toBeInTheDocument();
      });

      expect(screen.getByTestId('notification-2-type-warning')).toBeInTheDocument();
      expect(screen.getByTestId('notification-3-type-success')).toBeInTheDocument();
    });

    it('should display unread notifications count', async () => {
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Filtering', () => {
    it('should filter notifications by type', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('type-filter')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('type-filter'), 'info');

      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument();
        expect(screen.queryByText('Deadline Approaching')).not.toBeInTheDocument();
      });
    });

    it('should filter notifications by read status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('status-filter'), 'unread');

      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument();
        expect(screen.queryByText('Task Completed')).not.toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should mark notification as read', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('mark-read-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('mark-read-1'));

      await waitFor(() => {
        expect(screen.getByTestId('notification-1')).toHaveClass('notification-read');
      });
    });

    it('should delete notification', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('delete-notification-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('delete-notification-1'));

      await waitFor(() => {
        expect(screen.queryByText('New Message')).not.toBeInTheDocument();
      });
    });

    it('should mark all as read', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('mark-all-read')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('mark-all-read'));

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no notifications exist', async () => {
      server.use(
        rest.get('http://localhost:8000/api/notifications/', (req, res, ctx) => {
          return res(ctx.json({ count: 0, results: [] }));
        })
      );

      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should display new notification badge', async () => {
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByTestId('new-notification-badge')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Notifications');
      });
    });

    it('should announce new notifications to screen readers', async () => {
      renderWithProviders(<NotificationCenter />);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
