
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import RevenueForecast from '../../components/RevenueForecast';

jest.mock('../../api');

describe('RevenueForecast fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockForecast() {
    api.get.mockImplementation(() => Promise.resolve({ data: { forecast: [], historical: [], average_growth_rate: 0 } }));
  }

  it('fetches once on mount and once when months changes', async () => {
    mockForecast();
    const { getByLabelText } = renderWithProviders(<RevenueForecast />);
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();

    const monthsSelect = getByLabelText(/forecast period/i);
    monthsSelect.value = '12';
    monthsSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });
});
