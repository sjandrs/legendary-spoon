import React, { useState, useEffect } from 'react';
import api from '../api';
import './SystemLogsList.css';

function SystemLogsList() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/system-logs/');
      setLogs(response.data.results || response.data);
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (levelFilter === 'all') return true;
    return log.level === levelFilter;
  });

  if (loading) {
    return (
      <div className="system-logs-list">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading system logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-logs-list">
      <div className="header">
        <h1>⚙️ System Logs</h1>
        <span className="admin-badge">Admin Only</span>
      </div>

      <div className="controls">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="logs-container">
        {filteredLogs.length === 0 ? (
          <div className="empty-state">No system logs found</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`log-entry level-${log.level}`}>
              <div className="log-header">
                <span className={`level-badge level-${log.level}`}>
                  {log.level?.toUpperCase()}
                </span>
                <span className="log-timestamp">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="log-message">{log.message}</div>
              {log.stack_trace && (
                <details className="stack-trace">
                  <summary>Stack Trace</summary>
                  <pre>{log.stack_trace}</pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SystemLogsList;
