const fs = require('fs');
const path = require('path');

module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    // Include any other file types that might contain translation keys
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['i18next.t', 'i18n.t', 't'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    lngs: ['en', 'es', 'fr', 'ar'],
  ns: ['common', 'dashboard', 'forms', 'navigation', 'errors', 'financial', 'crm', 'field-service', 'warehouse'],
    defaultLng: 'en',
    defaultNs: 'common',
    defaultValue: function (lng, ns, key) {
      if (lng === 'en') {
        // Return the key itself as default value for English
        return key;
      }
      return '__STRING_NOT_TRANSLATED__';
    },
    resource: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
      savePath: 'public/locales/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
    metadata: {},
    allowDynamicKeys: false,
  },
  transform: function customTransform(file, enc, done) {
    'use strict';
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);
    let count = 0;

    parser.parseFuncFromString(
      content,
      { list: ['i18next._', 'i18next.__', 'i18n.t', 't'] },
      (key, options) => {
        parser.set(key, Object.assign({}, options, {
          nsSeparator: ':',
          keySeparator: '.'
        }));
        ++count;
      }
    );

    parser.parseTransFromString(
      content,
      { component: 'Trans', i18nKey: 'i18nKey' },
      (key, options) => {
        parser.set(key, Object.assign({}, options, {
          nsSeparator: ':',
          keySeparator: '.'
        }));
        ++count;
      }
    );

    if (count > 0) {
      console.log(`i18next-scanner: count=${count}, file=${file.relative}`);
    }

    done();
  },
};
