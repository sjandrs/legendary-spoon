import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getWorkOrders } from '../api';
import api from '../api';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';

const WorkOrderList = () => {
  const { t } = useTranslation(['operational', 'common', 'a11y']);
  const { formatDate } = useLocaleFormatting();

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
        technician_name: workOrder.technician_name || t('common:common.technician', 'Technician'),
        estimated_arrival: calculateETA()
      });

      if (response.status === 200) {
        setMessage(t('operational:work_orders.messages.sent', '"On My Way" notification sent successfully to customer!'));
        // Update the work order status locally
        setOrders(orders.map(order =>
          order.id === workOrder.id
            ? { ...order, status: 'en_route', last_notification: new Date().toISOString() }
            : order
        ));
      }
    } catch (_err) {
      console.error('Error sending notification:', _err);
      setMessage(t('operational:work_orders.messages.error', 'Error sending notification. Please try again.'));
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

  if (loading) return <div>{t('common:status.loading', 'Loading...')}</div>;

  return (
    <div className="work-order-list">
      {message && (
        <div className={`notification-message ${message.includes('Error') ? 'error' : 'success'}`} role="alert" aria-live="assertive">
          {message}
        </div>
      )}

      <table className="striped-table" role="table" aria-label={t('operational:work_orders.title', 'Work Orders')}>
        <caption className="sr-only">{t('a11y:work_orders.caption', 'List of work orders with status and actions')}</caption>
        <thead>
          <tr>
            <th scope="col" id="wo-id" role="columnheader">{t('operational:work_orders.columns.id', 'ID')}</th>
            <th scope="col" id="wo-project" role="columnheader">{t('operational:work_orders.columns.project', 'Project')}</th>
            <th scope="col" id="wo-description" role="columnheader">{t('operational:work_orders.columns.description', 'Description')}</th>
            <th scope="col" id="wo-tech" role="columnheader">{t('operational:work_orders.columns.technician', 'Technician')}</th>
            <th scope="col" id="wo-customer" role="columnheader">{t('operational:work_orders.columns.customer', 'Customer')}</th>
            <th scope="col" id="wo-status" role="columnheader">{t('operational:work_orders.columns.status', 'Status')}</th>
            <th scope="col" id="wo-created" role="columnheader">{t('operational:work_orders.columns.created', 'Created')}</th>
            <th scope="col" id="wo-actions" role="columnheader">{t('operational:work_orders.columns.actions', 'Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td headers="wo-id">#{order.id}</td>
              <td headers="wo-project">{order.project_name || order.project}</td>
              <td headers="wo-description">{order.description}</td>
              <td headers="wo-tech">{order.technician_name || t('operational:work_orders.statuses.unassigned', 'Unassigned')}</td>
              <td headers="wo-customer">
                {order.customer_name && (
                  <div>
                    <div>{order.customer_name}</div>
                    <small>{order.customer_phone}</small>
                  </div>
                )}
              </td>
              <td headers="wo-status">
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
                  {(() => {
                    const keyMap = {
                      pending: 'pending',
                      assigned: 'assigned',
                      in_progress: 'in_progress',
                      en_route: 'en_route',
                      completed: 'completed',
                      cancelled: 'cancelled',
                    };
                    const k = keyMap[order.status] || 'unknown';
                    return t(`operational:work_orders.statuses.${k}`, order.status?.replace('_', ' ').toUpperCase());
                  })()}
                </span>
              </td>
              <td headers="wo-created">{formatDate(order.created_at)}</td>
              <td headers="wo-actions">
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
                    aria-label={t('operational:work_orders.aria.send_on_my_way', 'Send On My Way notification for work order {{id}}', { id: order.id })}
                  >
                    {sendingNotification === order.id
                      ? t('operational:work_orders.buttons.sending', '📱 Sending...')
                      : t('operational:work_orders.buttons.on_my_way', '🚗 On My Way')}
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
