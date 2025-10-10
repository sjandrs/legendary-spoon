import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/helpers/test-utils';
import ContactList from '../ContactList';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
const mockedApi = api;

describe('ContactList Component', () => {
  const mockContacts = [
    {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    {
      id: 2,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the get function that ContactList actually uses
    mockedApi.get.mockResolvedValue({
      data: mockContacts, // Direct array, not wrapped in results
    });
  });

  it('renders contact list with loading state', async () => {
    renderWithProviders(<ContactList />);

    // Should show loading initially
    expect(screen.getByText(/loading contacts/i)).toBeInTheDocument();

    // Wait for contacts to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('displays contacts after loading', async () => {
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('My Contacts')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockedApi.get.mockRejectedValue({
      response: { data: { message: 'Failed to load contacts' } },
    });

    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load contacts/i)).toBeInTheDocument();
    });
  });

  it('makes correct API calls on mount', async () => {
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/api/my-contacts/');
    });
  });

  it('renders contact list title', async () => {
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('My Contacts')).toBeInTheDocument();
    });
  });

  it('renders contact names as links', async () => {
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      const johnLink = screen.getByRole('link', { name: 'John Doe' });
      const janeLink = screen.getByRole('link', { name: 'Jane Smith' });
      expect(johnLink).toHaveAttribute('href', '/contacts/1');
      expect(janeLink).toHaveAttribute('href', '/contacts/2');
    });
  });

  it('shows empty state when no contacts exist', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        results: [],
        count: 0,
      },
    });

    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
    });
  });

  it('displays contact list structure correctly', async () => {
    renderWithProviders(<ContactList />);

    await waitFor(() => {
      expect(screen.getByText('My Contacts')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });
});
