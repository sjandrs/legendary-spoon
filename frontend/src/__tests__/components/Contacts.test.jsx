import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Contacts from '../../components/Contacts';
import api from '../../api';

// Mock API
jest.mock('../../api');
const mockApi = api;

// Test data
const mockContacts = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_number: '555-1234',
    account: { id: 1, name: 'Acme Corp' },
    owner: { id: 1, username: 'salesrep1' }
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone_number: '555-5678',
    account: { id: 2, name: 'Tech Solutions' },
    owner: { id: 2, username: 'salesrep2' }
  },
  {
    id: 3,
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob.johnson@example.com',
    phone_number: '555-9999',
    account: null,
    owner: null
  }
];

describe('Contacts Component - REQ-101.3', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default API mocks
    mockApi.get.mockImplementation((url) => {
      if (url === '/api/contacts/') {
        return Promise.resolve({ data: { results: mockContacts } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderContacts = () => {
    return render(
      <MemoryRouter>
        <Contacts />
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    it('renders contacts list page with header and description', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /contacts/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/central repository for all people and companies/i)).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderContacts();
      expect(screen.getByText(/loading contacts/i)).toBeInTheDocument();
    });

    it('renders Create New Contact button', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /create new contact/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole('link', { name: /create new contact/i });
      expect(createButton).toHaveAttribute('href', '/contacts/new');
    });
  });

  describe('Contact List Display', () => {
    it('displays contacts in a table format', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /phone number/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /account/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /owner/i })).toBeInTheDocument();
    });

    it('displays contact data correctly', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check first contact data
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-1234')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('salesrep1')).toBeInTheDocument();

      // Check second contact data
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-5678')).toBeInTheDocument();
      expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
      expect(screen.getByText('salesrep2')).toBeInTheDocument();
    });

    it('handles contacts with null account and owner', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      // Check contact with null values
      expect(screen.getByText('bob.johnson@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-9999')).toBeInTheDocument();
      expect(screen.getAllByText('N/A')).toHaveLength(2); // Account and Owner
    });

    it('creates clickable links for contact names', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'John Doe' })).toBeInTheDocument();
      });

      const contactLink = screen.getByRole('link', { name: 'John Doe' });
      expect(contactLink).toHaveAttribute('href', '/contacts/1');

      const contactLink2 = screen.getByRole('link', { name: 'Jane Smith' });
      expect(contactLink2).toHaveAttribute('href', '/contacts/2');
    });

    it('applies striped table styling', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(table).toHaveClass('contacts-table', 'striped-table');
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no contacts exist', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/get started by creating one/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('still shows Create New Contact button in empty state', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.resolve({ data: { results: [] } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /create new contact/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch contacts/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(screen.queryByText(/loading contacts/i)).not.toBeInTheDocument();
    });

    it('shows error message with error styling', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to fetch contacts/i);
        expect(errorMessage).toHaveClass('error-message');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator while fetching contacts', () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { results: mockContacts } }), 100);
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      expect(screen.getByText(/loading contacts/i)).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('hides loading indicator after data loads', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.queryByText(/loading contacts/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('hides loading indicator after error occurs', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        expect(screen.queryByText(/loading contacts/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText(/failed to fetch contacts/i)).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('calls the correct API endpoint on mount', async () => {
      renderContacts();

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/contacts/');
      });

      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it('handles API response with results array', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Verify all contacts from mock data are displayed
      mockContacts.forEach(contact => {
        expect(screen.getByText(`${contact.first_name} ${contact.last_name}`)).toBeInTheDocument();
      });
    });

    it('handles different API response structures gracefully', async () => {
      // Test with direct array response (fallback)
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.resolve({ data: mockContacts }); // Direct array
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Integration', () => {
    it('provides correct navigation links', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /create new contact/i })).toBeInTheDocument();
      });

      // Check create contact link
      const createLink = screen.getByRole('link', { name: /create new contact/i });
      expect(createLink).toHaveAttribute('href', '/contacts/new');

      // Check individual contact links
      const johnLink = screen.getByRole('link', { name: 'John Doe' });
      expect(johnLink).toHaveAttribute('href', '/contacts/1');

      const janeLink = screen.getByRole('link', { name: 'Jane Smith' });
      expect(janeLink).toHaveAttribute('href', '/contacts/2');
    });

    it('maintains router context for navigation', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getAllByRole('link')).toHaveLength(4); // 1 create + 3 contact links
      });

      // All links should be properly rendered as anchor elements
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Component Structure', () => {
    it('renders with proper container structure', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check main container
      const container = screen.getByRole('table').closest('.contacts-container');
      expect(container).toBeInTheDocument();

      // Check actions section
      const actionsSection = container.querySelector('.contacts-actions');
      expect(actionsSection).toBeInTheDocument();
    });

    it('maintains semantic HTML structure', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check semantic structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('table')).toHaveAttribute('class', expect.stringContaining('contacts-table'));
    });
  });

  describe('Data Display Format', () => {
    it('displays full names correctly', async () => {
      renderContacts();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check name concatenation
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('handles missing data gracefully', async () => {
      const incompleteContact = {
        id: 4,
        first_name: 'Incomplete',
        last_name: 'User',
        email: '',
        phone_number: '',
        account: null,
        owner: null
      };

      mockApi.get.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.resolve({ data: { results: [incompleteContact] } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContacts();

      await waitFor(() => {
        expect(screen.getByText('Incomplete User')).toBeInTheDocument();
      });

      // Check N/A handling for null values
      expect(screen.getAllByText('N/A')).toHaveLength(2);
    });
  });
});
