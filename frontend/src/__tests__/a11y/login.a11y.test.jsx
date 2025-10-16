import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import LoginPage from '../../components/LoginPage.jsx';

// Minimal mock for useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ login: jest.fn().mockResolvedValue(true) })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('LoginPage accessibility', () => {
  test('has no detectable a11y violations', async () => {
    const { container } = render(<LoginPage />);

    // basic smoke assertions for labels
    expect(screen.getByText(/login/i)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
