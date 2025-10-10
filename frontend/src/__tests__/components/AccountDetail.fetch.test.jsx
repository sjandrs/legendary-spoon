
import { Routes, Route } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import AccountDetail from '../../components/AccountDetail';

jest.mock('../../api');

describe('AccountDetail fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockDetail(id) {
    api.get.mockImplementation((url) => {
      if (url === `/api/accounts/${id}/`) return Promise.resolve({ data: { id, name: `Account ${id}` } });
      if (url.startsWith('/api/contacts/')) return Promise.resolve({ data: { results: [] } });
      if (url.startsWith('/api/deals/')) return Promise.resolve({ data: { results: [] } });
      return Promise.resolve({ data: {} });
    });
  }

  it('loads triple datasets once for a given id', async () => {
    mockDetail(10);
    renderWithProviders(
      <Routes>
        <Route path="/accounts/:id" element={<AccountDetail />} />
      </Routes>,
      { initialEntries: ['/accounts/10'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/10/'));
    const contactsCalls = api.get.mock.calls.filter(c => c[0].startsWith('/api/contacts/?account=10'));
    const dealsCalls = api.get.mock.calls.filter(c => c[0].startsWith('/api/deals/?account=10'));
    expect(contactsCalls).toHaveLength(1);
    expect(dealsCalls).toHaveLength(1);
  });

  it('re-fetches all datasets when id param changes', async () => {
    mockDetail(11);
    const { unmount } = renderWithProviders(
      <Routes>
        <Route path="/accounts/:id" element={<AccountDetail />} />
      </Routes>,
      { initialEntries: ['/accounts/11'] }
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/11/'));

    // Unmount and mount fresh with new route to simulate navigation
    unmount();
    jest.clearAllMocks();
    mockDetail(12);
    renderWithProviders(
      <Routes>
        <Route path="/accounts/:id" element={<AccountDetail />} />
      </Routes>,
      { initialEntries: ['/accounts/12'] }
    );
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/accounts/12/'));
    const detailCalls = api.get.mock.calls.filter(c => c[0] === '/api/accounts/12/');
    expect(detailCalls).toHaveLength(1);
  });
});
