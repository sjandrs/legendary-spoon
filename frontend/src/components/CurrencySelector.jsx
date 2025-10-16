import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';

const CURRENCIES = [
  { code: 'USD', label: 'USD $' },
  { code: 'EUR', label: 'EUR €' },
  { code: 'GBP', label: 'GBP £' },
  { code: 'JPY', label: 'JPY ¥' },
];

const CurrencySelector = ({ className = '' }) => {
  const { t } = useTranslation();
  const { currency, setUserCurrency } = useLocaleFormatting();

  return (
    <div className={`currency-selector ${className}`}>
      <label className="sr-only" htmlFor="currency-select">
        {t('common:preferences.currency.label', 'Currency')}
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setUserCurrency(e.target.value)}
        className="currency-select"
        aria-label={t('common:preferences.currency.aria', 'Select currency')}
        title={t('common:preferences.currency.tooltip', 'Display amounts in this currency')}
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;
