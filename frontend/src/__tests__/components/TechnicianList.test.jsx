import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import TechnicianList from '../../components/TechnicianList';
import { getTechnicians } from '../../api';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API calls
jest.mock('../../api', () => ({
  getTechnicians: jest.fn(),
}));

// Mock technician data
const createMockTechnician = (overrides = {}) => ({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  employee_id: 'EMP001',
  is_active: true,
  skills: 'HVAC, Plumbing',
  ...overrides,
});

const mockTechnicians = [
  createMockTechnician({ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' }),
  createMockTechnician({ id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }),
  createMockTechnician({ id: 3, first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com' }),
];

describe('TechnicianList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTechnicians.mockResolvedValue({ data: { results: mockTechnicians, count: 3 } });
  });

  const renderTechnicianList = (props = {}) => {
    return renderWithProviders(
      <TechnicianList onTechnicianSelect={jest.fn()} {...props} />
    );
  };

  describe('Loading and Data Display', () => {
    it('displays loading skeleton initially', () => {
      getTechnicians.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderTechnicianList();

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('displays technicians after loading', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('displays technician count', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText(/3 technicians/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters technicians by search term', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by name, id, or phone/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('filters by active status and hourly rate', async () => {
      renderTechnicianList();

      // Change Status filter
      const statusFilter = screen.getByLabelText('Status');
      fireEvent.change(statusFilter, { target: { value: 'true' } });

      await waitFor(() => {
        expect(getTechnicians).toHaveBeenCalledWith(expect.objectContaining({ is_active: 'true' }));
      });

      // Change hourly rate min
      const minRate = screen.getByPlaceholderText('Min');
      fireEvent.change(minRate, { target: { value: '25' } });

      await waitFor(() => {
        expect(getTechnicians).toHaveBeenCalledWith(expect.objectContaining({ min_hourly_rate: '25' }));
      });
    });
  });

  describe('Technician Actions', () => {
    it('calls onTechnicianSelect when View is clicked', async () => {
      const mockOnSelect = jest.fn();
      renderTechnicianList({ onTechnicianSelect: mockOnSelect });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click the first View button
      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      fireEvent.click(viewButtons[0]);
      expect(mockOnSelect).toHaveBeenCalledWith(mockTechnicians[0]);
    });

    it('calls onTechnicianEdit and onTechnicianDelete when actions are clicked', async () => {
      const onEdit = jest.fn();
      const onDelete = jest.fn();
      renderTechnicianList({ onTechnicianEdit: onEdit, onTechnicianDelete: onDelete });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(editButtons[0]);
      fireEvent.click(deleteButtons[0]);

      expect(onEdit).toHaveBeenCalledWith(mockTechnicians[0]);
      expect(onDelete).toHaveBeenCalledWith(mockTechnicians[0]);
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to load technicians';
      getTechnicians.mockRejectedValue(new Error(errorMessage));

      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText(/failed to load technicians/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByLabelText('Search')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      viewButtons[0].focus();
      expect(document.activeElement).toBe(viewButtons[0]);
    });
  });
  // Performance and virtualization are handled at integration level; omitted here.
});
