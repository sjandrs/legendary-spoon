
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor } from '@testing-library/react';
import * as api from '../../api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AccountForm from '../../components/AccountForm';

jest.mock('../../api');

/**
 * Fetch invocation tests for AccountForm (HR-001)
 */

describe('AccountForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('does not fetch account data in create mode', async () => {
    api.get.mockResolvedValue({ data: {} });

    renderWithProviders(
      <MemoryRouter initialEntries={[ '/accounts/new' ]}>
        <Routes>
          <Route path="/accounts/new" element={<AccountForm />} />
        </Routes>
      </MemoryRouter>
    );

    // Minimal interaction just to ensure render completes
    expect(screen.getByText(/new account/i)).toBeInTheDocument();
    // Allow any microtasks
    await waitFor(() => {});
    // Should not call get with account detail endpoint
    expect(api.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/accounts\/.+\//));
  });

  it('fetches account data exactly once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/accounts/123/') return Promise.resolve({ data: { id: 123, name: 'Acme' } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <MemoryRouter initialEntries={[ '/accounts/123/edit' ]}>
        <Routes>
          <Route path="/accounts/:id/edit" element={<AccountForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/123/'));
    // Ensure only one fetch to the detail endpoint
    expect(api.get.mock.calls.filter(c => c[0] === '/api/accounts/123/')).toHaveLength(1);
  });
});
