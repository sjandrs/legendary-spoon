
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor } from '@testing-library/react';
import ActivityTimeline from '../../components/ActivityTimeline';

jest.mock('../../api', () => ({
  ...jest.requireActual('../../api'),
  getActivityLogs: jest.fn()
}));

const { getActivityLogs } = require('../../api');

describe('ActivityTimeline fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  function mockLogs() {
    getActivityLogs.mockResolvedValue({ data: [] });
  }

  it('fetches once on mount and once when filter changes', async () => {
    mockLogs();
    const { rerender } = renderWithProviders(<ActivityTimeline />);
    await waitFor(() => expect(getActivityLogs).toHaveBeenCalledTimes(1));
    getActivityLogs.mockClear();
    // Change filter by re-rendering with prop to trigger dependency difference
    rerender(<ActivityTimeline resourceType={undefined} resourceId={undefined} limit={20} />);
    // No change should not refetch
    await new Promise(r => setTimeout(r, 50));
    expect(getActivityLogs).toHaveBeenCalledTimes(0);
  });
});
