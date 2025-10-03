import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmailCommunication from '../../components/EmailCommunication';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  sendInvoiceEmail: jest.fn(),
  sendOverdueReminders: jest.fn(),
  getOverdueInvoices: jest.fn(),
}));

// Mock CSS import
jest.mock('../../components/EmailCommunication.css', () => ({}));

// Mock window.alert
global.alert = jest.fn();

const mockOverdueInvoices = [
  {
    id: 1,
    total_amount: '1500.00',
    due_date: '2024-09-15',
    work_order: {
      project: {
        title: 'Office Network Setup',
        contact: {
          first_name: 'John',
          last_name: 'Smith'
        }
      }
    }
  },
  {
    id: 2,
    total_amount: '2500.00',
    due_date: '2024-08-30',
    work_order: {
      description: 'Server Installation',
      project: {
        contact: {
          first_name: 'Jane',
          last_name: 'Doe'
        }
      }
    }
  },
  {
    id: 3,
    total_amount: '750.00',
    due_date: '2024-09-20',
    work_order: {
      project: {
        title: 'Network Maintenance'
      }
    }
  }
];

const mockEmailResults = {
  sent: 2,
  failed: 1,
  message: 'Reminder emails processed successfully'
};

const renderEmailCommunication = () => {
  return render(
    <BrowserRouter>
      <EmailCommunication />
    </BrowserRouter>
  );
};

