import React from 'react';
import { Link } from 'react-router-dom';
import ActivityTimeline from './ActivityTimeline';
import './ActivityTimelinePage.css';

/**
 * ActivityTimelinePage - Wrapper component for ActivityTimeline
 * Provides a standalone page for viewing all activity across the CRM
 */
function ActivityTimelinePage() {
  return (
    <div className="activity-timeline-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Activity Timeline</h1>
          <p className="page-description">
            View all activities and interactions across your CRM in chronological order
          </p>
        </div>
        <Link to="/interactions/new" className="btn-primary">
          Log Interaction
        </Link>
      </div>

      <div className="timeline-content">
        <ActivityTimeline />
      </div>
    </div>
  );
}

export default ActivityTimelinePage;
