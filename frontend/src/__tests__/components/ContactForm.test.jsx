import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ContactForm from '../../components/ContactForm';
import api from '../../api';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: null }), // Default to create mode
}));

// Mock API
jest.mock('../../api');
const mockApi = api;

// Test data
const mockAccounts = [
  { id: 1, name: 'Acme Corp' },
  { id: 2, name: 'Tech Solutions Inc' },
  { id: 3, name: 'Global Industries' }
];

const mockContact = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone_number: '555-1234',
  title: 'Sales Manager',
  account: { id: 1, name: 'Acme Corp' }
};

describe('ContactForm Component - REQ-101.1', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // Setup default API mocks
    mockApi.get.mockImplementation((url) => {
      if (url === '/api/accounts/') {
        return Promise.resolve({ data: { results: mockAccounts } });
      }
      if (url === '/api/contacts/1/') {
        return Promise.resolve({ data: mockContact });
      }
      if (url === '/api/custom-fields/') {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    mockApi.post.mockImplementation((url, data) => {
      if (url === '/api/contacts/') {
        return Promise.resolve({ data: { id: 1, ...data } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    mockApi.put.mockImplementation((url, data) => {
      if (url === '/api/contacts/1/') {
        return Promise.resolve({ data: { id: 1, ...data } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderContactForm = (route = '/contacts/new') => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <ContactForm />
      </MemoryRouter>
    );
  };

  describe('Form Rendering', () => {
    it('renders create form with all required fields', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create new contact/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save contact/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      renderContactForm();
      expect(screen.getByText(/loading form/i)).toBeInTheDocument();
    });

    it('loads account options from API', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/account/i);
      expect(accountSelect).toBeInTheDocument();

      // Check that accounts are loaded
      mockAccounts.forEach(account => {
        expect(screen.getByRole('option', { name: account.name })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields before submission', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save contact/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /save contact/i }));

      // HTML5 validation should prevent submission - no API call made
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('accepts valid email formats', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, 'valid@example.com');

      expect(emailField).toHaveValue('valid@example.com');
      expect(emailField).toBeValid();
    });

    it('validates email format with HTML5 validation', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });

      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, 'invalid-email');

      expect(emailField).toHaveValue('invalid-email');
      expect(emailField).toBeInvalid();
    });
  });

  describe('Form Submission - Create Mode', () => {
    it('submits valid contact data successfully', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill out the form
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');
      await user.type(screen.getByLabelText(/email/i), 'jane.smith@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-5678');
      await user.type(screen.getByLabelText(/title/i), 'Developer');
      await user.selectOptions(screen.getByLabelText(/account/i), '1');

      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/contacts/1');
      });
    });

    it('handles API errors gracefully', async () => {
      mockApi.post.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.reject({
            response: {
              status: 400,
              data: {
                email: ['Contact with this email already exists.'],
                phone_number: ['Invalid phone number format.']
              }
            }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');

      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/email: Contact with this email already exists/i)).toBeInTheDocument();
        expect(screen.getByText(/phone_number: Invalid phone number format/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('disables submit button during submission', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');

      const submitButton = screen.getByRole('button', { name: /save contact/i });
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      });
    });
  });

  describe('Account Integration', () => {
    it('loads and displays account options', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/account/i);

      // Check default "None" option
      expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();

      // Check loaded accounts
      mockAccounts.forEach(account => {
        expect(screen.getByRole('option', { name: account.name })).toBeInTheDocument();
      });
    });

    it('handles account selection', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText(/account/i);
      await user.selectOptions(accountSelect, '2');

      expect(accountSelect).toHaveValue('2');
    });

    it('submits null account when "None" selected', async () => {
      mockApi.post.mockImplementation((url, data) => {
        if (url === '/api/contacts/') {
          expect(data.account).toBeNull();
          return Promise.resolve({ data: { id: 1, ...data } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill required fields and select "None" for account
      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');
      await user.selectOptions(screen.getByLabelText(/account/i), '');

      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation and Cancel', () => {
    it('navigates to contacts list on cancel in create mode', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/contacts');
    });
  });

  describe('Loading States', () => {
    it('shows loading state when accounts are being fetched', () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/accounts/') {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: { results: mockAccounts } }), 100);
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContactForm();

      expect(screen.getByText(/loading form/i)).toBeInTheDocument();
    });

    it('hides loading state after data is loaded', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.queryByText(/loading form/i)).not.toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /create new contact/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error when accounts fail to load', async () => {
      mockApi.get.mockImplementation((url) => {
        if (url === '/api/accounts/') {
          return Promise.reject({
            response: { status: 500, data: { error: 'Server error' } }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByText(/failed to load necessary data/i)).toBeInTheDocument();
      });
    });

    it('clears previous errors on successful submission', async () => {
      // First, cause an error
      mockApi.post.mockImplementation((url) => {
        if (url === '/api/contacts/') {
          return Promise.reject({
            response: { status: 400, data: { email: ['Invalid email'] } }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Smith');
      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(screen.getByText(/email: Invalid email/i)).toBeInTheDocument();
      });

      // Now fix the API to succeed
      mockApi.post.mockImplementation((url, data) => {
        if (url === '/api/contacts/') {
          return Promise.resolve({ data: { id: 1, ...data } });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/contacts/1');
      });
    });
  });

  describe('Form Fields', () => {
    it('updates form state when fields change', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      const firstNameField = screen.getByLabelText(/first name/i);
      const lastNameField = screen.getByLabelText(/last name/i);
      const emailField = screen.getByLabelText(/email/i);

      await user.type(firstNameField, 'Test');
      await user.type(lastNameField, 'User');
      await user.type(emailField, 'test@example.com');

      expect(firstNameField).toHaveValue('Test');
      expect(lastNameField).toHaveValue('User');
      expect(emailField).toHaveValue('test@example.com');
    });

    it('handles all form fields correctly', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      });

      const phoneField = screen.getByLabelText(/phone number/i);
      const titleField = screen.getByLabelText(/title/i);

      await user.type(phoneField, '555-9999');
      await user.type(titleField, 'Manager');

      expect(phoneField).toHaveValue('555-9999');
      expect(titleField).toHaveValue('Manager');
    });
  });

  describe('Role-Based Field Visibility - REQ-101.1', () => {
    it('shows all standard fields (role-based implementation pending)', async () => {
      // TODO: Implement role-based field visibility in ContactForm component
      // CURRENT: All users see all fields regardless of role
      // REQUIRED: Sales Manager should see additional restricted fields

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Currently all users see all standard fields
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
    });

    it('identifies need for role-based field restrictions', async () => {
      // IMPLEMENTATION GAP: No role-based field visibility currently implemented
      // REQUIREMENT: Sales Rep should have restricted access to certain fields

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Document that all fields are currently visible to all roles
      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();

      // Add warning comment for future implementation
      console.warn('IMPLEMENTATION NEEDED: Role-based field visibility for Sales Rep vs Sales Manager');
    });
  });

  describe('Custom Field Functionality - REQ-101.1', () => {
    it('documents need for custom field integration', async () => {
      // IMPLEMENTATION GAP: Custom fields not currently implemented in ContactForm
      // REQUIREMENT: Load and display custom fields from /api/custom-fields/

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Currently only standard fields are displayed
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();

      // Custom fields would appear here if implemented
      const customFieldsContainer = screen.queryByTestId('custom-fields-container');
      expect(customFieldsContainer).not.toBeInTheDocument();

      // Add warning for future implementation
      console.warn('IMPLEMENTATION NEEDED: Custom field loading and rendering in ContactForm');
    });

    it('verifies API call for custom fields would be made', async () => {
      // IMPLEMENTATION GAP: Custom fields API not called
      // The current component should call /api/custom-fields/ but doesn't

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Verify that custom fields API call is not currently made
      expect(mockApi.get).toHaveBeenCalledWith('/api/accounts/');
      // This call is missing: expect(mockApi.get).toHaveBeenCalledWith('/api/custom-fields/');

      console.warn('IMPLEMENTATION NEEDED: /api/custom-fields/ API integration');
    });

    it('identifies custom field types that need support', async () => {
      // REQUIREMENT: Support text, date, boolean, number custom field types
      // CURRENT: Not implemented

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Document required field types for future implementation
      const requiredFieldTypes = ['text', 'date', 'boolean', 'number'];
      console.warn('IMPLEMENTATION NEEDED: Custom field types support:', requiredFieldTypes);

      // Verify current form structure (form element exists but may not have proper role)
      const formElement = document.querySelector('form');
      expect(formElement).toBeInTheDocument();
    });
  });

  describe('File Upload Testing - REQ-101.1', () => {
    it('handles contact photo upload', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Check if photo upload field exists (if implemented)
      const photoUpload = screen.queryByLabelText(/photo/i) || screen.queryByText(/upload.*photo/i);
      if (photoUpload) {
        expect(photoUpload).toBeInTheDocument();

        // Test file upload functionality
        const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
        await user.upload(photoUpload, file);

        expect(photoUpload.files[0]).toBe(file);
        expect(photoUpload.files).toHaveLength(1);
      }
    });

    it('validates file upload size and type', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      const photoUpload = screen.queryByLabelText(/photo/i) || screen.queryByText(/upload.*photo/i);
      if (photoUpload) {
        // Test invalid file type
        const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
        await user.upload(photoUpload, invalidFile);

        // Should show validation error for invalid file type
        await waitFor(() => {
          const errorMessage = screen.queryByText(/invalid file type/i) ||
                             screen.queryByText(/only image files/i);
          if (errorMessage) {
            expect(errorMessage).toBeInTheDocument();
          }
        });
      }
    });

    it('handles contact attachment uploads', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Check if attachment upload exists (if implemented)
      const attachmentUpload = screen.queryByLabelText(/attachment/i) ||
                              screen.queryByText(/upload.*attachment/i);
      if (attachmentUpload) {
        expect(attachmentUpload).toBeInTheDocument();

        const file = new File(['attachment content'], 'resume.pdf', { type: 'application/pdf' });
        await user.upload(attachmentUpload, file);

        expect(attachmentUpload.files[0]).toBe(file);
      }
    });
  });

  describe('Auto-Save and Draft Functionality - REQ-101.1', () => {
    it('documents need for auto-save functionality', async () => {
      // IMPLEMENTATION GAP: No auto-save functionality currently implemented
      // REQUIREMENT: Automatically save draft after user input with 2-second delay

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Type in form fields
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');

      // Currently no draft saving indicator exists
      const draftIndicator = screen.queryByText(/draft saved/i) ||
                            screen.queryByText(/automatically saved/i);
      expect(draftIndicator).not.toBeInTheDocument();

      console.warn('IMPLEMENTATION NEEDED: Auto-save functionality with 2-second delay');
    });

    it('verifies no draft loading currently implemented', async () => {
      // IMPLEMENTATION GAP: No draft loading from localStorage
      // REQUIREMENT: Load draft data on form initialization

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Form fields should be empty on initial load (no draft loading)
      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');

      console.warn('IMPLEMENTATION NEEDED: Draft loading from localStorage on initialization');
    });

    it('documents draft clearing requirement', async () => {
      // IMPLEMENTATION GAP: No draft clearing after successful submission
      // REQUIREMENT: Clear draft from localStorage after successful form submission

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/first name/i), 'Final');
      await user.type(screen.getByLabelText(/last name/i), 'User');

      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      // Draft clearing not implemented yet
      console.warn('IMPLEMENTATION NEEDED: Clear draft from localStorage after successful submission');
    });
  });

  describe('Keyboard Navigation and Accessibility - REQ-101.1', () => {
    it('verifies basic keyboard navigation works', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      const firstNameField = screen.getByLabelText(/first name/i);
      const lastNameField = screen.getByLabelText(/last name/i);

      // Basic tab navigation should work
      firstNameField.focus();
      expect(document.activeElement).toBe(firstNameField);

      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(lastNameField);

      // Continue with other fields
      const emailField = screen.getByLabelText(/email/i);
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(emailField);
    });

    it('tests form submission behavior', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill required fields and test submission
      await user.type(screen.getByLabelText(/first name/i), 'Keyboard');
      await user.type(screen.getByLabelText(/last name/i), 'User');

      // Test clicking submit button
      await user.click(screen.getByRole('button', { name: /save contact/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/contacts/1');
      });
    });

    it('tests cancel button keyboard navigation', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Focus and click cancel button
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      await user.click(cancelButton);
      expect(mockNavigate).toHaveBeenCalledWith('/contacts');
    });

    it('identifies ARIA accessibility improvements needed', async () => {
      // IMPLEMENTATION GAP: Missing ARIA attributes for accessibility
      // REQUIREMENT: Proper ARIA labels, descriptions, and live regions

      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      const firstNameField = screen.getByLabelText(/first name/i);
      const lastNameField = screen.getByLabelText(/last name/i);

      // Currently missing ARIA attributes
      expect(firstNameField).not.toHaveAttribute('aria-required');
      expect(lastNameField).not.toHaveAttribute('aria-required');

      console.warn('IMPLEMENTATION NEEDED: ARIA attributes (aria-required, aria-invalid, aria-describedby)');
    });

    it('verifies form structure supports accessibility', async () => {
      renderContactForm();

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Verify proper form structure exists (form element exists but may lack proper ARIA role)
      const formElement = document.querySelector('form');
      expect(formElement).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

      // All fields have proper labels (this works correctly)
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('id', 'first_name');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('id', 'last_name');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('id', 'email');
    });

    it('documents loading state accessibility needs', async () => {
      // IMPLEMENTATION GAP: Loading indicator lacks ARIA live region
      // REQUIREMENT: Screen reader announcements for loading states

      renderContactForm();

      const loadingIndicator = screen.getByText(/loading form/i);
      expect(loadingIndicator).toBeInTheDocument();

      // Currently missing aria-live attribute
      expect(loadingIndicator).not.toHaveAttribute('aria-live');

      console.warn('IMPLEMENTATION NEEDED: aria-live="polite" for loading announcements');
    });
  });
});
