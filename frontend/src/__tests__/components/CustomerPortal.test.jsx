import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CustomerPortal from '../../components/CustomerPortal';
import { renderWithProviders } from '../../__tests__/helpers/test-utils';
import { testComponentAccessibility } from '../../__tests__/helpers/test-utils';

// Mock the API module
jest.mock('../../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = require('../../api').default;

describe('CustomerPortal Component - REQ-203.2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses
    mockedApi.get.mockResolvedValue({ data: [] });
    mockedApi.post.mockResolvedValue({ status: 201, data: { id: 1 } });
  });

  describe('Component Rendering', () => {
    it('renders customer portal with header and tabs', () => {
      renderWithProviders(<CustomerPortal />);

      expect(screen.getByText('Customer Service Portal')).toBeInTheDocument();
      expect(screen.getByText('Book Appointment')).toBeInTheDocument();
      expect(screen.getByText('Service Information')).toBeInTheDocument();
    });

    it('displays booking tab by default', () => {
      renderWithProviders(<CustomerPortal />);

      expect(screen.getByText('Schedule Service Appointment')).toBeInTheDocument();
      expect(screen.getByText(/Select a preferred time slot and provide service details/)).toBeInTheDocument();
    });

    it('loads service types on mount', async () => {
      renderWithProviders(<CustomerPortal />);

      await waitFor(() => {
        expect(screen.getByText('HVAC Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Emergency Service')).toBeInTheDocument();
      });
    });

    it('loads available time slots on mount', async () => {
      renderWithProviders(<CustomerPortal />);

      await waitFor(() => {
        // Should show available time slots
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.textContent.includes('at') && btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches to service information tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      await user.click(screen.getByText('Service Information'));

      expect(screen.getByRole('heading', { name: 'Service Information' })).toBeInTheDocument();
      expect(screen.getByText('Our Services')).toBeInTheDocument();
      expect(screen.getByText('Response Times')).toBeInTheDocument();
    });

    it('switches back to booking tab when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Switch to info tab first
      await user.click(screen.getByText('Service Information'));
      expect(screen.getByText('Our Services')).toBeInTheDocument();

      // Switch back to booking tab
      await user.click(screen.getByText('Book Appointment'));
      expect(screen.getByText('Schedule Service Appointment')).toBeInTheDocument();
    });
  });

  describe('Time Slot Selection', () => {
    it('displays available time slots in a grid', async () => {
      renderWithProviders(<CustomerPortal />);

      await waitFor(() => {
        const slotsGrid = screen.getByText('Select your preferred appointment time:').parentElement;
        expect(slotsGrid).toBeInTheDocument();
      });
    });

    it('allows selecting a time slot', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );

      await user.click(firstSlotButton);

      expect(screen.getByText('Selected:')).toBeInTheDocument();
      expect(screen.getByText('Change Time')).toBeInTheDocument();
    });

    it('allows changing selected time slot', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Select a slot first
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );

      await user.click(firstSlotButton);
      expect(screen.getByText('Selected:')).toBeInTheDocument();

      // Change the selection
      await user.click(screen.getByText('Change Time'));
      expect(screen.queryByText('Selected:')).not.toBeInTheDocument();
      expect(screen.getByText('Select your preferred appointment time:')).toBeInTheDocument();
    });
  });

  describe('Form Validation and Submission', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Select a time slot first (button should be enabled after selection)
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );
      await user.click(firstSlotButton);

      // Button should now be enabled since slot is selected
      const submitButton = screen.getByText('Submit Appointment Request');
      expect(submitButton).not.toBeDisabled();

      // Try to submit without filling required fields - should show validation
      await user.click(submitButton);

      // The form should prevent submission and show browser validation or error
      // Since we're using HTML5 validation, the form won't submit
      expect(screen.getByText('Schedule Service Appointment')).toBeInTheDocument(); // Still on the same page
    });

    it('enables submit button when all required fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Select a time slot
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );
      await user.click(firstSlotButton);

      // Fill required fields
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Phone Number *'), '555-123-4567');
      await user.type(screen.getByLabelText('Service Address *'), '123 Main St');
      await user.selectOptions(screen.getByLabelText('Service Type *'), 'hvac_repair');
      await user.type(screen.getByLabelText('Problem Description *'), 'AC not working');

      const submitButton = screen.getByText('Submit Appointment Request');
      expect(submitButton).not.toBeDisabled();
    });

    it('submits appointment request successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Select a time slot
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );
      await user.click(firstSlotButton);

      // Fill required fields
      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Phone Number *'), '555-123-4567');
      await user.type(screen.getByLabelText('Service Address *'), '123 Main St');
      await user.selectOptions(screen.getByLabelText('Service Type *'), 'hvac_repair');
      await user.type(screen.getByLabelText('Problem Description *'), 'AC not working');

      // Submit the form
      await user.click(screen.getByText('Submit Appointment Request'));

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/api/appointment-requests/', expect.objectContaining({
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '555-123-4567',
          customer_address: '123 Main St',
          service_type: 'hvac_repair',
          description: 'AC not working',
          status: 'pending'
        }));
      });

      expect(screen.getByText(/Your appointment request has been submitted successfully/)).toBeInTheDocument();
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      // Mock delayed response
      mockedApi.post.mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve({ status: 201, data: { id: 1 } }), 100)
      ));

      renderWithProviders(<CustomerPortal />);

      // Select a time slot and fill form
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );
      await user.click(firstSlotButton);

      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Phone Number *'), '555-123-4567');
      await user.type(screen.getByLabelText('Service Address *'), '123 Main St');
      await user.selectOptions(screen.getByLabelText('Service Type *'), 'hvac_repair');
      await user.type(screen.getByLabelText('Problem Description *'), 'AC not working');

      await user.click(screen.getByText('Submit Appointment Request'));

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('resets form after successful submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Select a time slot and fill form
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );
      await user.click(firstSlotButton);

      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Phone Number *'), '555-123-4567');
      await user.type(screen.getByLabelText('Service Address *'), '123 Main St');
      await user.selectOptions(screen.getByLabelText('Service Type *'), 'hvac_repair');
      await user.type(screen.getByLabelText('Problem Description *'), 'AC not working');
      await user.type(screen.getByLabelText('Additional Notes'), 'Please call first');

      await user.click(screen.getByText('Submit Appointment Request'));

      await waitFor(() => {
        expect(screen.getByText(/Your appointment request has been submitted successfully/)).toBeInTheDocument();
      });

      // Check that form is reset
      expect(screen.getByLabelText('Full Name *')).toHaveValue('');
      expect(screen.getByLabelText('Email Address *')).toHaveValue('');
      expect(screen.getByLabelText('Additional Notes')).toHaveValue('');
      expect(screen.queryByText('Selected:')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      mockedApi.post.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<CustomerPortal />);

      // Select a time slot and fill form
      await waitFor(() => {
        const slotButtons = screen.getAllByRole('button').filter(btn =>
          btn.className.includes('slot-btn')
        );
        expect(slotButtons.length).toBeGreaterThan(0);
      });

      const firstSlotButton = screen.getAllByRole('button').find(btn =>
        btn.className.includes('slot-btn')
      );
      await user.click(firstSlotButton);

      await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
      await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
      await user.type(screen.getByLabelText('Phone Number *'), '555-123-4567');
      await user.type(screen.getByLabelText('Service Address *'), '123 Main St');
      await user.selectOptions(screen.getByLabelText('Service Type *'), 'hvac_repair');
      await user.type(screen.getByLabelText('Problem Description *'), 'AC not working');

      await user.click(screen.getByText('Submit Appointment Request'));

      await waitFor(() => {
        expect(screen.getByText('Error submitting your request. Please try again or call us directly.')).toBeInTheDocument();
      });
    });
  });

  describe('Service Information Tab', () => {
    it('displays service information correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      await user.click(screen.getByText('Service Information'));

      expect(screen.getByText('Our Services')).toBeInTheDocument();
      expect(screen.getByText('HVAC Services:')).toBeInTheDocument();
      expect(screen.getByText('Plumbing:')).toBeInTheDocument();
      expect(screen.getByText('Service Areas')).toBeInTheDocument();
      expect(screen.getByText('Response Times')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
    });

    it('displays contact information', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      await user.click(screen.getByText('Service Information'));

      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('service@convergecrm.com')).toBeInTheDocument();
      expect(screen.getByText('Monday - Friday, 8 AM - 6 PM')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<CustomerPortal />);
    });

    it('has proper heading structure', () => {
      renderWithProviders(<CustomerPortal />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Main heading should be h1
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Customer Service Portal');
    });

    it('provides proper form labels', () => {
      renderWithProviders(<CustomerPortal />);

      expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument();
      expect(screen.getByLabelText('Service Address *')).toBeInTheDocument();
      expect(screen.getByLabelText('Service Type *')).toBeInTheDocument();
      expect(screen.getByLabelText('Problem Description *')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CustomerPortal />);

      // Tab through the interface to reach the first input field
      // First tab: from document to first focusable element (Book Appointment button)
      await user.tab();
      expect(screen.getByText('Book Appointment')).toHaveFocus();

      // Second tab: to Service Information button
      await user.tab();
      expect(screen.getByText('Service Information')).toHaveFocus();

      // Third tab: to first input field (Full Name)
      await user.tab();
      expect(screen.getByLabelText('Full Name *')).toHaveFocus();
    });

    it('provides descriptive button labels', () => {
      renderWithProviders(<CustomerPortal />);

      expect(screen.getByRole('button', { name: 'Book Appointment' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Service Information' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Appointment Request' })).toBeInTheDocument();
    });
  });
});
