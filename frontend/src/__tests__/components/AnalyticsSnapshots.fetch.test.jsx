
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor } from '@testing-library/react';
import * as api from '../../api';
import AnalyticsSnapshots from '../../components/AnalyticsSnapshots';

jest.mock('../../api');

describe('AnalyticsSnapshots fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches once on mount and once when dateRange changes', async () => {
    api.get.mockResolvedValue({ data: [] });
    const { getByLabelText } = renderWithProviders(<AnalyticsSnapshots />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();
    const range = getByLabelText(/time period/i);
    range.value = '90';
    range.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });
});
