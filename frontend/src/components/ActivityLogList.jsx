import React, { useState, useEffect } from 'react';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';
import api from '../api';
import './ActivityLogList.css';

function ActivityLogList() {
  const { formatDateTime } = useLocaleFormatting();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/activity-logs/');
      setLogs(response.data.results || response.data);
    } catch (_err) {
      console.error('Failed to fetch activity logs:', _err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs
    .filter(log => {
      if (filter === 'all') return true;
      return log.action === filter;
    })
    .filter(log =>
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="activity-log-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-log-list">
      <div className="header">
        <h1>📋 Activity Logs</h1>
        <span className="admin-badge">Admin Only</span>
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </select>
      </div>

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-cell">No activity logs found</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.timestamp)}</td>
                  <td>{log.user || 'System'}</td>
                  <td>
                    <span className={`action-badge action-${log.action}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.description}</td>
                  <td className="ip-cell">{log.ip_address || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActivityLogList;
