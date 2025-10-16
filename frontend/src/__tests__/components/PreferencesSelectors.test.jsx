import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import CurrencySelector from '../../components/CurrencySelector';
import TimeZoneSelector from '../../components/TimeZoneSelector';
import { useLocaleFormatting } from '../../hooks/useLocaleFormatting';

const DemoFormatted = () => {
  const { formatCurrency, formatDateTime } = useLocaleFormatting();
  return (
    <div>
      <div data-testid="amount">{formatCurrency(1234.5)}</div>
      <div data-testid="dt">{formatDateTime('2025-10-10T12:00:00Z')}</div>
    </div>
  );
};

describe('Currency and Timezone selectors', () => {
  test('CurrencySelector updates localStorage and formatting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<><CurrencySelector /><DemoFormatted /></>);

    const before = screen.getByTestId('amount').textContent;
    const select = screen.getByRole('combobox', { name: /select currency/i });
    await user.selectOptions(select, 'EUR');

    expect(window.localStorage.setItem).toHaveBeenCalledWith('userCurrency', 'EUR');
    const after = screen.getByTestId('amount').textContent;
    expect(after).not.toEqual(before);
  });

  test('TimeZoneSelector updates localStorage and affects datetime', async () => {
    const user = userEvent.setup();
    renderWithProviders(<><TimeZoneSelector /><DemoFormatted /></>);

    const before = screen.getByTestId('dt').textContent;
    const select = screen.getByRole('combobox', { name: /select time zone/i });
    await user.selectOptions(select, 'Asia/Tokyo');

    expect(window.localStorage.setItem).toHaveBeenCalledWith('userTimeZone', 'Asia/Tokyo');
    const after = screen.getByTestId('dt').textContent;
    expect(after).not.toEqual(before);
  });
});
