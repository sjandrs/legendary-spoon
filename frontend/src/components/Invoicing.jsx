import React from 'react';
import { useTranslation } from 'react-i18next';

const Invoicing = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t('financial:invoicing.title', 'Invoicing')}</h2>
      <p>{t('financial:invoicing.description', 'This page will be used for creating and managing invoices.')}</p>
    </div>
  );
};

export default Invoicing;
