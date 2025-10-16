import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getJournalEntries } from '../api';
import { getHeaderIds } from '../utils/a11yTable';

const JournalEntryList = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('financial');

  useEffect(() => {
    getJournalEntries()
      .then(res => {
        const data = res.data;
        if (data && typeof data === 'object') {
          setEntries(data.results || data || []);
        } else {
          setEntries([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch journal entries:', err);
        setEntries([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>{t('journal.status.loading', 'Loading...')}</div>;

  const headerIds = getHeaderIds('journal', ['id','date','description','debit','credit','amount']);

  return (
    <table className="striped-table" role="table" aria-label={t('journal.a11y.table_label', 'Journal Entries')}>
      <caption className="sr-only">{t('journal.a11y.table_caption', 'Journal entries including date, description, debit/credit accounts, and amount')}</caption>
      <thead>
        <tr>
          <th scope="col" id={headerIds.id}>{t('journal.table.id', 'ID')}</th>
          <th scope="col" id={headerIds.date}>{t('journal.table.date', 'Date')}</th>
          <th scope="col" id={headerIds.description}>{t('journal.table.description', 'Description')}</th>
          <th scope="col" id={headerIds.debit}>{t('journal.table.debit', 'Debit Account')}</th>
          <th scope="col" id={headerIds.credit}>{t('journal.table.credit', 'Credit Account')}</th>
          <th scope="col" id={headerIds.amount}>{t('journal.table.amount', 'Amount')}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(entry => (
          <tr key={entry.id}>
            <th scope="row" headers={headerIds.id}>{entry.id}</th>
            <td headers={headerIds.date}>{entry.date}</td>
            <td headers={headerIds.description}>{entry.description}</td>
            <td headers={headerIds.debit}>{entry.debit_account}</td>
            <td headers={headerIds.credit}>{entry.credit_account}</td>
            <td headers={headerIds.amount}>{entry.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default JournalEntryList;
