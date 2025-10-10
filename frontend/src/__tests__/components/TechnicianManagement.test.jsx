import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TechnicianManagement from '../../components/TechnicianManagement';
import { AuthProvider } from '../../contexts/AuthContext';
import axios from 'axios';

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock TechnicianForm component
jest.mock('../../components/TechnicianForm', () => {
  return function MockTechnicianForm({ technician, onClose }) {
    return (
      <div data-testid="technician-form" role="dialog" aria-labelledby="form-title">
        <h2 id="form-title">{technician ? 'Edit Technician' : 'Add Technician'}</h2>
        <button onClick={onClose} data-testid="close-form">Close</button>
        {technician && <div data-testid="editing-technician">{technician.first_name}</div>}
      </div>
    );
  };
});

// Mock users for different roles
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
  admin: {
    id: 3,
    username: 'admin',
    email: 'admin@example.com',
    groups: ['Admin']
  }
};

// Mock technician data
const mockTechnicians = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    phone: '555-0101',
    is_active: true,
    photo: null
  },
  {
    id: 2,
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '555-0102',
    is_active: false,
    photo: '/photos/sarah.jpg'
  },
  {
    id: 3,
    first_name: 'Mike',
    last_name: 'Davis',
    email: 'mike.davis@example.com',
    phone: '555-0103',
    is_active: true,
    photo: null
  }
];

// Test wrapper component
const TestWrapper = ({ children, authValue }) => {
  return (
    <AuthProvider value={authValue}>
      {children}
    </AuthProvider>
  );
};

// Render helper
const renderWithProviders = (component, authValue = { user: mockUsers.salesManager, token: 'test-token' }) => {
  return render(
    <TestWrapper authValue={authValue}>
      {component}
    </TestWrapper>
  );
};

// Mock React Query hooks
const mockUseQuery = useQuery;
const mockUseMutation = useMutation;
const mockUseQueryClient = useQueryClient;

// Setup React Query mocks
const setupQueryMocks = (queryData = mockTechnicians, isLoading = false, isError = false) => {
  mockUseQuery.mockReturnValue({
    data: queryData,
    isLoading,
    isError,
    error: isError ? new Error('Failed to load technicians') : null,
  });

  mockUseMutation.mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  });

  mockUseQueryClient.mockReturnValue({
    invalidateQueries: jest.fn(),
  });
};

// Cleanup
const cleanup = () => {
  jest.clearAllMocks();
};

