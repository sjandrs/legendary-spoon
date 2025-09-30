import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Mock the API module
jest.mock('./api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthProvider>
  );
};

describe('App', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
    // Basic smoke test - app renders without throwing
    expect(document.body).toBeInTheDocument();
  });

  test('renders navigation elements', () => {
    renderWithProviders(<App />);
    // Check for common navigation elements that should be present
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/Deals/i)).toBeInTheDocument();
  });
});
