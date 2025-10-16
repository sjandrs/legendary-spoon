import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';

// Lightweight timezone selector using Intl.supportedValuesOf when available
const TimeZoneSelector = ({ className = '' }) => {
  const { t } = useTranslation();
  const { timeZone, setUserTimeZone } = useLocaleFormatting();

  const zones = useMemo(() => {
    try {
      // Modern browsers
      // eslint-disable-next-line no-undef
      if (typeof Intl.supportedValuesOf === 'function') {
        // eslint-disable-next-line no-undef
        return Intl.supportedValuesOf('timeZone');
      }
    } catch {
      // ignore
    }
    // Fallback shortlist
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Dubai',
      'Asia/Tokyo'
    ];
  }, []);

  const onChange = (e) => {
    const tz = e.target.value;
    setUserTimeZone(tz);
  };

  return (
    <div className={`timezone-selector ${className}`}>
      <label className="sr-only" htmlFor="timezone-select">
        {t('common:preferences.timezone.label', 'Time zone')}
      </label>
      <select
        id="timezone-select"
        value={timeZone}
        onChange={onChange}
        className="timezone-select"
        aria-label={t('common:preferences.timezone.aria', 'Select time zone')}
        title={t('common:preferences.timezone.tooltip', 'Display times in this time zone')}
      >
        {zones.map((z) => (
          <option key={z} value={z}>{z}</option>
        ))}
      </select>
    </div>
  );
};

export default TimeZoneSelector;
