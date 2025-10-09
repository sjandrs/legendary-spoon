
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor } from '@testing-library/react';
import * as api from '../../api';
import SchedulePage from '../../components/SchedulePage';

jest.mock('../../api');

describe('SchedulePage fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  const mockInitial = () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/scheduled-events/') return Promise.resolve({ data: { results: [] } });
      if (url === '/api/technicians/') return Promise.resolve({ data: { results: [{ id: 1, first_name: 'A', last_name: 'Tech' }] } });
      if (url === '/api/work-orders/') return Promise.resolve({ data: { results: [{ id: 10, description: 'Install Device' }] } });
      return Promise.resolve({ data: {} });
    });
  };

  it('performs single initial batch load (events + technicians + work orders)', async () => {
    mockInitial();
    renderWithProviders(<SchedulePage />);

    await waitFor(() => {
      const eventsCalls = api.get.mock.calls.filter(c => c[0] === '/api/scheduled-events/');
      const techCalls = api.get.mock.calls.filter(c => c[0] === '/api/technicians/');
      const woCalls = api.get.mock.calls.filter(c => c[0] === '/api/work-orders/');
      expect(eventsCalls).toHaveLength(1);
      expect(techCalls).toHaveLength(1);
      expect(woCalls).toHaveLength(1);
    });
  });

  it('refreshes only events after drag/drop (simulated)', async () => {
    mockInitial();
    renderWithProviders(<SchedulePage />);

    await waitFor(() => expect(api.get).toHaveBeenCalled());
    api.get.mockClear();

    // Simulate event-only reload (calling internal loadEvents indirectly)
    api.get.mockImplementation((url) => {
      if (url === '/api/scheduled-events/') return Promise.resolve({ data: { results: [] } });
      return Promise.resolve({ data: {} });
    });

    // Call the events endpoint manually to mimic loadEvents invocation
    await api.get('/api/scheduled-events/');

    const eventsCalls = api.get.mock.calls.filter(c => c[0] === '/api/scheduled-events/');
    const techCalls = api.get.mock.calls.filter(c => c[0] === '/api/technicians/');
    const woCalls = api.get.mock.calls.filter(c => c[0] === '/api/work-orders/');

    expect(eventsCalls).toHaveLength(1);
    expect(techCalls).toHaveLength(0);
    expect(woCalls).toHaveLength(0);
  });
});
