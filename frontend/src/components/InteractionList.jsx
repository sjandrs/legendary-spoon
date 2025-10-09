import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import LoadingSkeleton from './LoadingSkeleton'; // TASK-083
import './InteractionList.css';

function InteractionList() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInteractions();
  }, [typeFilter, currentPage]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        interaction_type: typeFilter || undefined,
      };
      const response = await api.get('/api/interactions/', { params });

      if (response.data.results) {
        setInteractions(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 20));
      } else {
        setInteractions(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching interactions:', err);
      setError('Failed to load interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const getTypeIcon = (type) => {
    const icons = {
      call: '📞',
      email: '✉️',
      meeting: '👥',
      note: '📝',
    };
    return icons[type] || '💬';
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      call: { label: 'Call', className: 'type-badge call' },
      email: { label: 'Email', className: 'type-badge email' },
      meeting: { label: 'Meeting', className: 'type-badge meeting' },
      note: { label: 'Note', className: 'type-badge note' },
    };
    const typeInfo = typeMap[type] || { label: type, className: 'type-badge' };
    return <span className={typeInfo.className}>{typeInfo.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // TASK-083: Loading skeleton for better perceived performance
  if (loading && interactions.length === 0) {
    return (
      <div className="interaction-list-container">
        <div className="interaction-list-header">
          <h1>Interactions</h1>
        </div>
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  return (
    <div className="interaction-list-container">
      <div className="interaction-list-header">
        <h1>Interactions</h1>
        <Link to="/interactions/new" className="btn-primary">
          Log Interaction
        </Link>
      </div>

      <div className="interaction-list-controls">
        <div className="filter-group">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={handleTypeChange}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="call">Calls</option>
            <option value="email">Emails</option>
            <option value="meeting">Meetings</option>
            <option value="note">Notes</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && interactions.length === 0 ? (
        <div className="empty-state">
          <p>No interactions found.</p>
          <Link to="/interactions/new" className="btn-primary">
            Log Your First Interaction
          </Link>
        </div>
      ) : (
        <>
          <div className="interaction-timeline">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="interaction-card">
                <div className="interaction-icon">
                  {getTypeIcon(interaction.interaction_type)}
                </div>
                <div className="interaction-content">
                  <div className="interaction-header">
                    <div className="interaction-title">
                      {getTypeBadge(interaction.interaction_type)}
                      <span className="interaction-subject">
                        {interaction.subject || 'No subject'}
                      </span>
                    </div>
                    <span className="interaction-time">
                      {formatDate(interaction.interaction_date)}
                    </span>
                  </div>

                  <div className="interaction-meta">
                    {interaction.contact && (
                      <span className="meta-item">
                        <strong>Contact:</strong>{' '}
                        <Link to={`/contacts/${interaction.contact}`} className="link">
                          {interaction.contact_name}
                        </Link>
                      </span>
                    )}
                    {interaction.account && (
                      <span className="meta-item">
                        <strong>Account:</strong>{' '}
                        <Link to={`/accounts/${interaction.account}`} className="link">
                          {interaction.account_name}
                        </Link>
                      </span>
                    )}
                    <span className="meta-item">
                      <strong>Date:</strong> {formatDateTime(interaction.interaction_date)}
                    </span>
                  </div>

                  {interaction.notes && (
                    <div className="interaction-notes">
                      {interaction.notes.length > 200
                        ? `${interaction.notes.substring(0, 200)}...`
                        : interaction.notes}
                    </div>
                  )}

                  <div className="interaction-footer">
                    <span className="logged-by">
                      Logged by {interaction.user_name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-pagination"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InteractionList;
