
import { waitFor, screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import QuoteList from '../../components/QuoteList';

jest.mock('../../api');

describe('QuoteList fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockQuotes(results = [], count) {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/api/quotes/')) {
        return Promise.resolve({ data: { results, count: count ?? results.length } });
      }
      return Promise.resolve({ data: {} });
    });
  }

  it('fetches once on mount', async () => {
    mockQuotes([]);
    renderWithProviders(<QuoteList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });

  it('fetches once when search submitted', async () => {
    mockQuotes([]);
    renderWithProviders(<QuoteList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();
    const input = screen.getByPlaceholderText(/search quotes/i);
    input.value = 'Proposal';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const btn = screen.getByRole('button', { name: /search/i });
    btn.click();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });

  it('fetches once when page changes', async () => {
    mockQuotes(new Array(25).fill(0).map((_, i) => ({ id: i+1, name: `Quote ${i+1}` })), 40);
    renderWithProviders(<QuoteList />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();
    const nextBtn = await screen.findByRole('button', { name: /next/i });
    nextBtn.click();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });
});