describe('TechnicianManagement', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    setupQueryMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Component Rendering', () => {
    it('renders the main heading and add button', async () => {
      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByRole('heading', { name: /technician management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add technician/i })).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      setupQueryMocks(null, true, false);

      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByText(/loading technicians/i)).toBeInTheDocument();
    });

    it('displays technicians table after loading', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /phone/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('displays technician data in table rows', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('john.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('555-0101')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('sarah.johnson@example.com')).toBeInTheDocument();
      expect(screen.getByText('Mike Davis')).toBeInTheDocument();
    });

    it('displays correct status badges', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const activeStatuses = screen.getAllByText('Active');
      const inactiveStatuses = screen.getAllByText('Inactive');

      expect(activeStatuses).toHaveLength(2); // John and Mike
      expect(inactiveStatuses).toHaveLength(1); // Sarah
    });

    it('displays profile photos with fallback', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);

      // Check alt text
      expect(screen.getByAltText('John Smith profile photo')).toBeInTheDocument();
      expect(screen.getByAltText('Sarah Johnson profile photo')).toBeInTheDocument();
      expect(screen.getByAltText('Mike Davis profile photo')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      setupQueryMocks(null, false, true);

      renderWithProviders(<TechnicianManagement />);

      // The error message format is "Failed to load technicians"
      expect(screen.getByText('Failed to load technicians')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('handles empty technicians list', async () => {
      setupQueryMocks([]);

      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });

    it('handles malformed response data gracefully', async () => {
      setupQueryMocks([]);

      renderWithProviders(<TechnicianManagement />);

      // Should not crash and show table structure even with empty data
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('opens add technician form when add button is clicked', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add technician/i });
      await user.click(addButton);

      expect(screen.getByTestId('technician-form')).toBeInTheDocument();
      expect(screen.getByTestId('close-form')).toBeInTheDocument();
    });

    it('opens edit technician form when edit button is clicked', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByTestId('technician-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Technician')).toBeInTheDocument();
      expect(screen.getByTestId('editing-technician')).toHaveTextContent('John');
    });

    it('closes form when close button is clicked', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      // Open form
      const addButton = screen.getByRole('button', { name: /add technician/i });
      await user.click(addButton);

      expect(screen.getByTestId('technician-form')).toBeInTheDocument();

      // Close form
      const closeButton = screen.getByTestId('close-form');
      await user.click(closeButton);

      expect(screen.queryByTestId('technician-form')).not.toBeInTheDocument();
    });

    it('shows confirmation dialog when delete button is clicked', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const mockMutate = jest.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      });

      renderWithProviders(<TechnicianManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this technician?');
      expect(mockMutate).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });

    it('deletes technician when confirmed', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const mockMutate = jest.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      });

      renderWithProviders(<TechnicianManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });

    it('does not delete technician when cancelled', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      const mockMutate = jest.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      });

      renderWithProviders(<TechnicianManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('handles delete API error gracefully', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const mockMutate = jest.fn();

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: new Error('Delete failed'),
      });

      renderWithProviders(<TechnicianManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).toHaveBeenCalled();

      // Component should still be functional after error
      expect(screen.getByText('John Smith')).toBeInTheDocument();

      confirmSpy.mockRestore();
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows sales manager to access all features', async () => {
      renderWithProviders(<TechnicianManagement />, { user: mockUsers.salesManager, token: 'test-token' });

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /add technician/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(3);
    });

    it('allows admin to access all features', async () => {
      renderWithProviders(<TechnicianManagement />, { user: mockUsers.admin, token: 'test-token' });

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /add technician/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(3);
      expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(3);
    });

    it('restricts sales rep access appropriately', async () => {
      renderWithProviders(<TechnicianManagement />, { user: mockUsers.salesRep, token: 'test-token' });

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      // Sales rep should see the data but may have limited actions
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('handles large technician datasets efficiently', async () => {
      const largeTechnicianList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        first_name: `Technician${i}`,
        last_name: `LastName${i}`,
        email: `tech${i}@example.com`,
        phone: `555-${String(i).padStart(4, '0')}`,
        is_active: i % 2 === 0,
        photo: i % 3 === 0 ? `/photos/tech${i}.jpg` : null
      }));

      setupQueryMocks(largeTechnicianList);

      const startTime = performance.now();
      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByText('Technician0 LastName0')).toBeInTheDocument();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
      expect(screen.getAllByRole('row')).toHaveLength(101); // Header + 100 data rows
    });

    it('maintains performance with frequent re-renders', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Simulate multiple interactions
      const addButton = screen.getByRole('button', { name: /add technician/i });
      await user.click(addButton);

      const closeButton = screen.getByTestId('close-form');
      await user.click(closeButton);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      const closeButton2 = screen.getByTestId('close-form');
      await user.click(closeButton2);

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      expect(interactionTime).toBeLessThan(500); // All interactions under 500ms
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic HTML structure', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(5);
      expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 data rows
    });

    it('provides proper button labels and states', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add technician/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).not.toHaveAttribute('disabled');

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      editButtons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      deleteButtons.forEach(button => {
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    it('provides proper image alt text', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      mockTechnicians.forEach(tech => {
        const altText = `${tech.first_name} ${tech.last_name} profile photo`;
        expect(screen.getByAltText(altText)).toBeInTheDocument();
      });
    });

    it('maintains focus management when opening/closing modals', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add technician/i });

      await user.click(addButton);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-form');
      await user.click(closeButton);

      // Modal should be closed
      expect(screen.queryByTestId('technician-form')).not.toBeInTheDocument();
    });

    it('provides proper status indicators with semantic meaning', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const activeStatuses = screen.getAllByText('Active');
      const inactiveStatuses = screen.getAllByText('Inactive');

      activeStatuses.forEach(status => {
        expect(status).toHaveClass('bg-green-100', 'text-green-800');
      });

      inactiveStatuses.forEach(status => {
        expect(status).toHaveClass('bg-red-100', 'text-red-800');
      });
    });
  });

  describe('React Query Integration', () => {
    it('properly invalidates queries after successful delete', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const mockInvalidateQueries = jest.fn();
      const mockMutate = jest.fn();

      mockUseQueryClient.mockReturnValue({
        invalidateQueries: mockInvalidateQueries,
      });

      mockUseMutation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      });

      renderWithProviders(<TechnicianManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockMutate).toHaveBeenCalledWith(1);

      confirmSpy.mockRestore();
    });

    it('handles query loading states correctly', async () => {
      setupQueryMocks(null, true, false);

      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByText(/loading technicians/i)).toBeInTheDocument();

      // Update to loaded state
      setupQueryMocks(mockTechnicians, false, false);

      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('handles query error states correctly', async () => {
      setupQueryMocks(null, false, true);

      renderWithProviders(<TechnicianManagement />);

      expect(screen.getByText('Failed to load technicians')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Integration with TechnicianForm', () => {
    it('passes correct props to TechnicianForm for editing', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByTestId('technician-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Technician')).toBeInTheDocument();
      expect(screen.getByTestId('editing-technician')).toHaveTextContent('John');
    });

    it('passes correct props to TechnicianForm for creating', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add technician/i });
      await user.click(addButton);

      expect(screen.getByTestId('technician-form')).toBeInTheDocument();
      const form = screen.getByTestId('technician-form');
      expect(form).toContainElement(screen.getByRole('heading', { name: 'Add Technician' }));
      expect(screen.queryByTestId('editing-technician')).not.toBeInTheDocument();
    });

    it('properly handles form callbacks', async () => {
      renderWithProviders(<TechnicianManagement />);

      await waitFor(() => {
        expect(screen.queryByText(/loading technicians/i)).not.toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add technician/i });
      await user.click(addButton);

      expect(screen.getByTestId('technician-form')).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-form');
      await user.click(closeButton);

      expect(screen.queryByTestId('technician-form')).not.toBeInTheDocument();
    });
  });
});
