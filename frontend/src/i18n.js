import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language settings
    fallbackLng: 'en',
    lng: 'en', // Default language
    supportedLngs: ['en', 'es', 'fr', 'ar'], // Supported languages

    // Debug mode
    debug: process.env.NODE_ENV === 'development',

    // Interpolation
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Backend configuration for loading translation files
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },

    // Namespaces
  ns: ['common', 'dashboard', 'forms', 'navigation', 'errors', 'financial', 'crm', 'field-service', 'warehouse', 'operational', 'a11y'],
    defaultNS: 'common',

    // React specific options
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
    },

    // Pluralization and context
    pluralSeparator: '_',
    contextSeparator: '_',

    // Formatting options
    returnObjects: false,
    returnEmptyString: true,
    returnNull: false,

    // Load options
    load: 'languageOnly',
    preload: ['en'],

    // Formatting functions for numbers, dates, and currency
    formatters: {
      currency: (value, lng, options) => {
        return new Intl.NumberFormat(lng, {
          style: 'currency',
          currency: options.currency || 'USD',
          ...options
        }).format(value);
      },

      number: (value, lng, options) => {
        return new Intl.NumberFormat(lng, options).format(value);
      },

      date: (value, lng, options) => {
        return new Intl.DateTimeFormat(lng, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          ...options
        }).format(new Date(value));
      },

      datetime: (value, lng, options) => {
        return new Intl.DateTimeFormat(lng, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          ...options
        }).format(new Date(value));
      },

      relativetime: (value, lng, _options) => {
        const rtf = new Intl.RelativeTimeFormat(lng, { numeric: 'auto' });
        const diff = new Date(value) - new Date();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return rtf.format(days, 'day');
      }
    }
  });

export default i18n;
