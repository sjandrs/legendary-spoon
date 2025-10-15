import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TechnicianList from '../../components/TechnicianList';
import { getTechnicians, deleteTechnician } from '../../api';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API calls
jest.mock('../../api', () => ({
  getTechnicians: jest.fn(),
  deleteTechnician: jest.fn(),
}));

// Mock react-window for virtualization
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, height, itemCount, itemSize }) => (
    <div data-testid="virtualized-list" style={{ height }}>
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {children({ index, style: { height: itemSize } })}
        </div>
      ))}
    </div>
  ),
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

    it('shows virtualized list for performance', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('filters technicians by search term', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search technicians/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('filters by skill level', async () => {
      renderTechnicianList();

      const skillFilter = screen.getByLabelText(/filter by skill/i);
      fireEvent.change(skillFilter, { target: { value: 'senior' } });

      await waitFor(() => {
        expect(getTechnicians).toHaveBeenCalledWith(
          expect.objectContaining({
            skill_level: 'senior'
          })
        );
      });
    });

    it('filters by certification status', async () => {
      renderTechnicianList();

      const certificationFilter = screen.getByLabelText(/certification status/i);
      fireEvent.change(certificationFilter, { target: { value: 'certified' } });

      await waitFor(() => {
        expect(getTechnicians).toHaveBeenCalledWith(
          expect.objectContaining({
            certification_status: 'certified'
          })
        );
      });
    });
  });

  describe('Technician Actions', () => {
    it('calls onTechnicianSelect when technician is clicked', async () => {
      const mockOnSelect = jest.fn();
      renderTechnicianList({ onTechnicianSelect: mockOnSelect });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));
      expect(mockOnSelect).toHaveBeenCalledWith(mockTechnicians[0]);
    });

    it('opens edit modal when edit button is clicked', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getAllByText(/edit/i)[0];
      fireEvent.click(editButton);

      expect(screen.getByText(/edit technician/i)).toBeInTheDocument();
    });

    it('handles technician deletion with confirmation', async () => {
      deleteTechnician.mockResolvedValue({ data: { success: true } });
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText(/delete/i)[0];
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByText(/confirm delete/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteTechnician).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to load technicians';
      getTechnicians.mockRejectedValue(new Error(errorMessage));

      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText(/error loading technicians/i)).toBeInTheDocument();
      });
    });

    it('handles deletion errors gracefully', async () => {
      deleteTechnician.mockRejectedValue(new Error('Delete failed'));
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getAllByText(/delete/i)[0];
      fireEvent.click(deleteButton);

      const confirmButton = await screen.findByText(/confirm delete/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete technician/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label');
        expect(screen.getByRole('combobox', { name: /filter by skill/i })).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const firstTechnician = screen.getByText('John Doe').closest('button');
      firstTechnician.focus();

      expect(document.activeElement).toBe(firstTechnician);
    });
  });

  describe('Performance', () => {
    it('handles large datasets with virtualization', async () => {
      const largeTechnicianList = Array.from({ length: 1000 }, (_, i) =>
        mockTechnician({ id: i + 1, first_name: `Tech${i}`, last_name: 'User' })
      );

      getTechnicians.mockResolvedValue({
        data: { results: largeTechnicianList, count: 1000 }
      });

      renderTechnicianList();

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
        // Only renders visible items, not all 1000
        expect(screen.getAllByText(/Tech\d+ User/).length).toBeLessThan(20);
      });
    });
  });
});
