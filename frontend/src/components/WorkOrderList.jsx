import React, { useEffect, useState } from 'react';
import { getWorkOrders } from '../api';

const WorkOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkOrders().then(res => {
      setOrders(res.data.results || res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <table className="striped-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Project</th>
          <th>Description</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.project}</td>
            <td>{order.description}</td>
            <td>{order.status}</td>
            <td>{order.created_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default WorkOrderList;
