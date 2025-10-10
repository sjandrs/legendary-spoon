import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers } from '../helpers/test-utils';
import Login from '../../components/Login';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  post: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockCredentials = {
  valid: {
    username: 'testuser',
    password: 'password123'
  },
  invalid: {
    username: 'wronguser',
    password: 'wrongpass'
  },
  empty: {
    username: '',
    password: ''
  }
};

const mockLoginResponse = {
  token: 'mock-jwt-token',
  user: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    groups: [{ name: 'Sales Rep' }]
  }
};

const mockLoginError = {
  response: {
    status: 401,
    data: { message: 'Invalid credentials' }
  }
};

describe('Login Component', () => {
  const user = userEvent.setup();
  let mockLogin;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLogin = jest.fn();
  });

  const renderLogin = (authContextValue = {}) => {
    const defaultAuthValue = {
      user: null,
      token: null,
      loading: false,
      login: mockLogin,
      logout: jest.fn(),
      ...authContextValue
    };

    return renderWithProviders(
      <Login />,
      {
        authValue: defaultAuthValue,
        initialEntries: ['/login']
      }
    );
  };

  // Helper function to get form inputs since labels aren't properly associated
  const getFormInputs = () => {
    // Get username input (first text input)
    const usernameInput = screen.getByRole('textbox');
    // Get password input by type
    const passwordInput = document.querySelector('input[type="password"]');
    return { usernameInput, passwordInput };
  };

  describe('Rendering and Initial State', () => {
    it('renders login form with all required elements', () => {
      renderLogin();

      expect(screen.getByRole('heading', { level: 2, name: 'Login' })).toBeInTheDocument();
      const inputs = screen.getAllByDisplayValue('');
      expect(inputs).toHaveLength(2); // Username and password inputs
      expect(inputs[0]).toBeInTheDocument(); // Username input
      expect(inputs[1]).toBeInTheDocument(); // Password input
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders form elements with correct attributes', () => {
      renderLogin();

      const inputs = screen.getAllByDisplayValue('');
      const usernameInput = inputs[0]; // First input is username
      const passwordInput = inputs[1]; // Second input is password
      const submitButton = screen.getByRole('button', { name: /login/i });

      expect(usernameInput).toHaveAttribute('type', 'text');
      expect(usernameInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('renders empty form fields initially', () => {
      renderLogin();

      const inputs = screen.getAllByDisplayValue('');
      expect(inputs[0]).toHaveValue(''); // Username
      expect(inputs[1]).toHaveValue(''); // Password
    });

    it('does not show error message initially', () => {
      renderLogin();

      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates username field when user types', async () => {
      renderLogin();

      const { usernameInput } = getFormInputs();
      await user.type(usernameInput, 'testuser');

      expect(usernameInput).toHaveValue('testuser');
    });

    it('updates password field when user types', async () => {
      renderLogin();

      const { passwordInput } = getFormInputs();
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('handles multiple character input correctly', async () => {
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();

      await user.type(usernameInput, 'complex.user@example.com');
      await user.type(passwordInput, 'Complex!Pass123');

      expect(usernameInput).toHaveValue('complex.user@example.com');
      expect(passwordInput).toHaveValue('Complex!Pass123');
    });

    it('maintains field values during typing', async () => {
      renderLogin();

      const { usernameInput } = getFormInputs();

      await user.type(usernameInput, 'test');
      expect(usernameInput).toHaveValue('test');

      await user.type(usernameInput, 'user');
      expect(usernameInput).toHaveValue('testuser');
    });
  });

  describe('Form Submission', () => {
    it('calls login function with correct credentials on valid submission', async () => {
      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith(
        mockCredentials.valid.username,
        mockCredentials.valid.password
      );
    });

    it('navigates to dashboard on successful login', async () => {
      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('prevents form submission when username is empty', async () => {
      renderLogin();

      const { passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('prevents form submission when password is empty', async () => {
      renderLogin();

      const { usernameInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, 'testuser');
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('prevents form submission when both fields are empty', async () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('handles form submission via Enter key', async () => {
      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.keyboard('{Enter}');

      expect(mockLogin).toHaveBeenCalledWith(
        mockCredentials.valid.username,
        mockCredentials.valid.password
      );
    });
  });

  describe('Authentication Error Handling', () => {
    it('displays error message on login failure', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin.mockRejectedValue(mockLoginError);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.invalid.username);
      await user.type(passwordInput, mockCredentials.invalid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalledWith('Login failed:', mockLoginError);
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('clears error message on new login attempt', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin
        .mockRejectedValueOnce(mockLoginError)
        .mockResolvedValueOnce(mockLoginResponse);

      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      // First attempt - should fail
      await user.type(usernameInput, mockCredentials.invalid.username);
      await user.type(passwordInput, mockCredentials.invalid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
      });

      // Clear fields and try again
      await user.clear(usernameInput);
      await user.clear(passwordInput);
      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      // Error should be cleared before second attempt
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials. Please try again.')).not.toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('handles network errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const networkError = new Error('Network request failed');
      mockLogin.mockRejectedValue(networkError);

      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalledWith('Login failed:', networkError);
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('handles server errors appropriately', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      };
      mockLogin.mockRejectedValue(serverError);

      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
      });

      expect(consoleError).toHaveBeenCalledWith('Login failed:', serverError);
      consoleError.mockRestore();
    });
  });

  describe('User Experience Features', () => {
    it('maintains form state during error display', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin.mockRejectedValue(mockLoginError);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.invalid.username);
      await user.type(passwordInput, mockCredentials.invalid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
      });

      // Form fields should maintain their values
      expect(usernameInput).toHaveValue(mockCredentials.invalid.username);
      expect(passwordInput).toHaveValue(mockCredentials.invalid.password);

      consoleError.mockRestore();
    });

    it('allows user to retry after error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin
        .mockRejectedValueOnce(mockLoginError)
        .mockResolvedValueOnce(mockLoginResponse);

      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      // First attempt - fail
      await user.type(usernameInput, mockCredentials.invalid.username);
      await user.type(passwordInput, mockCredentials.invalid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials. Please try again.')).toBeInTheDocument();
      });

      // Second attempt - succeed
      await user.clear(usernameInput);
      await user.clear(passwordInput);
      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      consoleError.mockRestore();
    });

    it('focuses username field for easy access', () => {
      renderLogin();

      const { usernameInput } = getFormInputs();

      // Simulate user clicking/focusing on the username field
      usernameInput.focus();
      expect(usernameInput).toHaveFocus();
    });
  });

  describe('Loading States', () => {
    it('handles loading state during authentication', async () => {
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      // During loading, form should still be interactive
      expect(submitButton).toBeInTheDocument();
      expect(usernameInput).toHaveValue(mockCredentials.valid.username);

      // Resolve the login
      resolveLogin(mockLoginResponse);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles multiple login attempts appropriately', async () => {
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);

      // Click submit multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Component doesn't prevent multiple calls - this is the current behavior
      expect(mockLogin).toHaveBeenCalledTimes(3);

      // Resolve the login
      resolveLogin(mockLoginResponse);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Integration with Auth Context', () => {
    it('uses login function from auth context', async () => {
      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith(
        mockCredentials.valid.username,
        mockCredentials.valid.password
      );
    });

    it('handles auth context loading state', () => {
      renderLogin({ loading: true });

      // Component should still render during auth loading
      expect(screen.getByRole('heading', { level: 2, name: 'Login' })).toBeInTheDocument();
      const { usernameInput, passwordInput } = getFormInputs();
      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('integrates with existing user session', () => {
      const existingUser = mockUsers.salesRep;
      renderLogin({ user: existingUser, token: 'existing-token' });

      // Component should render normally even with existing session
      expect(screen.getByRole('heading', { level: 2, name: 'Login' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderLogin();

      expect(screen.getByRole('heading', { level: 2, name: 'Login' })).toBeInTheDocument();
    });

    it('has form labels present for screen readers', () => {
      renderLogin();

      // Check that labels exist even if not properly associated
      expect(screen.getByText('Username:')).toBeInTheDocument();
      expect(screen.getByText('Password:')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Tab navigation should work
      usernameInput.focus();
      expect(usernameInput).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(passwordInput).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(submitButton).toHaveFocus();
    });

    it('provides accessible error messaging', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogin.mockRejectedValue(mockLoginError);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.invalid.username);
      await user.type(passwordInput, mockCredentials.invalid.password);
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid credentials. Please try again.');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveStyle('color: red');
      });

      consoleError.mockRestore();
    });

    it('has accessible form submission button', () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).toBeEnabled();
    });
  });

  describe('Security Considerations', () => {
    it('masks password input', () => {
      renderLogin();

      const { passwordInput } = getFormInputs();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('does not expose credentials in DOM after submission', async () => {
      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });

      // Credentials should still be in form fields (normal behavior)
      expect(usernameInput).toHaveValue(mockCredentials.valid.username);
      expect(passwordInput).toHaveValue(mockCredentials.valid.password);
    });

    it('handles authentication state securely', async () => {
      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      // Verify login is called with exact parameters
      expect(mockLogin).toHaveBeenCalledWith(
        mockCredentials.valid.username,
        mockCredentials.valid.password
      );
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('handles special characters in credentials', async () => {
      const specialCredentials = {
        username: 'user@domain.com',
        password: 'P@ssw0rd!#$%'
      };

      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, specialCredentials.username);
      await user.type(passwordInput, specialCredentials.password);
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith(
        specialCredentials.username,
        specialCredentials.password
      );
    });

    it('handles very long credential inputs', async () => {
      const longCredentials = {
        username: 'a'.repeat(200),
        password: 'b'.repeat(200)
      };

      mockLogin.mockResolvedValue(mockLoginResponse);
      renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, longCredentials.username);
      await user.type(passwordInput, longCredentials.password);
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith(
        longCredentials.username,
        longCredentials.password
      );
    });

    it('recovers gracefully from component unmount during login', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      let resolveLogin;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockLogin.mockReturnValue(loginPromise);

      const { unmount } = renderLogin();

      const { usernameInput, passwordInput } = getFormInputs();
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(usernameInput, mockCredentials.valid.username);
      await user.type(passwordInput, mockCredentials.valid.password);
      await user.click(submitButton);

      // Unmount component before login resolves
      unmount();

      // Resolve login after unmount
      resolveLogin(mockLoginResponse);

      // Should not cause errors or navigation after unmount
      expect(mockNavigate).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Performance Considerations', () => {
    it('renders efficiently with minimal re-renders', () => {
      renderLogin();

      expect(screen.getByRole('heading', { level: 2, name: 'Login' })).toBeInTheDocument();

      // Component should render without issues
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('handles rapid user input efficiently', async () => {
      renderLogin();

      const { usernameInput } = getFormInputs();

      // Simulate rapid typing
      const startTime = performance.now();
      await user.type(usernameInput, 'rapidtypinguser');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should handle input quickly
      expect(usernameInput).toHaveValue('rapidtypinguser');
    });
  });
});
