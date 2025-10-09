
import { renderWithProviders } from '../helpers/test-utils';
import { screen, waitFor } from '@testing-library/react';
import * as api from '../../api';
import SchedulingDashboard from '../../components/SchedulingDashboard';

jest.mock('../../api');

/**
 * SchedulingDashboard fetch behavior tests
 */

describe('SchedulingDashboard fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockDashboard(period = 'week', _tech = 'all') {
    api.get.mockImplementation((url, { params: _params } = {}) => {
      if (url === '/api/technicians/') {
        return Promise.resolve({ data: { results: [{ id: 1, first_name: 'Jane', last_name: 'Tech' }] } });
      }
      if (url === '/api/analytics/dashboard/') {
        if (_params.period !== period) throw new Error('Unexpected period');
        return Promise.resolve({ data: { total_appointments: 5 } });
      }
      if (url === '/api/scheduling-analytics/') {
        return Promise.resolve({ data: { results: [] } });
      }
      return Promise.resolve({ data: {} });
    });
  }

  it('performs single initial fetch set (dashboard + analytics + technicians)', async () => {
    mockDashboard();
    renderWithProviders(<SchedulingDashboard />);

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/technicians/'));

    const dashCalls = api.get.mock.calls.filter(c => c[0] === '/api/analytics/dashboard/');
    const analyticsCalls = api.get.mock.calls.filter(c => c[0] === '/api/scheduling-analytics/');
    const techCalls = api.get.mock.calls.filter(c => c[0] === '/api/technicians/');

    expect(dashCalls).toHaveLength(1);
    expect(analyticsCalls).toHaveLength(1);
    expect(techCalls).toHaveLength(1);
  });

  it('refetches dashboard & analytics (not technicians) when period changes', async () => {
    mockDashboard();
    renderWithProviders(<SchedulingDashboard />);
    await waitFor(() => expect(api.get).toHaveBeenCalled());

    // Clear call counts after initial load to isolate delta
    api.get.mockClear();
    api.get.mockImplementation((url, { params } = {}) => {
      if (url === '/api/technicians/') {
        return Promise.resolve({ data: { results: [{ id: 1, first_name: 'Jane', last_name: 'Tech' }] } });
      }
      if (url === '/api/analytics/dashboard/') {
        return Promise.resolve({ data: { total_appointments: 8 } });
      }
      if (url === '/api/scheduling-analytics/') {
        return Promise.resolve({ data: { results: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    const periodSelect = screen.getByDisplayValue(/Last 7 Days/i);
    periodSelect.value = 'month';
    periodSelect.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => {
      const dashCalls = api.get.mock.calls.filter(c => c[0] === '/api/analytics/dashboard/');
      const analyticsCalls = api.get.mock.calls.filter(c => c[0] === '/api/scheduling-analytics/');
      expect(dashCalls).toHaveLength(1);
      expect(analyticsCalls).toHaveLength(1);
    });

    // Ensure technicians not refetched
    const techCalls = api.get.mock.calls.filter(c => c[0] === '/api/technicians/');
    expect(techCalls).toHaveLength(0);
  });
});
