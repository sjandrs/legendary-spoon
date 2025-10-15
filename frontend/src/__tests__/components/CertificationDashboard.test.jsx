import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CertificationDashboard from '../../components/CertificationDashboard';
import { getCertifications, getTechnicianCertifications, createCertification, updateCertification, deleteCertification } from '../../api';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API calls
jest.mock('../../api', () => ({
  getCertifications: jest.fn(),
  getTechnicianCertifications: jest.fn(),
  createCertification: jest.fn(),
  updateCertification: jest.fn(),
  deleteCertification: jest.fn(),
}));

// Mock Chart.js
jest.mock('chart.js/auto', () => ({
  Chart: {
    register: jest.fn(),
  },
}));

jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-labels={JSON.stringify(data.labels)} data-datasets={JSON.stringify(data.datasets)}>
      Mock Doughnut Chart
    </div>
  ),
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-labels={JSON.stringify(data.labels)} data-datasets={JSON.stringify(data.datasets)}>
      Mock Bar Chart
    </div>
  ),
}));

const createMockCertification = (overrides = {}) => ({
  id: 1,
  name: 'HVAC Certification',
  description: 'Heating, Ventilation, and Air Conditioning certification',
  issuing_authority: 'HVAC Institute',
  validity_period_months: 24,
  required_for_roles: ['HVAC Technician', 'Senior Technician'],
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

const createMockTechnicianCertification = (overrides = {}) => ({
  id: 1,
  technician: 1,
  technician_name: 'John Doe',
  certification: 1,
  certification_name: 'HVAC Certification',
  obtained_date: '2023-01-15',
  expiration_date: '2025-01-15',
  certificate_number: 'HVAC-2023-001',
  is_current: true,
  days_until_expiration: 365,
  status: 'valid',
  ...overrides,
});

describe('CertificationDashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    getCertifications.mockResolvedValue({
      data: { results: [createMockCertification()] }
    });
    getTechnicianCertifications.mockResolvedValue({
      data: { results: [createMockTechnicianCertification()] }
    });
    createCertification.mockResolvedValue({
      data: createMockCertification({ id: 2 })
    });
    updateCertification.mockResolvedValue({
      data: createMockCertification()
    });
    deleteCertification.mockResolvedValue({});
  });

  const renderCertificationDashboard = (props = {}) => {
    return renderWithProviders(<CertificationDashboard {...props} />);
  };

  describe('Dashboard Loading', () => {
    it('renders loading states initially', () => {
      getCertifications.mockImplementation(() => new Promise(() => {}));
      getTechnicianCertifications.mockImplementation(() => new Promise(() => {}));

      renderCertificationDashboard();

      expect(screen.getByText(/loading certifications/i)).toBeInTheDocument();
      expect(screen.getByTestId('certification-skeleton')).toBeInTheDocument();
    });

    it('loads and displays dashboard data', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('Certification Dashboard')).toBeInTheDocument();
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(getCertifications).toHaveBeenCalled();
      expect(getTechnicianCertifications).toHaveBeenCalled();
    });
  });

  describe('Overview Statistics', () => {
    it('displays certification overview cards', async () => {
      const certifications = [
        createMockCertification({ id: 1, name: 'HVAC Certification' }),
        createMockCertification({ id: 2, name: 'Electrical Certification' }),
      ];
      const techCerts = [
        createMockTechnicianCertification({
          id: 1,
          certification_name: 'HVAC Certification',
          status: 'valid'
        }),
        createMockTechnicianCertification({
          id: 2,
          certification_name: 'Electrical Certification',
          status: 'expiring_soon',
          days_until_expiration: 15
        }),
      ];

      getCertifications.mockResolvedValue({ data: { results: certifications } });
      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('Total Certifications')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Active Certifications')).toBeInTheDocument();
        expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Expiring soon count
      });
    });

    it('calculates expiration statistics correctly', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          status: 'valid',
          days_until_expiration: 100
        }),
        createMockTechnicianCertification({
          status: 'expiring_soon',
          days_until_expiration: 15
        }),
        createMockTechnicianCertification({
          status: 'expired',
          days_until_expiration: -5
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('Expired')).toBeInTheDocument();
        expect(screen.getAllByText('1')).toHaveLength(2); // Expiring soon and expired counts
      });
    });
  });

  describe('Charts and Visualizations', () => {
    it('renders certification distribution chart', async () => {
      const certifications = [
        createMockCertification({ name: 'HVAC Certification' }),
        createMockCertification({ name: 'Electrical Certification' }),
      ];
      const techCerts = [
        createMockTechnicianCertification({ certification_name: 'HVAC Certification' }),
        createMockTechnicianCertification({ certification_name: 'HVAC Certification' }),
        createMockTechnicianCertification({ certification_name: 'Electrical Certification' }),
      ];

      getCertifications.mockResolvedValue({ data: { results: certifications } });
      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        const chartElement = screen.getByTestId('doughnut-chart');
        expect(chartElement).toBeInTheDocument();
        expect(chartElement).toHaveAttribute('data-labels', '["HVAC Certification","Electrical Certification"]');
      });
    });

    it('renders expiration timeline chart', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          status: 'valid',
          expiration_date: '2025-06-01'
        }),
        createMockTechnicianCertification({
          status: 'expiring_soon',
          expiration_date: '2024-12-15'
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        const chartElement = screen.getByTestId('bar-chart');
        expect(chartElement).toBeInTheDocument();
      });
    });
  });

  describe('Certification Management', () => {
    it('displays certification list with details', async () => {
      const certifications = [
        createMockCertification({
          name: 'HVAC Certification',
          issuing_authority: 'HVAC Institute',
          validity_period_months: 24
        }),
      ];

      getCertifications.mockResolvedValue({ data: { results: certifications } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
        expect(screen.getByText('HVAC Institute')).toBeInTheDocument();
        expect(screen.getByText('24 months')).toBeInTheDocument();
      });
    });

    it('opens create certification modal', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add certification/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add certification/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Certification')).toBeInTheDocument();
        expect(screen.getByLabelText(/certification name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/issuing authority/i)).toBeInTheDocument();
      });
    });

    it('creates new certification successfully', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add certification/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add certification/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/certification name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/certification name/i), 'New Certification');
      await user.type(screen.getByLabelText(/issuing authority/i), 'Test Authority');
      await user.type(screen.getByLabelText(/validity period/i), '12');

      const saveButton = screen.getByRole('button', { name: /save certification/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(createCertification).toHaveBeenCalledWith({
          name: 'New Certification',
          issuing_authority: 'Test Authority',
          validity_period_months: 12,
          description: '',
          required_for_roles: [],
          is_active: true,
        });
      });
    });

    it('edits existing certification', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit hvac certification/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Certification')).toBeInTheDocument();
        expect(screen.getByDisplayValue('HVAC Certification')).toBeInTheDocument();
      });

      const nameField = screen.getByDisplayValue('HVAC Certification');
      await user.clear(nameField);
      await user.type(nameField, 'Updated HVAC Certification');

      const saveButton = screen.getByRole('button', { name: /update certification/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateCertification).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'Updated HVAC Certification',
          })
        );
      });
    });

    it('deletes certification with confirmation', async () => {
      // Mock window.confirm
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete hvac certification/i });
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this certification? This action cannot be undone.'
      );

      await waitFor(() => {
        expect(deleteCertification).toHaveBeenCalledWith(1);
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Technician Certification Tracking', () => {
    it('displays technician certifications with status indicators', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          technician_name: 'John Doe',
          certification_name: 'HVAC Certification',
          status: 'valid',
          expiration_date: '2025-01-15'
        }),
        createMockTechnicianCertification({
          id: 2,
          technician_name: 'Jane Smith',
          certification_name: 'Electrical Certification',
          status: 'expiring_soon',
          expiration_date: '2024-12-15',
          days_until_expiration: 15
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
        expect(screen.getByText('Electrical Certification')).toBeInTheDocument();

        // Status indicators
        expect(screen.getByText('Valid')).toBeInTheDocument();
        expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      });
    });

    it('filters technician certifications by status', async () => {
      const techCerts = [
        createMockTechnicianCertification({ status: 'valid' }),
        createMockTechnicianCertification({ status: 'expiring_soon' }),
        createMockTechnicianCertification({ status: 'expired' }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter by status/i })).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /filter by status/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      });

      const expiringSoonOption = screen.getByText('Expiring Soon');
      await user.click(expiringSoonOption);

      // Should filter to show only expiring soon certifications
      await waitFor(() => {
        const validItems = screen.queryAllByText('Valid');
        const expiredItems = screen.queryAllByText('Expired');
        expect(validItems).toHaveLength(0);
        expect(expiredItems).toHaveLength(0);
      });
    });

    it('sorts technician certifications by expiration date', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sort by expiration/i })).toBeInTheDocument();
      });

      const sortButton = screen.getByRole('button', { name: /sort by expiration/i });
      await user.click(sortButton);

      // Verify API is called with sort parameter
      await waitFor(() => {
        expect(getTechnicianCertifications).toHaveBeenCalledWith(
          expect.objectContaining({
            sort: 'expiration_date'
          })
        );
      });
    });
  });

  describe('Alert Management', () => {
    it('displays expiration alerts', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          technician_name: 'John Doe',
          certification_name: 'HVAC Certification',
          status: 'expiring_soon',
          days_until_expiration: 10,
          expiration_date: '2024-12-25'
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText(/John Doe.*HVAC Certification.*expires in 10 days/i)).toBeInTheDocument();
        expect(screen.getByText('Certification Alert')).toBeInTheDocument();
      });
    });

    it('shows expired certification warnings', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          technician_name: 'Jane Smith',
          certification_name: 'Safety Certification',
          status: 'expired',
          days_until_expiration: -5,
          expiration_date: '2024-11-20'
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Jane Smith.*Safety Certification.*expired 5 days ago/i)).toBeInTheDocument();
        expect(screen.getByText('Expired Certification')).toBeInTheDocument();
      });
    });

    it('dismisses alert notifications', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          status: 'expiring_soon',
          days_until_expiration: 10
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('Certification Alert')).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText('Certification Alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('searches certifications by name', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search certifications/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search certifications/i);
      await user.type(searchInput, 'HVAC');

      await waitFor(() => {
        expect(getCertifications).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'HVAC'
          })
        );
      });
    });

    it('filters by certification authority', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter by authority/i })).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /filter by authority/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('HVAC Institute')).toBeInTheDocument();
      });

      const authorityOption = screen.getByText('HVAC Institute');
      await user.click(authorityOption);

      await waitFor(() => {
        expect(getCertifications).toHaveBeenCalledWith(
          expect.objectContaining({
            issuing_authority: 'HVAC Institute'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles certification loading errors', async () => {
      getCertifications.mockRejectedValue(new Error('Failed to load certifications'));

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText(/failed to load certifications/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('handles technician certification loading errors', async () => {
      getTechnicianCertifications.mockRejectedValue(new Error('Failed to load technician certifications'));

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText(/failed to load technician certifications/i)).toBeInTheDocument();
      });
    });

    it('retries failed requests', async () => {
      getCertifications.mockRejectedValueOnce(new Error('Network error'))
                      .mockResolvedValue({ data: { results: [createMockCertification()] } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('HVAC Certification')).toBeInTheDocument();
      });

      expect(getCertifications).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Certification Dashboard', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Overview', level: 2 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Certifications', level: 2 })).toBeInTheDocument();
      });
    });

    it('provides screen reader friendly status indicators', async () => {
      const techCerts = [
        createMockTechnicianCertification({
          status: 'valid',
          technician_name: 'John Doe',
          certification_name: 'HVAC Certification'
        }),
      ];

      getTechnicianCertifications.mockResolvedValue({ data: { results: techCerts } });

      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByLabelText(/john doe hvac certification status: valid/i)).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add certification/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add certification/i });

      await user.tab();
      expect(document.activeElement).toBe(addButton);
    });
  });

  describe('Performance', () => {
    it('renders dashboard within performance budget', async () => {
      const startTime = performance.now();
      renderCertificationDashboard();

      await waitFor(() => {
        expect(screen.getByText('Certification Dashboard')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('implements virtual scrolling for large certification lists', async () => {
      const largeCertificationList = Array.from({ length: 1000 }, (_, index) =>
        createMockCertification({ id: index + 1, name: `Certification ${index + 1}` })
      );

      getCertifications.mockResolvedValue({ data: { results: largeCertificationList } });

      renderCertificationDashboard();

      await waitFor(() => {
        // Should render only visible items, not all 1000
        const certificationItems = screen.getAllByText(/Certification \d+/);
        expect(certificationItems.length).toBeLessThan(100);
      });
    });
  });
});
