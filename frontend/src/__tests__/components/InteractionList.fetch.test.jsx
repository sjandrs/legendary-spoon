
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor, screen } from '@testing-library/react';
import * as api from '../../api';
import InteractionList from '../../components/InteractionList';

jest.mock('../../api');

describe('InteractionList fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockList(results = [], count) {
    api.get.mockImplementation(url => {
      if (url.startsWith('/api/interactions/')) {
        return Promise.resolve({ data: { results, count: count ?? results.length } });
      }
      return Promise.resolve({ data: {} });
    });
  }

  it('fetches once on mount', async () => {
    mockList([]);
    renderWithProviders(<InteractionList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });

  it('fetches once when page changes', async () => {
    mockList(new Array(25).fill(0).map((_, i) => ({ id: i + 1 })), 40);
    renderWithProviders(<InteractionList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();
    const nextBtn = await screen.findByRole('button', { name: /next/i });
    nextBtn.click();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });
});
