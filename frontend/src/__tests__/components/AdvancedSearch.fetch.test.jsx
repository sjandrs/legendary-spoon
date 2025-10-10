
import { renderWithProviders } from '../helpers/test-utils';
import { screen, waitFor } from '@testing-library/react';
import * as api from '../../api';
import AdvancedSearch from '../../components/AdvancedSearch';

jest.mock('../../api');

/**
 * AdvancedSearch fetch behavior tests
 * Ensures: single filter load on non-global type change; search triggered by Search button and param change.
 */

describe('AdvancedSearch fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  const setup = (onSearch = jest.fn()) => {
    return renderWithProviders(<AdvancedSearch onSearch={onSearch} />);
  };

  it('loads filters exactly once when switching from global to accounts then searches on button click', async () => {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/api/search/filters/')) {
        return Promise.resolve({ data: { accounts: { text_filters: [], choice_filters: {}, date_filters: [], number_filters: [] } } });
      }
      if (url.startsWith('/api/search/suggestions/')) {
        return Promise.resolve({ data: { suggestions: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    const onSearch = jest.fn().mockResolvedValue(undefined);
    setup(onSearch);

    // Change type to accounts to trigger filters load
    const typeSelect = screen.getByLabelText(/search type selector/i);
    await waitFor(() => expect(typeSelect).toBeInTheDocument());
    typeSelect.value = 'accounts';
    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/api/search/filters/?entity_type=accounts')));
    const filterCalls = api.get.mock.calls.filter(c => c[0].includes('/api/search/filters/'));
    expect(filterCalls).toHaveLength(1);

    // Trigger a manual search
  const searchButton = screen.getByRole('button', { name: /^search$/i });
    searchButton.click();

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));
  });

  it('re-runs search when sort order changes (no extra filter fetch)', async () => {
    api.get.mockResolvedValue({ data: { accounts: { text_filters: [], choice_filters: {}, date_filters: [], number_filters: [] } } });
    const onSearch = jest.fn().mockResolvedValue(undefined);
    setup(onSearch);

    const typeSelect = screen.getByLabelText(/search type selector/i);
    typeSelect.value = 'accounts';
    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(0)); // initial does not auto search on type alone

    // Perform first explicit search
  screen.getByRole('button', { name: /^search$/i }).click();
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));

    // Change sort order and trigger another search
    const orderSelect = screen.getByDisplayValue('Descending');
    orderSelect.value = 'asc';
    orderSelect.dispatchEvent(new Event('change', { bubbles: true }));
  screen.getByRole('button', { name: /^search$/i }).click();

    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(2));

    // Ensure still only one filter fetch
    const filterCalls = api.get.mock.calls.filter(c => c[0].includes('/api/search/filters/'));
    expect(filterCalls).toHaveLength(1);
  });
});
