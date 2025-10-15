import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TechnicianDetail from '../../components/TechnicianDetail';
import {
  getTechnician,
  getTechnicianCertifications,
  getTechnicianAvailability,
  updateTechnician,
  deleteTechnician
} from '../../api';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API calls
jest.mock('../../api', () => ({
  getTechnician: jest.fn(),
  getTechnicianCertifications: jest.fn(),
  getTechnicianAvailability: jest.fn(),
  updateTechnician: jest.fn(),
  deleteTechnician: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
  useNavigate: () => jest.fn(),
}));

// Mock data factories
const createMockTechnician = (overrides = {}) => ({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  employee_id: 'EMP001',
  address: '123 Main St, City, State 12345',
  emergency_contact: 'Jane Doe: +1-555-0456',
  base_hourly_rate: '25.00',
  hire_date: '2023-01-15',
  is_active: true,
  skills: 'HVAC, Plumbing, Electrical',
  notes: 'Experienced technician with excellent customer service',
  photo: '/uploads/technicians/john_doe.jpg',
  created_at: '2023-01-15T00:00:00Z',
  updated_at: '2023-06-15T00:00:00Z',
  ...overrides,
});

const mockCertifications = [
  {
    id: 1,
    certification: {
      id: 1,
      name: 'HVAC Certification',
      authority: 'NATE',
      description: 'North American Technician Excellence',
    },
    obtained_date: '2023-01-15',
    expiration_date: '2025-01-15',
    certificate_number: 'CERT123456',
    status: 'active',
  },
  {
    id: 2,
    certification: {
      id: 2,
      name: 'EPA Section 608',
      authority: 'EPA',
      description: 'Refrigerant Handling Certification',
    },
    obtained_date: '2023-02-01',
    expiration_date: '2026-02-01',
    certificate_number: 'EPA789012',
    status: 'active',
  },
];

const mockAvailability = [
  {
    id: 1,
    day_of_week: 1, // Monday
    start_time: '08:00',
    end_time: '17:00',
    is_available: true,
    notes: 'Regular business hours',
  },
  {
    id: 2,
    day_of_week: 2, // Tuesday
    start_time: '08:00',
    end_time: '17:00',
    is_available: true,
    notes: 'Regular business hours',
  },
];

