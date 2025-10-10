import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './UtilityNavigation.css';

/**
 * UtilityNavigation - Global utility bar with search, notifications, chat, and profile
 * Provides quick access to frequently used features across the application
 */
const UtilityNavigation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=global`);
      setSearchQuery('');
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  return (
    <div className="utility-navigation" role="navigation" aria-label="Utility navigation">
      <div className="utility-nav-content">
        {/* Global Search */}
        <div className="utility-search">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <label htmlFor="global-search" className="sr-only">Global search</label>
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Search..."
              className="search-input"
              aria-label="Global search input"
              data-testid="global-search-input"
            />
            <button
              type="submit"
              className="search-btn"
              aria-label="Submit search"
              data-testid="global-search-submit"
            >

            </button>
          </form>
        </div>

        {/* Utility Icons */}
        <div className="utility-icons">
          {/* Notifications */}
          <div className="utility-icon-wrapper">
            <button
              className="utility-icon"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              aria-expanded={showNotifications}
              data-testid="notifications-button"
            >

              <span className="notification-badge">3</span>
            </button>
            {showNotifications && (
              <div className="notifications-dropdown" role="menu">
                <div className="dropdown-header">
                  <h4>Notifications</h4>
                  <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                    View All
                  </Link>
                </div>
                <div className="notification-list">
                  <div className="notification-item" role="menuitem">
                    <p><strong>New Deal Created</strong></p>
                    <p className="notification-text">Acme Corp - $50,000</p>
                    <span className="notification-time">5 minutes ago</span>
                  </div>
                  <div className="notification-item" role="menuitem">
                    <p><strong>Task Assigned</strong></p>
                    <p className="notification-text">Follow up with client</p>
                    <span className="notification-time">1 hour ago</span>
                  </div>
                  <div className="notification-item" role="menuitem">
                    <p><strong>Work Order Completed</strong></p>
                    <p className="notification-text">WO-1234 completed by John</p>
                    <span className="notification-time">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <Link
            to="/chat"
            className="utility-icon"
            aria-label="Chat"
            data-testid="chat-button"
          >

          </Link>

          {/* Profile/User Menu */}
          <Link
            to="/settings/user-roles"
            className="utility-icon profile-icon"
            aria-label="User profile and settings"
            data-testid="profile-button"
          >

          </Link>
        </div>
      </div>
    </div>
  );
};

export default UtilityNavigation;
