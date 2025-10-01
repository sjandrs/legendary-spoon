import React, { useEffect, useState } from 'react';
import { getWorkOrders } from '../api';
import api from '../api';

const WorkOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingNotification, setSendingNotification] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getWorkOrders().then(res => {
      setOrders(res.data.results || res.data);
      setLoading(false);
    });
  }, []);

  const handleOnMyWay = async (workOrder) => {
    setSendingNotification(workOrder.id);
    setMessage('');

    try {
      const response = await api.post('/api/notifications/send-on-way/', {
        work_order_id: workOrder.id,
        customer_phone: workOrder.customer_phone,
        customer_email: workOrder.customer_email,
        technician_name: workOrder.technician_name || 'Technician',
        estimated_arrival: calculateETA()
      });

      if (response.status === 200) {
        setMessage(`"On My Way" notification sent successfully to customer!`);
        // Update the work order status locally
        setOrders(orders.map(order =>
          order.id === workOrder.id
            ? { ...order, status: 'en_route', last_notification: new Date().toISOString() }
            : order
        ));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage('Error sending notification. Please try again.');
    } finally {
      setSendingNotification(null);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const calculateETA = () => {
    // Simple ETA calculation - in real implementation this would use GPS/mapping
    const now = new Date();
    const eta = new Date(now.getTime() + (30 * 60000)); // Add 30 minutes
    return eta.toISOString();
  };

  const canSendOnMyWay = (order) => {
    // Can send notification if status is 'assigned' or 'in_progress' and technician exists
    return ['assigned', 'in_progress'].includes(order.status) && order.technician_name;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'assigned': '#3b82f6',
      'in_progress': '#8b5cf6',
      'en_route': '#10b981',
      'completed': '#6b7280',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="work-order-list">
      {message && (
        <div className={`notification-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <table className="striped-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Project</th>
            <th>Description</th>
            <th>Technician</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{order.project_name || order.project}</td>
              <td>{order.description}</td>
              <td>{order.technician_name || 'Unassigned'}</td>
              <td>
                {order.customer_name && (
                  <div>
                    <div>{order.customer_name}</div>
                    <small>{order.customer_phone}</small>
                  </div>
                )}
              </td>
              <td>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusColor(order.status),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  {order.status?.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td>
                {canSendOnMyWay(order) && (
                  <button
                    className="on-my-way-btn"
                    onClick={() => handleOnMyWay(order)}
                    disabled={sendingNotification === order.id}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: sendingNotification === order.id ? 'not-allowed' : 'pointer',
                      opacity: sendingNotification === order.id ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {sendingNotification === order.id ? '📱 Sending...' : '🚗 On My Way'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .work-order-list {
          padding: 1rem;
        }

        .notification-message {
          padding: 1rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .notification-message.success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .notification-message.error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .on-my-way-btn:hover:not(:disabled) {
          background-color: #059669;
          transform: translateY(-1px);
        }

        .striped-table td:last-child {
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default WorkOrderList;