describe('TechnicianDetail', () => {
  const mockTechnician = createMockTechnician();

  beforeEach(() => {
    jest.clearAllMocks();
    getTechnician.mockResolvedValue({ data: mockTechnician });
    getTechnicianCertifications.mockResolvedValue({ data: mockCertifications });
    getTechnicianAvailability.mockResolvedValue({ data: mockAvailability });
  });

  const renderTechnicianDetail = (props = {}) => {
    return renderWithProviders(<TechnicianDetail {...props} />);
  };

  describe('Loading and Data Display', () => {
    it('displays loading skeleton initially', () => {
      getTechnician.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderTechnicianDetail();

      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('displays technician details after loading', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('EMP001')).toBeInTheDocument();
        expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      });
    });

    it('displays technician photo with fallback', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        const photo = screen.getByAltText('John Doe');
        expect(photo).toBeInTheDocument();
        expect(photo).toHaveAttribute('src', '/uploads/technicians/john_doe.jpg');
      });
    });

    it('displays active status badge', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Active')).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('displays inactive status badge', async () => {
      getTechnician.mockResolvedValue({
        data: createMockTechnician({ is_active: false })
      });

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toHaveClass('bg-red-100', 'text-red-800');
      });
    });
  });

  describe('Contact Information', () => {
    it('displays all contact information fields', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe: +1-555-0456')).toBeInTheDocument();
      });
    });

    it('makes email and phone clickable', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        const emailLink = screen.getByRole('link', { name: /john.doe@example.com/i });
        const phoneLink = screen.getByRole('link', { name: /\+1-555-0123/i });

        expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@example.com');
        expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-0123');
      });
    });
  });

  describe('Employment Information', () => {
    it('displays employment details', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('$25.00/hr')).toBeInTheDocument();
        expect(screen.getByText('January 15, 2023')).toBeInTheDocument();
        expect(screen.getByText('HVAC, Plumbing, Electrical')).toBeInTheDocument();
      });
    });

    it('calculates and displays tenure', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        // Should show tenure calculation (varies based on current date)
        expect(screen.getByText(/\d+ years?/)).toBeInTheDocument();
      });
    });
  });

  describe('Certifications Section', () => {
    it('displays certification list', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
        expect(screen.getByText('EPA Section 608')).toBeInTheDocument();
        expect(screen.getByText('NATE')).toBeInTheDocument();
        expect(screen.getByText('EPA')).toBeInTheDocument();
      });
    });

    it('shows certification expiration status', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('Expires: January 15, 2025')).toBeInTheDocument();
        expect(screen.getByText('Expires: February 1, 2026')).toBeInTheDocument();
      });
    });

    it('highlights expiring certifications', async () => {
      const expiringSoon = {
        ...mockCertifications[0],
        expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      };
      getTechnicianCertifications.mockResolvedValue({
        data: [expiringSoon, mockCertifications[1]]
      });

      renderTechnicianDetail();

      await waitFor(() => {
        const expiringBadge = screen.getByText('Expiring Soon');
        expect(expiringBadge).toBeInTheDocument();
        expect(expiringBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });

    it('displays empty state when no certifications', async () => {
      getTechnicianCertifications.mockResolvedValue({ data: [] });

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('No certifications on file')).toBeInTheDocument();
      });
    });
  });

  describe('Availability Section', () => {
    it('displays weekly availability schedule', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('Monday')).toBeInTheDocument();
        expect(screen.getByText('Tuesday')).toBeInTheDocument();
        expect(screen.getByText('8:00 AM - 5:00 PM')).toBeInTheDocument();
      });
    });

    it('shows unavailable days', async () => {
      const limitedAvailability = [
        mockAvailability[0],
        {
          ...mockAvailability[1],
          is_available: false,
          notes: 'Not available Tuesdays'
        }
      ];
      getTechnicianAvailability.mockResolvedValue({ data: limitedAvailability });

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
        expect(screen.getByText('Not available Tuesdays')).toBeInTheDocument();
      });
    });

    it('displays empty state when no availability set', async () => {
      getTechnicianAvailability.mockResolvedValue({ data: [] });

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('No availability schedule set')).toBeInTheDocument();
      });
    });
  });

  describe('Action Buttons', () => {
    it('displays edit and delete buttons for authorized users', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /edit technician/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /delete technician/i })).toBeInTheDocument();
      });
    });

    it('opens edit form when edit button is clicked', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit technician/i });
      fireEvent.click(editButton);

      expect(screen.getByText(/edit technician/i)).toBeInTheDocument();
    });

    it('shows delete confirmation modal', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete technician/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('handles technician deletion', async () => {
      deleteTechnician.mockResolvedValue({ data: { success: true } });
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete technician/i });
      fireEvent.click(deleteButton);

      const confirmButton = await screen.findByRole('button', { name: /confirm delete/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(deleteTechnician).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when technician not found', async () => {
      getTechnician.mockRejectedValue(new Error('Technician not found'));

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText(/technician not found/i)).toBeInTheDocument();
      });
    });

    it('displays error message when API call fails', async () => {
      getTechnician.mockRejectedValue(new Error('Network error'));

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText(/error loading technician/i)).toBeInTheDocument();
      });
    });

    it('handles certification loading errors gracefully', async () => {
      getTechnicianCertifications.mockRejectedValue(new Error('Failed to load certifications'));

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/error loading certifications/i)).toBeInTheDocument();
      });
    });

    it('handles availability loading errors gracefully', async () => {
      getTechnicianAvailability.mockRejectedValue(new Error('Failed to load availability'));

      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/error loading availability/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('John Doe');
        expect(screen.getByRole('heading', { level: 2, name: /contact information/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /certifications/i })).toBeInTheDocument();
      });
    });

    it('has proper ARIA labels for action buttons', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit technician/i });
        const deleteButton = screen.getByRole('button', { name: /delete technician/i });

        expect(editButton).toHaveAttribute('aria-label');
        expect(deleteButton).toHaveAttribute('aria-label');
      });
    });

    it('supports keyboard navigation', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit technician/i });
        editButton.focus();
        expect(document.activeElement).toBe(editButton);
      });
    });
  });

  describe('Data Refresh', () => {
    it('refetches data when technician ID changes', async () => {
      const { rerender } = renderTechnicianDetail();

      await waitFor(() => {
        expect(getTechnician).toHaveBeenCalledWith(1);
      });

      // Simulate route change to different technician
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useParams: () => ({ id: '2' }),
      }));

      rerender(<TechnicianDetail />);

      await waitFor(() => {
        expect(getTechnician).toHaveBeenCalledWith(2);
      });
    });

    it('provides refresh functionality', async () => {
      renderTechnicianDetail();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(getTechnician).toHaveBeenCalledTimes(2);
      });
    });
  });
});
