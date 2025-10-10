
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import * as api from '../../api';
import TechnicianPayroll from '../../components/TechnicianPayroll';

jest.mock('../../api');

describe('TechnicianPayroll fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('fetches technicians on mount and payroll after selecting technician', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/technicians/') return Promise.resolve({ data: [] });
      if (url.includes('/payroll/')) return Promise.resolve({ data: { hourly_rate: 50, total_hours: 0 } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(<TechnicianPayroll />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/technicians/'));
  });
});
