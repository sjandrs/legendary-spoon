import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PaperworkTemplateManager from '../../components/PaperworkTemplateManager';
import { renderWithProviders } from '../../__tests__/helpers/test-utils';
import { testComponentAccessibility } from '../../__tests__/helpers/test-utils';

// Mock the API module
jest.mock('../../api', () => ({
  __esModule__: true,
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

const { get: mockedGet, post: mockedPost, patch: mockedPatch, delete: mockedDelete } = require('../../api');

describe('PaperworkTemplateManager Component - REQ-203.5', () => {
  const mockTemplates = [
    {
      id: 1,
      name: 'Service Invoice',
      description: 'Standard service invoice template',
      category: 'invoice',
      content: '<h1>Invoice for {{customer_name}}</h1>',
      conditional_logic: 'if total_amount > 100 then show_discount',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Work Order',
      description: 'Standard work order template',
      category: 'work_order',
      content: '<h1>Work Order #{{work_order_id}}</h1>',
      conditional_logic: '',
      is_active: false,
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API responses
    mockedGet.mockResolvedValue({
      data: { results: mockTemplates }
    });
    mockedPost.mockResolvedValue({
      data: { id: 3, ...mockTemplates[0], name: 'New Template' }
    });
    mockedPatch.mockResolvedValue({
      data: { ...mockTemplates[0], name: 'Updated Template' }
    });
    mockedDelete.mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders template manager with header and new template button', async () => {
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Paperwork Template Manager')).toBeInTheDocument();
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });
    });

    it('loads and displays templates in grid layout', async () => {
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
        expect(screen.getByText('Work Order')).toBeInTheDocument();
      });
    });

    it('displays template cards with proper information', async () => {
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Standard service invoice template')).toBeInTheDocument();
        expect(screen.getByText('invoice')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });

    it('shows template action buttons (Edit and Delete)', async () => {
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        const deleteButtons = screen.getAllByText('Delete');
        expect(editButtons.length).toBeGreaterThan(0);
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Template Creation', () => {
    it('opens new template editor when new template button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      expect(screen.getByText('New Template')).toBeInTheDocument();
      expect(screen.getByText('Template Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('creates new template successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      // Fill form
      const textboxes = screen.getAllByRole('textbox');
      await user.type(textboxes[0], 'New Invoice Template'); // Name field
      await user.type(textboxes[1], 'Custom invoice template'); // Description field
      await user.selectOptions(screen.getByRole('combobox'), 'invoice');
      await user.type(screen.getByPlaceholderText('Enter your template content here. Use {{variable_name}} for dynamic content.'), 'Template content here');

      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockedPost).toHaveBeenCalledWith('/api/paperwork-templates/', {
          name: 'New Invoice Template',
          description: 'Custom invoice template',
          category: 'invoice',
          content: 'Template content here',
          conditional_logic: '',
          is_active: true
        });
      });
    });

    it('validates required template name field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));
      await user.click(screen.getByText('Save Template'));

      // HTML5 validation should prevent submission
      expect(mockedPost).not.toHaveBeenCalled();
    });

    it('shows loading state during template creation', async () => {
      const user = userEvent.setup();
      mockedPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));
      const textboxes = screen.getAllByRole('textbox');
      await user.type(textboxes[0], 'Test Template');
      await user.click(screen.getByText('Save Template'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Template Editing', () => {
    it('opens edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Service Invoice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Standard service invoice template')).toBeInTheDocument();
    });

    it('updates template successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Modify template
      const nameInput = screen.getByDisplayValue('Service Invoice');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Service Invoice');

      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockedPatch).toHaveBeenCalledWith('/api/paperwork-templates/1/', {
          name: 'Updated Service Invoice',
          description: 'Standard service invoice template',
          category: 'invoice',
          content: '<h1>Invoice for {{customer_name}}</h1>',
          conditional_logic: 'if total_amount > 100 then show_discount',
          is_active: true
        });
      });
    });

    it('cancels editing and returns to template list', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Template')).toBeInTheDocument();

      await user.click(screen.getByText('Cancel'));

      expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      expect(screen.queryByText('Edit Template')).not.toBeInTheDocument();
    });
  });

  describe('Template Deletion', () => {
    it('deletes template after confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm to return true
      window.confirm = jest.fn(() => true);

      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?');

      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalledWith('/api/paperwork-templates/1/');
      });
    });

    it('cancels deletion when user declines confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm to return false
      window.confirm = jest.fn(() => false);

      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?');
      expect(mockedDelete).not.toHaveBeenCalled();
    });
  });

  describe('Template Preview', () => {
    it('opens preview modal when preview button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Preview'));

      expect(screen.getByText('Template Preview')).toBeInTheDocument();
    });

    it('replaces variables with sample data in preview', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Preview'));

      // Check that variables are replaced
      await waitFor(() => {
        expect(screen.getByText('Invoice for John Smith')).toBeInTheDocument();
      });
    });

    it('closes preview modal when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      await user.click(screen.getByText('Preview'));
      expect(screen.getByText('Template Preview')).toBeInTheDocument();

      await user.click(screen.getByText('Close Preview'));
      expect(screen.queryByText('Template Preview')).not.toBeInTheDocument();
    });
  });

  describe('Variable Insertion', () => {
    it('inserts variable into content editor when variable button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Find and click a variable button
      const customerNameButton = screen.getByText('customer_name');
      await user.click(customerNameButton);

      // Check that variable was inserted
      const contentEditor = screen.getByDisplayValue(/\{\{customer_name\}\}/);
      expect(contentEditor).toBeInTheDocument();
    });

    it('inserts variable at cursor position in content editor', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Type some content first
      const contentEditor = screen.getByPlaceholderText('Enter your template content here. Use {{variable_name}} for dynamic content.');
      await user.clear(contentEditor);
      await user.type(contentEditor, 'Hello {{customer_name}}!');

      // Position cursor and insert variable
      await user.click(contentEditor);
      await user.keyboard('{arrowleft}{arrowleft}'); // Move cursor before exclamation

      const workOrderIdButton = screen.getByText('work_order_id');
      await user.click(workOrderIdButton);

      expect(contentEditor).toHaveValue('Hello {customer_name}{{work_order_id}}}!');
    });
  });

  describe('Conditional Logic', () => {
    it('displays conditional logic examples in sidebar', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Conditional Logic Examples')).toBeInTheDocument();
      expect(screen.getByText('if service_type == "maintenance" then show maintenance_checklist')).toBeInTheDocument();
    });

    it('inserts conditional logic example when add button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const addButtons = screen.getAllByText('Add');
      await user.click(addButtons[0]); // Click first Add button for maintenance example

      const logicEditor = screen.getByPlaceholderText('Define conditions for when this template should be used or how it should be modified.');
      expect(logicEditor).toHaveValue('if total_amount > 100 then show_discount\nif service_type == "maintenance" then show maintenance_checklist');
    });
  });

  describe('Form Validation', () => {
    it('validates template name is required', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      // Try to submit without name
      const textboxes = screen.getAllByRole('textbox');
      const nameInput = textboxes[0]; // First textbox is template name
      await user.clear(nameInput);

      await user.click(screen.getByText('Save Template'));

      // HTML5 validation should prevent submission
      expect(mockedPost).not.toHaveBeenCalled();
    });

    it('accepts optional description field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      const textboxes = screen.getAllByRole('textbox');
      await user.type(textboxes[0], 'Test Template'); // Name field
      // Leave description empty
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockedPost).toHaveBeenCalledWith('/api/paperwork-templates/', {
          name: 'Test Template',
          description: '',
          category: '',
          content: '',
          conditional_logic: '',
          is_active: true
        });
      });
    });

    it('handles category selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      await user.selectOptions(screen.getByRole('combobox'), 'contract');
      expect(screen.getByRole('combobox')).toHaveValue('contract');
    });
  });

  describe('API Integration', () => {
    it('loads templates on component mount', async () => {
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(mockedGet).toHaveBeenCalledWith('/api/paperwork-templates/');
      });
    });

    it('handles API loading errors gracefully', async () => {
      mockedGet.mockRejectedValue(new Error('Network error'));
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Paperwork Template Manager')).toBeInTheDocument();
      });

      // Should still render the component even with API error
      expect(screen.getByText('+ New Template')).toBeInTheDocument();
    });

    it('handles template creation API errors', async () => {
      const user = userEvent.setup();
      mockedPost.mockRejectedValue(new Error('Creation failed'));

      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));
      const textboxes = screen.getAllByRole('textbox');
      const nameInput = textboxes[0]; // First textbox is template name
      await user.type(nameInput, 'Test Template');
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockedPost).toHaveBeenCalled();
      });

      // Should remain in editor mode on error
      expect(screen.getByText('New Template')).toBeInTheDocument();
    });

    it('handles template update API errors', async () => {
      const user = userEvent.setup();
      mockedPatch.mockRejectedValue(new Error('Update failed'));

      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockedPatch).toHaveBeenCalled();
      });

      // Should remain in editor mode on error
      expect(screen.getByText('Edit Template')).toBeInTheDocument();
    });

    it('handles template deletion API errors', async () => {
      const user = userEvent.setup();
      window.confirm = jest.fn(() => true);
      mockedDelete.mockRejectedValue(new Error('Deletion failed'));

      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockedDelete).toHaveBeenCalled();
      });

      // Template should still be visible on error
      expect(screen.getByText('Service Invoice')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      await testComponentAccessibility(<PaperworkTemplateManager />);
    });

    it('has proper heading structure', async () => {
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Paperwork Template Manager');
      });
    });

    it('provides proper form labels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      expect(screen.getByText('Template Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      // Tab through form elements
      const textboxes = screen.getAllByRole('textbox');
      const nameInput = textboxes[0]; // First textbox is template name
      nameInput.focus();
      expect(nameInput).toHaveFocus();
    });

    it('provides descriptive button labels', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      expect(screen.getByRole('button', { name: 'Save Template' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('manages editor state correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      // Initially shows template list
      expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      expect(screen.queryByText('Edit Template')).not.toBeInTheDocument();

      // Open editor
      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);
      expect(screen.getByText('Edit Template')).toBeInTheDocument();

      // Close editor
      await user.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Edit Template')).not.toBeInTheDocument();
      expect(screen.getByText('Service Invoice')).toBeInTheDocument();
    });

    it('resets form when creating new template', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('+ New Template')).toBeInTheDocument();
      });

      await user.click(screen.getByText('+ New Template'));

      // Form should be empty
      const textboxes = screen.getAllByRole('textbox');
      expect(textboxes[0]).toHaveValue(''); // Name field
      expect(textboxes[1]).toHaveValue(''); // Description field
      expect(screen.getByPlaceholderText('Enter your template content here. Use {{variable_name}} for dynamic content.')).toHaveValue('');
    });

    it('populates form with existing template data when editing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<PaperworkTemplateManager />);

      await waitFor(() => {
        expect(screen.getByText('Service Invoice')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      // Form should be populated with template data
      expect(screen.getByDisplayValue('Service Invoice')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Standard service invoice template')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveValue('invoice');
    });
  });
});
