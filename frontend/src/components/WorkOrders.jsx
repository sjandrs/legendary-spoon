import React from 'react';
import { useTranslation } from 'react-i18next';

const WorkOrders = () => {
  const { t } = useTranslation(['operational', 'common']);
  return (
    <div>
      <h2>{t('operational:work_orders.title', 'Work Orders')}</h2>
      <p>{t('operational:work_orders.description', 'This page will be used for generating and managing work orders.')}</p>
    </div>
  );
};

export default WorkOrders;
