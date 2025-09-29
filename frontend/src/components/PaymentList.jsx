import React, { useEffect, useState } from 'react';
import { getPayments } from '../api';

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayments().then(res => {
      setPayments(res.data.results || res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <table className="striped-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Invoice</th>
          <th>Amount</th>
          <th>Payment Date</th>
          <th>Method</th>
          <th>Received By</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(payment => (
          <tr key={payment.id}>
            <td>{payment.id}</td>
            <td>{payment.related_object}</td>
            <td>{payment.amount}</td>
            <td>{payment.payment_date}</td>
            <td>{payment.method}</td>
            <td>{payment.received_by}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PaymentList;
