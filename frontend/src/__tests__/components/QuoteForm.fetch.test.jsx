
import { Route, Routes } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import QuoteForm from '../../components/QuoteForm';

jest.mock('../../api');

describe('QuoteForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches accounts list on mount (create mode) but not quote detail', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/accounts/') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/quotes/new" element={<QuoteForm />} />
      </Routes>,
      { initialEntries: ['/quotes/new'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/'));
    expect(api.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/quotes\/\d+\//));
  });

  it('fetches accounts list then quote detail once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/accounts/') return Promise.resolve({ data: [] });
      if (url === '/api/quotes/55/') return Promise.resolve({ data: { id: 55, name: 'Quote 55' } });
      if (url === '/api/quotes/55/items/') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    renderWithProviders(
      <Routes>
        <Route path="/quotes/:id/edit" element={<QuoteForm />} />
      </Routes>,
      { initialEntries: ['/quotes/55/edit'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/'));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/quotes/55/'));
    // Assert single detail fetch
    expect(api.get.mock.calls.filter(c => c[0] === '/api/quotes/55/')).toHaveLength(1);
  });

  it('fetches contacts when account field changes (create mode)', async () => {
    const calls = [];
  api.get.mockImplementation((url) => {
      calls.push(url);
      if (url === '/api/accounts/') return Promise.resolve({ data: [{ id: 1, name: 'A' }] });
      if (url.startsWith('/api/contacts/')) return Promise.resolve({ data: { results: [] } });
      return Promise.resolve({ data: {} });
    });

    const { getByLabelText } = renderWithProviders(
      <Routes>
        <Route path="/quotes/new" element={<QuoteForm />} />
      </Routes>,
      { initialEntries: ['/quotes/new'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/'));
  const accountSelect = getByLabelText(/account/i);
  // simulate selecting account id 1 using userEvent for proper act wrapping
  await userEvent.selectOptions(accountSelect, '1');

    await waitFor(() => {
      const contactFetches = api.get.mock.calls.filter(c => c[0].startsWith('/api/contacts/'));
      expect(contactFetches).toHaveLength(1);
    });
    // Ensure accounts list not refetched
    expect(api.get.mock.calls.filter(c => c[0] === '/api/accounts/')).toHaveLength(1);
  });
});
