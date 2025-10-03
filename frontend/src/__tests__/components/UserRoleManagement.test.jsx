import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserRoleManagement from '../../components/UserRoleManagement';
import { AuthProvider } from '../../contexts/AuthContext';
import axios from 'axios';

// Test utility functions
const renderWithAuth = (component, authValue = { user: mockUsers.salesManager, token: 'test-token' }) => {
  return render(
    <AuthProvider value={authValue}>
      {component}
    </AuthProvider>
  );
};

const mockUsers = {
  salesRep: {
    id: 1,
    username: 'salesrep',
    email: 'salesrep@example.com',
    groups: ['Sales Rep']
  },
  salesManager: {
    id: 2,
    username: 'salesmanager',
    email: 'manager@example.com',
    groups: ['Sales Manager']
  },
  technician: {
    id: 3,
    username: 'technician',
    email: 'tech@example.com',
    groups: ['Technician']
  }
};

// Mock data for user role management
const mockUserRoleData = {
  users: [
    {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      groups: ['Sales Rep']
    },
    {
      id: 2,
      username: 'jane_manager',
      email: 'jane@example.com',
      groups: ['Sales Manager', 'Admin']
    },
    {
      id: 3,
      username: 'bob_tech',
      email: 'bob@example.com',
      groups: []
    },
    {
      id: 4,
      username: 'alice_admin',
      email: 'alice@example.com',
      groups: ['Admin', 'Sales Manager']
    }
  ],
  available_groups: [
    { id: 1, name: 'Sales Rep' },
    { id: 2, name: 'Sales Manager' },
    { id: 3, name: 'Admin' },
    { id: 4, name: 'Technician' },
    { id: 5, name: 'Accountant' }
  ]
};

const mockEmptyUserRoleData = {
  users: [],
  available_groups: []
};