describe('EmailCommunication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert.mockClear();
    api.getOverdueInvoices.mockResolvedValue({ data: mockOverdueInvoices });
    api.sendInvoiceEmail.mockResolvedValue({});
    api.sendOverdueReminders.mockResolvedValue({ data: mockEmailResults });
  });

  // Component Rendering Tests
  describe('Component Rendering', () => {
    it('renders email communication page with main heading', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Email Communication');
        expect(api.getOverdueInvoices).toHaveBeenCalled();
      });
    });

    it('displays description about automated communications', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Manage automated customer communications for invoices and payments')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      renderEmailCommunication();

      expect(screen.getByText('Loading email communication...')).toBeInTheDocument();
    });

    it('renders summary cards section', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const summaryCards = document.querySelectorAll('.summary-card');
        expect(summaryCards).toHaveLength(2);
        expect(summaryCards[0].querySelector('h3')).toHaveTextContent('Overdue Invoices');
        expect(summaryCards[1].querySelector('h3')).toHaveTextContent('Last Reminder Batch');
      });
    });

    it('renders bulk actions section', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Bulk Email Actions')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Overdue Reminders/ })).toBeInTheDocument();
      });
    });

    it('renders email templates information section', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Email Templates')).toBeInTheDocument();
        expect(screen.getByText('Invoice Email')).toBeInTheDocument();
        expect(screen.getByText('Overdue Reminder')).toBeInTheDocument();
      });
    });
  });

  // Data Loading Tests
  describe('Data Loading', () => {
    it('fetches overdue invoices on component mount', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(api.getOverdueInvoices).toHaveBeenCalledTimes(1);
      });
    });

    it('displays overdue invoices count in summary', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const summaryValue = document.querySelector('.summary-value.warning');
        expect(summaryValue).toHaveTextContent('3'); // Count of mock invoices
      });
    });

    it('shows N/A for last reminder batch initially', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const summaryCards = document.querySelectorAll('.summary-card');
        const lastReminderCard = summaryCards[1]; // Second card is "Last Reminder Batch"
        expect(lastReminderCard.querySelector('.summary-value')).toHaveTextContent('N/A');
      });
    });

    it('displays overdue invoices in table format', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Invoice #')).toBeInTheDocument();
        expect(screen.getByText('Work Order')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Office Network Setup')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('calculates and displays days overdue correctly', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const overdueElements = screen.getAllByText(/days/);
        expect(overdueElements.length).toBeGreaterThan(0);
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('displays error message when fetching invoices fails', async () => {
      api.getOverdueInvoices.mockRejectedValue(new Error('Network error'));

      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch overdue invoices')).toBeInTheDocument();
      });
    });

    it('handles error when sending individual invoice email', async () => {
      api.sendInvoiceEmail.mockRejectedValue(new Error('Email send failed'));

      renderEmailCommunication();

      await waitFor(() => {
        const sendButton = screen.getAllByText('Send Reminder')[0];
        fireEvent.click(sendButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to send invoice email')).toBeInTheDocument();
      });
    });

    it('handles error when sending bulk overdue reminders', async () => {
      api.sendOverdueReminders.mockRejectedValue(new Error('Bulk send failed'));

      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to send overdue reminders')).toBeInTheDocument();
      });
    });

    it('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      api.getOverdueInvoices.mockRejectedValue(new Error('Test error'));

      renderEmailCommunication();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  // Email Sending Functionality Tests
  describe('Email Sending Functionality', () => {
    it('sends individual invoice email when button clicked', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const sendButtons = screen.getAllByText('Send Reminder');
        fireEvent.click(sendButtons[0]);
      });

      expect(api.sendInvoiceEmail).toHaveBeenCalledWith(1);
    });

    it('shows success alert after sending individual email', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const sendButtons = screen.getAllByText('Send Reminder');
        fireEvent.click(sendButtons[0]);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Invoice email sent successfully!');
      });
    });

    it('sends bulk overdue reminders when bulk button clicked', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);
      });

      expect(api.sendOverdueReminders).toHaveBeenCalledTimes(1);
    });

    it('shows success alert with results after bulk sending', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Sent 2 reminders, 1 failed');
      });
    });

    it('refreshes invoice list after sending emails', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(api.getOverdueInvoices).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const sendButtons = screen.getAllByText('Send Reminder');
        fireEvent.click(sendButtons[0]);
      });

      await waitFor(() => {
        expect(api.getOverdueInvoices).toHaveBeenCalledTimes(2);
      });
    });

    it('displays email results after bulk sending', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Last Batch Results')).toBeInTheDocument();
        expect(screen.getByText('Sent: 2 | Failed: 1')).toBeInTheDocument();
        expect(screen.getByText('Reminder emails processed successfully')).toBeInTheDocument();
      });
    });

    it('updates summary card with email results', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(screen.getByText('2/3')).toBeInTheDocument(); // Sent/Total in summary
      });
    });
  });

  // UI State Management Tests
  describe('UI State Management', () => {
    it('disables buttons during email sending', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const sendButtons = screen.getAllByText('Send Reminder');
        fireEvent.click(sendButtons[0]);

        // Check if buttons are disabled during sending
        sendButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    it('shows sending state in bulk button text', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);

        expect(screen.getByText('Sending...')).toBeInTheDocument();
      });
    });

    it('re-enables buttons after email sending completes', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        fireEvent.click(bulkButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send Overdue Reminders/ })).not.toBeDisabled();
      });
    });

    it('disables bulk button when no overdue invoices', async () => {
      api.getOverdueInvoices.mockResolvedValue({ data: [] });

      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        expect(bulkButton).toBeDisabled();
      });
    });

    it('shows appropriate message when no overdue invoices', async () => {
      api.getOverdueInvoices.mockResolvedValue({ data: [] });

      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('🎉 No overdue invoices! All payments are up to date.')).toBeInTheDocument();
      });
    });
  });

  // Data Display Tests
  describe('Data Display', () => {
    it('displays work order title when available', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Office Network Setup')).toBeInTheDocument();
      });
    });

    it('falls back to work order description when title not available', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Server Installation')).toBeInTheDocument();
      });
    });

    it('displays N/A when neither title nor description available', async () => {
      const invoiceWithoutWorkOrder = [{
        id: 4,
        total_amount: '500.00',
        due_date: '2024-09-25',
        work_order: {}
      }];

      api.getOverdueInvoices.mockResolvedValue({ data: invoiceWithoutWorkOrder });

      renderEmailCommunication();

      await waitFor(() => {
        const table = screen.getByRole('table');
        const workOrderCell = table.querySelector('tbody tr td:nth-child(2)');
        expect(workOrderCell).toHaveTextContent('N/A');
      });
    });

    it('displays customer name from contact information', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
    });

    it('applies correct CSS classes for days overdue severity', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const overdueElements = document.querySelectorAll('.days-overdue');
        expect(overdueElements.length).toBeGreaterThan(0);

        // Check that severity classes are applied
        const hasWarningSeverity = Array.from(overdueElements).some(el =>
          el.classList.contains('warning') || el.classList.contains('critical') || el.classList.contains('mild')
        );
        expect(hasWarningSeverity).toBe(true);
      });
    });

    it('formats dates correctly', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        // Check that dates are displayed in locale format
        const dateElements = screen.getAllByText(/\/\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('formats monetary amounts correctly', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('$1500.00')).toBeInTheDocument();
        expect(screen.getByText('$2500.00')).toBeInTheDocument();
        expect(screen.getByText('$750.00')).toBeInTheDocument();
      });
    });
  });

  // Email Template Information Tests
  describe('Email Template Information', () => {
    it('displays invoice email template information', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Sent when generating new invoices or manually requested.')).toBeInTheDocument();
        expect(screen.getByText('Includes invoice details and payment instructions')).toBeInTheDocument();
        expect(screen.getByText('Automatically attaches PDF if available')).toBeInTheDocument();
      });
    });

    it('displays overdue reminder template information', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Sent for invoices past due date.')).toBeInTheDocument();
        expect(screen.getByText('Includes payment terms and overdue amount')).toBeInTheDocument();
        expect(screen.getByText('Multiple reminder levels available')).toBeInTheDocument();
      });
    });

    it('shows template features as bulleted lists', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBeGreaterThanOrEqual(6); // 3 for each template
      });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('renders efficiently with multiple invoices', async () => {
      const startTime = performance.now();
      renderEmailCommunication();

      await waitFor(() => {
        expect(screen.getByText('Email Communication')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render within 1 second
    });

    it('handles large invoice lists without performance issues', async () => {
      const largeInvoiceList = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        total_amount: `${(i + 1) * 100}.00`,
        due_date: '2024-09-15',
        work_order: {
          project: {
            title: `Project ${i + 1}`,
            contact: {
              first_name: 'Test',
              last_name: `User ${i + 1}`
            }
          }
        }
      }));

      api.getOverdueInvoices.mockResolvedValue({ data: largeInvoiceList });

      const startTime = performance.now();
      renderEmailCommunication();

      await waitFor(() => {
        const summaryValue = document.querySelector('.summary-value.warning');
        expect(summaryValue).toHaveTextContent('50'); // Count in summary
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should handle large lists efficiently
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        const h2s = screen.getAllByRole('heading', { level: 2 });
        const h3s = screen.getAllByRole('heading', { level: 3 });

        expect(h1).toBeInTheDocument();
        expect(h2s.length).toBeGreaterThan(0);
        expect(h3s.length).toBeGreaterThan(0);
      });
    });

    it('has accessible table structure', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        const columnHeaders = screen.getAllByRole('columnheader');
        expect(columnHeaders.length).toBe(7); // All table headers
      });
    });

    it('provides accessible button labels', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const sendButtons = screen.getAllByText('Send Reminder');
        sendButtons.forEach(button => {
          expect(button).toHaveAccessibleName();
        });

        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        expect(bulkButton).toHaveAccessibleName();
      });
    });

    it('maintains focus management during state changes', async () => {
      renderEmailCommunication();

      await waitFor(() => {
        const bulkButton = screen.getByRole('button', { name: /Send Overdue Reminders/ });
        bulkButton.focus();
        expect(document.activeElement).toBe(bulkButton);

        fireEvent.click(bulkButton);
        // Focus should remain manageable even during loading states
      });
    });
  });
});
