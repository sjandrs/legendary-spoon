import React, { useState, useEffect } from 'react';
import { getActivityLogs } from '../api';
import './ActivityTimeline.css';

const ActivityTimeline = ({ resourceType, resourceId, limit = 20 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadActivities();
  }, [resourceType, resourceId, filter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      let url = '/api/activity-logs/';

      if (resourceType && resourceId) {
        url += `by_resource/?resource_type=${resourceType}&resource_id=${resourceId}`;
      } else {
        url += 'recent/';
      }

      const response = await getActivityLogs(url);
      let filteredData = response.data;

      if (filter !== 'all') {
        filteredData = filteredData.filter(activity => activity.action === filter);
      }

      setActivities(filteredData.slice(0, limit));
    } catch (_err) {
      console.error('Error loading activities:', _err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'view':
        return '👁️';
      default:
        return '📝';
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'create':
        return '#28a745';
      case 'update':
        return '#007bff';
      case 'delete':
        return '#dc3545';
      case 'view':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'Account':
        return '🏢';
      case 'Contact':
        return '👤';
      case 'Task':
        return '📋';
      case 'Deal':
        return '💼';
      case 'Quote':
        return '📄';
      case 'Invoice':
        return '🧾';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="activity-timeline">
        <div className="timeline-header">
          <h3>Activity Timeline</h3>
        </div>
        <div className="loading">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="activity-timeline">
      <div className="timeline-header">
        <h3>Activity Timeline</h3>
        {!resourceType && (
          <div className="timeline-filters">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Activities</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="view">Viewed</option>
            </select>
          </div>
        )}
      </div>

      <div className="timeline-content">
        {activities.length === 0 ? (
          <div className="no-activities">
            <p>No activities found</p>
          </div>
        ) : (
          <div className="timeline-list">
            {activities.map((activity, index) => (
              <div key={activity.id} className="timeline-item">
                <div className="timeline-marker">
                  <div
                    className="timeline-icon"
                    style={{ backgroundColor: getActivityColor(activity.action) }}
                  >
                    {getActivityIcon(activity.action)}
                  </div>
                  {index !== activities.length - 1 && <div className="timeline-line"></div>}
                </div>

                <div className="timeline-content-item">
                  <div className="activity-header">
                    <span className="activity-user">
                      {activity.user_display_name || activity.user}
                    </span>
                    <span className="activity-action">
                      {activity.action}d
                    </span>
                    <span className="activity-resource">
                      {getResourceIcon(activity.resource_type)} {activity.resource_type}
                    </span>
                    <span className="activity-time">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>

                  <div className="activity-description">
                    {activity.description}
                  </div>

                  {activity.details && (
                    <div className="activity-details">
                      <pre>{JSON.stringify(activity.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activities.length >= limit && (
        <div className="timeline-footer">
          <button
            onClick={() => {/* TODO: Load more activities */}}
            className="load-more-btn"
          >
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;
