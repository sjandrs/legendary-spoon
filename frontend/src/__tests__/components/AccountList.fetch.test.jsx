
import { renderWithProviders } from '../helpers/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '../../api';
import AccountList from '../../components/AccountList';

jest.mock('../../api');

describe('AccountList fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  const mockList = (results = [], count) => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/api/accounts/')) {
        return Promise.resolve({ data: { results, count: count ?? results.length } });
      }
      return Promise.resolve({ data: {} });
    });
  };

  it('performs single initial list fetch', async () => {
    mockList([]);
    renderWithProviders(<AccountList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });

  it('triggers a single fetch when search submitted', async () => {
    mockList([]);
    const user = userEvent.setup();
    renderWithProviders(<AccountList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();

    const input = screen.getByPlaceholderText(/search accounts/i);
    await user.type(input, 'Acme');
    await user.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => expect(api.get).toHaveBeenCalled());
  });

  it('fetches once when page changes', async () => {
    mockList(new Array(25).fill(0).map((_, i) => ({ id: i + 1, name: `Acct ${i+1}` })), 40);
    const user = userEvent.setup();
    renderWithProviders(<AccountList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();
    // Wait for pagination to appear (loading skeleton has cleared and buttons rendered)
    const nextBtn = await screen.findByRole('button', { name: /next/i });
    await user.click(nextBtn);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });
});