describe('UserRoleManagement Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup default successful API response
    axios.get.mockResolvedValue({ data: mockUserRoleData });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('Component Rendering', () => {
    it('renders the main heading', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /user role management/i, level: 2 })).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      renderWithAuth(<UserRoleManagement />);

      expect(screen.getByText(/loading user roles/i)).toBeInTheDocument();
    });

    it('displays users table after loading', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(screen.getByText('john_doe')).toBeInTheDocument();
      expect(screen.getByText('jane_manager')).toBeInTheDocument();
      expect(screen.getByText('bob_tech')).toBeInTheDocument();
      expect(screen.getByText('alice_admin')).toBeInTheDocument();
    });

    it('displays table headers correctly', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      expect(screen.getByRole('columnheader', { name: /username/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /current roles/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('applies striped table styling', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toHaveClass('striped-table');
      });
    });
  });

  describe('User Data Display', () => {
    it('displays user information correctly', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Sales Rep')).toBeInTheDocument();
    });

    it('displays multiple roles correctly', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('jane_manager')).toBeInTheDocument();
      });

      expect(screen.getByText('Sales Manager, Admin')).toBeInTheDocument();
    });

    it('displays no roles message for users without roles', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('bob_tech')).toBeInTheDocument();
      });

      expect(screen.getByText('No roles assigned')).toBeInTheDocument();
    });

    it('shows empty state when no users exist', async () => {
      axios.get.mockResolvedValue({ data: mockEmptyUserRoleData });

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found.')).toBeInTheDocument();
      });
    });
  });

  describe('Role Assignment Actions', () => {
    it('displays add role buttons for unassigned roles', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      // john_doe should have "Add Sales Manager" button since he doesn't have that role
      expect(screen.getAllByRole('button', { name: /add sales manager/i })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: /add admin/i })).toHaveLength(2);
    });

    it('displays remove role buttons for assigned roles', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('jane_manager')).toBeInTheDocument();
      });

      // jane_manager should have "Remove Sales Manager" and "Remove Admin" buttons
      expect(screen.getAllByRole('button', { name: /remove sales manager/i })).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: /remove admin/i })).toHaveLength(2);
    });

    it('styles add buttons with green background', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        const addButton = screen.getAllByRole('button', { name: /add sales manager/i })[0];
        expect(addButton).toHaveStyle('background-color: #4caf50');
        expect(addButton).toHaveStyle('color: white');
      });
    });

    it('styles remove buttons with red background', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        const removeButton = screen.getAllByRole('button', { name: /remove sales manager/i })[0];
        expect(removeButton).toHaveStyle('background-color: #f44336');
        expect(removeButton).toHaveStyle('color: white');
      });
    });
  });

  describe('API Integration', () => {
    it('fetches user roles on component mount', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/user-roles/');
      });
    });

    it('handles API request failure gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Server error'));

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load user roles.')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load user roles.')).toHaveClass('error-message');
    });

    it('calls assign role API when add button clicked', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      const addButton = screen.getAllByRole('button', { name: /add sales manager/i })[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/user-roles/', {
          user_id: 1,
          group_name: 'Sales Manager',
          action: 'add'
        });
      });
    });

    it('calls remove role API when remove button clicked', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('jane_manager')).toBeInTheDocument();
      });

      const removeButton = screen.getAllByRole('button', { name: /remove admin/i })[0]; // Get the first one (jane_manager's button)
      await user.click(removeButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/user-roles/', {
          user_id: 2,
          group_name: 'Admin',
          action: 'remove'
        });
      });
    });

    it('refetches data after successful role assignment', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledTimes(1); // Initial fetch

      const addButton = screen.getAllByRole('button', { name: /add sales manager/i })[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2); // Refetch after assignment
      });
    });

    it('handles role assignment API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock POST to fail
      axios.post.mockRejectedValue(new Error('Invalid request'));

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      const addButton = screen.getAllByRole('button', { name: /add sales manager/i })[0];
      await user.click(addButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error assigning role:', expect.any(Object));
      });

      consoleSpy.mockRestore();
    });

    it('handles role removal API failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock POST to fail
      axios.post.mockRejectedValue(new Error('Invalid request'));

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('jane_manager')).toBeInTheDocument();
      });

      const removeButton = screen.getAllByRole('button', { name: /remove admin/i })[0];
      await user.click(removeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error removing role:', expect.any(Object));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Role-Based Access Control', () => {
    it('displays full functionality for Sales Manager', async () => {
      renderWithAuth(<UserRoleManagement />, {
        user: mockUsers.salesManager,
        token: 'manager-token'
      });

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Should see all role management buttons
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('renders component for different user roles', async () => {
      renderWithAuth(<UserRoleManagement />, {
        user: mockUsers.salesRep,
        token: 'rep-token'
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /user role management/i, level: 2 })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('uses semantic table structure', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      expect(screen.getAllByRole('rowgroup')).toHaveLength(2); // thead and tbody
      expect(screen.getAllByRole('columnheader')).toHaveLength(4);
    });

    it('provides meaningful button labels', async () => {
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /add sales manager/i })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: /remove admin/i })).toHaveLength(2);
      });
    });

    it('displays error message with appropriate class', async () => {
      axios.get.mockRejectedValue(new Error('Server error'));

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        const errorElement = screen.getByText('Failed to load user roles.');
        expect(errorElement).toHaveClass('error-message');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed API response gracefully', async () => {
      axios.get.mockResolvedValue({ data: { invalid: 'response' } });

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found.')).toBeInTheDocument();
      });
    });

    it('handles null or undefined users array', async () => {
      axios.get.mockResolvedValue({ data: { users: null, available_groups: [] } });

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('No users found.')).toBeInTheDocument();
      });
    });

    it('handles null or undefined available_groups array', async () => {
      axios.get.mockResolvedValue({ data: {
        users: [{ id: 1, username: 'test', email: 'test@example.com', groups: [] }],
        available_groups: null
      } });

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
      });

      // Should not crash and should display user without role buttons
    });

    it('handles user with empty groups array', async () => {
      const userData = {
        users: [{ id: 1, username: 'empty_user', email: 'empty@example.com', groups: [] }],
        available_groups: [{ id: 1, name: 'Test Role' }]
      };

      axios.get.mockResolvedValue({ data: userData });

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('empty_user')).toBeInTheDocument();
      });

      expect(screen.getByText('No roles assigned')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /add test role/i })).toHaveLength(1);
    });

    it.skip('handles network timeout gracefully', async () => {
      // TODO: Implement proper timeout testing - complex async behavior
      // Mock a slow request to show loading state persists
      axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithAuth(<UserRoleManagement />);

      expect(screen.getByText(/loading user roles/i)).toBeInTheDocument();

      // Component should remain in loading state without crashing
    });
  });

  describe('Performance', () => {
    it('renders large user lists efficiently', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        username: `user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        groups: i % 2 === 0 ? ['Sales Rep'] : []
      }));

      axios.get.mockResolvedValue({ data: {
        users: largeUserList,
        available_groups: mockUserRoleData.available_groups
      } });

      const startTime = performance.now();
      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('user_1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('handles many available roles efficiently', async () => {
      const manyRoles = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Role_${i + 1}`
      }));

      axios.get.mockResolvedValue({ data: {
        users: mockUserRoleData.users,
        available_groups: manyRoles
      } });

      renderWithAuth(<UserRoleManagement />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
      });

      // Should render all role buttons without performance issues
      expect(screen.getAllByRole('button').length).toBeGreaterThan(15);
    });
  });
});
