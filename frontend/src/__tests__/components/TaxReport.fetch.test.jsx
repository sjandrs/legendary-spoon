
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import TaxReport from '../../components/TaxReport';

jest.mock('../../api');

describe('TaxReport fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockTax(year) {
    api.get.mockImplementation((url) => {
      if (url.includes('/api/tax-report/')) return Promise.resolve({ data: { contractorPayments: [], salesTax: { total_sales:0, tax_collected:0, tax_rate:0.07 }, expensesByCategory: [], totalExpenses:0, totalRevenue:0, netIncome:0, estimatedTax:0 } });
      return Promise.resolve({ data: {} });
    });
  }

  it('fetches once on mount and once when year changes', async () => {
    mockTax();
  const { getByLabelText, findByLabelText } = renderWithProviders(<TaxReport />);
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    api.get.mockClear();

  const yearSelect = await findByLabelText(/tax year/i);
    // Simulate changing year
    yearSelect.value = String(new Date().getFullYear() - 1);
    yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
  });
});
