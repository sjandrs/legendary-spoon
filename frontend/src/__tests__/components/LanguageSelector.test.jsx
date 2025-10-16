import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../helpers/test-utils';
import LanguageSelector from '../../components/LanguageSelector';

describe('LanguageSelector', () => {
  test('persists selected language and toggles RTL for Arabic', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSelector />);

    const select = screen.getByRole('combobox', { name: /select language/i });

    // Change to Arabic
    await user.selectOptions(select, 'ar');

    // Local storage persistence
    expect(window.localStorage.setItem).toHaveBeenCalledWith('i18nextLng', 'ar');

    // Document direction should be rtl
    expect(document.dir).toBe('rtl');

    // Change back to English
    await user.selectOptions(select, 'en');
    expect(document.dir).toBe('ltr');
  });

  test('has accessible labels and title', () => {
    renderWithProviders(<LanguageSelector />);
    const select = screen.getByRole('combobox', { name: /select language|change display language/i });
    expect(select).toBeInTheDocument();
  });
});
