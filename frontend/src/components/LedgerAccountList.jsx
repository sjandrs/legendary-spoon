import React, { useEffect, useState } from 'react';
import { getLedgerAccounts } from '../api';

const LedgerAccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div>Loading...</div>;

  return (
    <table className="striped-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Code</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        {accounts.map(acc => (
          <tr key={acc.id}>
            <td>{acc.id}</td>
            <td>{acc.name}</td>
            <td>{acc.code}</td>
            <td>{acc.account_type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LedgerAccountList;
