import React, { useEffect, useState } from 'react';
import { getLineItems } from '../api';

const LineItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLineItems()
      .then(res => {
        const data = res.data;
        if (data && typeof data === 'object') {
          setItems(data.results || data || []);
        } else {
          setItems([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch line items:', err);
        setItems([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <table className="striped-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Work Order</th>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>{item.work_order}</td>
            <td>{item.description}</td>
            <td>{item.quantity}</td>
            <td>{item.unit_price}</td>
            <td>{item.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LineItemList;
