import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../helpers/test-utils';
import { http } from 'msw';

import WorkOrderList from '../../components/WorkOrderList';

describe('WorkOrderList i18n', () => {
  beforeEach(() => {
    // Default to English
    window.localStorage.setItem('i18nextLng', 'en');
  });

  it('renders localized headers and button text (en)', async () => {
    // Mock work orders API
    globalThis.msw.server.use(
      http.get('http://localhost:8000/api/work-orders/', () => {
        return globalThis.msw.HttpResponse.json({
          results: [
            {
              id: 101,
              project_name: 'Install Router',
              description: 'Setup and configure router',
              technician_name: 'Alex',
              customer_name: 'Contoso',
              customer_phone: '555-0100',
              status: 'assigned',
              created_at: '2025-10-10T10:00:00Z',
            },
          ],
        });
      })
    );

    renderWithProviders(<WorkOrderList />);

    // Headers localized (use English defaults from mocks)
    expect(await screen.findByRole('columnheader', { name: /project/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    const row = screen.getByRole('row', { name: /#101/i });
    // Button text should be On My Way in English
    const btn = within(row).getByRole('button', { name: /on my way/i });
    expect(btn).toBeInTheDocument();
  });

  it('renders with Spanish locale placeholder keys without crashing', async () => {
    window.localStorage.setItem('i18nextLng', 'es');

    globalThis.msw.server.use(
      http.get('http://localhost:8000/api/work-orders/', () => {
        return globalThis.msw.HttpResponse.json({
          results: [
            {
              id: 202,
              project_name: 'Revisión',
              description: 'Inspección técnica',
              technician_name: 'María',
              customer_name: 'Fabrikam',
              customer_phone: '555-0200',
              status: 'assigned',
              created_at: '2025-10-11T12:00:00Z',
            },
          ],
        });
      })
    );

    renderWithProviders(<WorkOrderList />);

    // Table renders; column headers exist (may show placeholders but should exist)
    expect(await screen.findByRole('table', { name: /work orders|ordenes|__string_not_translated__/i })).toBeInTheDocument();
    // Button still present (text may be placeholder)
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
