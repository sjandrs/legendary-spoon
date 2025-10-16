import React from 'react';
import { useTranslation } from 'react-i18next';

const Accounting = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t('financial:accounting.title', 'Accounting')}</h2>
      <p>{t('financial:accounting.description', 'This page will be used for managing accounting, including income and expenses.')}</p>
    </div>
  );
};

export default Accounting;
