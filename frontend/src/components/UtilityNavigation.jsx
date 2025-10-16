import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import CurrencySelector from './CurrencySelector';
import TimeZoneSelector from './TimeZoneSelector';
import { Link, useNavigate } from 'react-router-dom';
import './UtilityNavigation.css';

/**
 * UtilityNavigation - Global utility bar with search, notifications, chat, and profile
 * Provides quick access to frequently used features across the application
 */
const UtilityNavigation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    <div className="utility-navigation" role="navigation" aria-label={t('common:nav.utility', 'Utility navigation')}>
      <div className="utility-nav-content">
        {/* Global Search */}
        <div className="utility-search">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <label htmlFor="global-search" className="sr-only">{t('common:search.global_label', 'Global search')}</label>
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder={t('common:search.placeholder', 'Search...')}
              className="search-input"
              aria-label={t('common:search.aria', 'Global search input')}
              data-testid="global-search-input"
            />
            <button
              type="submit"
              className="search-btn"
              aria-label={t('common:search.submit', 'Submit search')}
              data-testid="global-search-submit"
            >

            </button>
          </form>
        </div>

        {/* Preferences: language, currency, timezone */}
        <div className="utility-preferences">
          <LanguageSelector className="mr-2" />
          <CurrencySelector className="mr-2" />
          <TimeZoneSelector />
        </div>

        {/* Utility Icons */}
        <div className="utility-icons">
          {/* Notifications */}
          <div className="utility-icon-wrapper">
            <button
              className="utility-icon"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label={t('common:notifications.label', 'Notifications')}
              aria-expanded={showNotifications}
              data-testid="notifications-button"
            >

              <span className="notification-badge">3</span>
            </button>
            {showNotifications && (
              <div className="notifications-dropdown" role="menu">
                <div className="dropdown-header">
                  <h4>{t('common:notifications.title', 'Notifications')}</h4>
                  <Link to="/notifications" onClick={() => setShowNotifications(false)}>
                    {t('common:notifications.view_all', 'View All')}
                  </Link>
                </div>
                <div className="notification-list">
                  <div className="notification-item" role="menuitem">
                    <p><strong>{t('common:notifications.examples.new_deal', 'New Deal Created')}</strong></p>
                    <p className="notification-text">Acme Corp - $50,000</p>
                    <span className="notification-time">5 {t('common:time.minutes_ago', 'minutes ago')}</span>
                  </div>
                  <div className="notification-item" role="menuitem">
                    <p><strong>{t('common:notifications.examples.task_assigned', 'Task Assigned')}</strong></p>
                    <p className="notification-text">{t('common:notifications.examples.follow_up', 'Follow up with client')}</p>
                    <span className="notification-time">1 {t('common:time.hour_ago', 'hour ago')}</span>
                  </div>
                  <div className="notification-item" role="menuitem">
                    <p><strong>{t('common:notifications.examples.work_order_completed', 'Work Order Completed')}</strong></p>
                    <p className="notification-text">{t('common:notifications.examples.work_order_completed_desc', 'WO-1234 completed by John')}</p>
                    <span className="notification-time">2 {t('common:time.hours_ago', 'hours ago')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <Link
            to="/chat"
            className="utility-icon"
            aria-label={t('common:chat', 'Chat')}
            data-testid="chat-button"
          >

          </Link>

          {/* Profile/User Menu */}
          <Link
            to="/settings/user-roles"
            className="utility-icon profile-icon"
            aria-label={t('common:profile.settings', 'User profile and settings')}
            data-testid="profile-button"
          >

          </Link>
        </div>
      </div>
    </div>
  );
};

export default UtilityNavigation;
