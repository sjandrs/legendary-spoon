import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPayments } from '../api';
import { getHeaderIds } from '../utils/a11yTable';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('financial');

  useEffect(() => {
    getPayments().then(res => {
      const paymentsData = res.data.results || res.data || [];
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching payments:', err);
      setPayments([]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>{t('payments.status.loading', 'Loading...')}</div>;

  const headerIds = getHeaderIds('payments', ['id','invoice','amount','date','method','received']);

  return (
    <table className="striped-table" role="table" aria-label={t('payments.a11y.table_label', 'Payments')}>
      <caption className="sr-only">{t('payments.a11y.table_caption', 'Payments including invoice reference, amount, date, method, and receiver')}</caption>
      <thead>
        <tr>
          <th scope="col" id={headerIds.id}>{t('payments.table.id', 'ID')}</th>
          <th scope="col" id={headerIds.invoice}>{t('payments.table.invoice', 'Invoice')}</th>
          <th scope="col" id={headerIds.amount}>{t('payments.table.amount', 'Amount')}</th>
          <th scope="col" id={headerIds.date}>{t('payments.table.payment_date', 'Payment Date')}</th>
          <th scope="col" id={headerIds.method}>{t('payments.table.method', 'Method')}</th>
          <th scope="col" id={headerIds.received}>{t('payments.table.received_by', 'Received By')}</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(payment => (
          <tr key={payment.id}>
            <th scope="row" headers={headerIds.id}>{payment.id}</th>
            <td headers={headerIds.invoice}>{payment.related_object}</td>
            <td headers={headerIds.amount}>{payment.amount}</td>
            <td headers={headerIds.date}>{payment.payment_date}</td>
            <td headers={headerIds.method}>{payment.method}</td>
            <td headers={headerIds.received}>{payment.received_by}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PaymentList;
