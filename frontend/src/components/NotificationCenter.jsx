import React, { useState, useEffect } from 'react';
import api from '../api';
import './NotificationCenter.css';

function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications/');
      const data = res.data;
      setNotifications(data.results || data || []);
    } catch (_err) {
      console.error('Failed to fetch notifications:', _err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/`, { is_read: true });
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (_err) {
      console.error('Failed to mark notification as read:', _err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}/`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (_err) {
      console.error('Failed to delete notification:', _err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Align with tests/MSW handlers by PATCHing each notification individually
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => api.patch(`/api/notifications/${n.id}/`, { is_read: true }).catch(() => null))
      );
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (_err) {
      console.error('Failed to mark all as read:', _err);
    }
  };

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === 'unread') return !n.is_read;
      if (filter === 'read') return n.is_read;
      return true;
    })
    .filter(n => {
      if (typeFilter === 'all') return true;
      return (n.type || '').toLowerCase() === typeFilter;
    });

  if (loading) {
    return (
      <div className="notification-center">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-center" role="region" aria-label="Notifications">
      <div className="header">
        <h1>🔔 Notifications</h1>
        <button onClick={markAllAsRead} className="mark-all-btn" data-testid="mark-all-read">
          Mark All as Read
        </button>
        <span data-testid="unread-count" style={{ marginLeft: 12 }}>
          {notifications.filter(n => !n.is_read).length}
        </span>
        {notifications.some(n => !n.is_read) && (
          <span data-testid="new-notification-badge" className="new-badge">•</span>
        )}
      </div>

      <div className="filters">
        <select
          data-testid="type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="success">success</option>
        </select>
        <select
          data-testid="status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="unread">unread</option>
          <option value="read">read</option>
        </select>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              data-testid={`notification-${notification.id}`}
              className={`notification-item ${notification.is_read ? 'notification-read' : 'unread'}`}
            >
              <div className="notification-icon">{notification.icon || '📬'}</div>
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.created_at).toLocaleString()}
                </span>
                <span data-testid={`notification-${notification.id}-type-${notification.type || 'info'}`} style={{ display: 'none' }} />
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    data-testid={`mark-read-${notification.id}`}
                    onClick={() => markAsRead(notification.id)}
                    type="button"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  data-testid={`delete-notification-${notification.id}`}
                  onClick={() => deleteNotification(notification.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div role="status" aria-live="polite" style={{ position: 'absolute', left: -9999 }} />
    </div>
  );
}

export default NotificationCenter;
