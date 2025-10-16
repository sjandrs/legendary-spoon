import React from 'react';
import { useTranslation } from 'react-i18next';

const Staff = () => {
  const { t } = useTranslation(['operational', 'common']);
  return (
    <div>
      <h2>{t('operational:staff.title', 'Staff Management')}</h2>
      <p>{t('operational:staff.description', 'This page will be used for managing staff and payroll.')}</p>
    </div>
  );
};

export default Staff;
