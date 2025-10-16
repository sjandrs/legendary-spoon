import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLedgerAccounts } from '../api';
import { getHeaderIds } from '../utils/a11yTable';

const LedgerAccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('financial');

  useEffect(() => {
    getLedgerAccounts()
      .then(res => {
        const data = res.data;
        if (data && typeof data === 'object') {
          const accountsData = data.results || data || [];
          setAccounts(Array.isArray(accountsData) ? accountsData : []);
        } else {
          setAccounts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch ledger accounts:', err);
        setAccounts([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t('ledger.status.loading', 'Loading...')}</div>;

  const headerIds = getHeaderIds('ledger', ['id','name','code','type']);

  return (
    <table className="striped-table" role="table" aria-label={t('ledger.a11y.table_label', 'Ledger Accounts')}>
      <caption className="sr-only">{t('ledger.a11y.table_caption', 'Ledger accounts including code and type')}</caption>
      <thead>
        <tr>
          <th scope="col" id={headerIds.id}>{t('ledger.table.id', 'ID')}</th>
          <th scope="col" id={headerIds.name}>{t('ledger.table.name', 'Name')}</th>
          <th scope="col" id={headerIds.code}>{t('ledger.table.code', 'Code')}</th>
          <th scope="col" id={headerIds.type}>{t('ledger.table.type', 'Type')}</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map(acc => (
          <tr key={acc.id}>
            <th scope="row" headers={headerIds.id}>{acc.id}</th>
            <td headers={headerIds.name}>{acc.name}</td>
            <td headers={headerIds.code}>{acc.code}</td>
            <td headers={headerIds.type}>{acc.account_type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LedgerAccountList;
