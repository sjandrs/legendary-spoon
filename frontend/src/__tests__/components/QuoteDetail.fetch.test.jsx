
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor } from '@testing-library/react';
import * as api from '../../api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import QuoteDetail from '../../components/QuoteDetail';

jest.mock('../../api');

/**
 * Fetch invocation tests for QuoteDetail (Batch 2) - always fetches by id
 */

describe('QuoteDetail fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches quote (and items) once on mount', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/quotes/999/') return Promise.resolve({ data: { id: 999, name: 'Sample Quote' } });
      if (url === '/api/quotes/999/items/') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/quotes/999']}>
        <Routes>
          <Route path="/quotes/:id" element={<QuoteDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/quotes/999/'));
    const detailCalls = api.get.mock.calls.filter(c => c[0] === '/api/quotes/999/');
    expect(detailCalls).toHaveLength(1);
    const itemsCalls = api.get.mock.calls.filter(c => c[0] === '/api/quotes/999/items/');
    expect(itemsCalls).toHaveLength(1);
  });
});
