import React, { useEffect, useState } from 'react';
import { getJournalEntries } from '../api';

const JournalEntryList = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJournalEntries().then(res => {
      setEntries(res.data.results || res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <table className="striped-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Description</th>
          <th>Debit Account</th>
          <th>Credit Account</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(entry => (
          <tr key={entry.id}>
            <td>{entry.id}</td>
            <td>{entry.date}</td>
            <td>{entry.description}</td>
            <td>{entry.debit_account}</td>
            <td>{entry.credit_account}</td>
            <td>{entry.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default JournalEntryList;
