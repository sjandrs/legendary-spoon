import React from 'react';
import { renderWithProviders, expectNoAxeViolations } from '../helpers/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageSelector from '../../components/LanguageSelector';
import WorkOrderList from '../../components/WorkOrderList';

describe('RTL accessibility smoke test', () => {
  test('Arabic locale sets dir=rtl and has no basic axe violations', async () => {
    const user = userEvent.setup();

    // Mock minimal API for WorkOrderList
    globalThis.msw.server.use(
      globalThis.http.get('http://localhost:8000/api/work-orders/', () => {
        return globalThis.HttpResponse.json({ results: [] });
      })
    );

    const { container } = renderWithProviders(
      <div>
        <LanguageSelector />
        <WorkOrderList />
      </div>
    );

    const select = screen.getByRole('combobox', { name: /select language/i });
    await userEvent.selectOptions(select, 'ar');

    expect(document.dir).toBe('rtl');
    await expectNoAxeViolations(container);
  });
});
