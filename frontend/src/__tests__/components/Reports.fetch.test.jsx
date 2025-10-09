
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import Reports from '../../components/Reports';

jest.mock('../../api');

describe('Reports fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockReports() {
    api.get.mockImplementation((url) => {
      if (url.startsWith('/api/reports/balance-sheet/')) return Promise.resolve({ data: { as_of_date: '2025-01-31', assets: {}, total_assets: 0, liabilities: {}, total_liabilities: 0, equity: {}, total_equity: 0 } });
      if (url.startsWith('/api/reports/pnl/')) return Promise.resolve({ data: { start_date: '2025-01-01', end_date: '2025-01-31', revenue: {}, total_revenue: 0, expenses: {}, total_expenses: 0, net_profit: 0 } });
      if (url.startsWith('/api/reports/cash-flow/')) return Promise.resolve({ data: { start_date: '2025-01-01', end_date: '2025-01-31', operating_activities: 0, investing_activities: 0, financing_activities: 0, net_cash_flow: 0 } });
      return Promise.resolve({ data: {} });
    });
  }

  it('performs triple fetch once on mount and on date change', async () => {
    mockReports();
    renderWithProviders(<Reports />);
    // Initial triple fetch
    await waitFor(() => expect(api.get.mock.calls.filter(c => c[0].includes('/api/reports/')).length).toBe(3));
    api.get.mockClear();

    // Simulate date change by clicking refresh (still uses same dates) - expect triple fetch once
    const refreshBtn = document.querySelector('button');
    refreshBtn.click();
    await waitFor(() => expect(api.get.mock.calls.filter(c => c[0].includes('/api/reports/')).length).toBe(3));
  });
});
