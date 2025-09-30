import React, { useState } from 'react';
import { post } from '../api';
import './SearchResults.css';

const SearchResults = ({ results, onBulkAction, onLoadMore }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const handleSelectAll = (type) => {
    const typeResults = results.results[type] || results.results;
    const allIds = typeResults.map(item => `${type}:${item.id}`);

    if (selectedItems.some(id => id.startsWith(`${type}:`))) {
      // Deselect all of this type
      setSelectedItems(prev => prev.filter(id => !id.startsWith(`${type}:`)));
    } else {
      // Select all of this type
      setSelectedItems(prev => [...prev, ...allIds]);
    }
  };

  const handleSelectItem = (type, itemId) => {
    const fullId = `${type}:${itemId}`;
    setSelectedItems(prev =>
      prev.includes(fullId)
        ? prev.filter(id => id !== fullId)
        : [...prev, fullId]
    );
  };

  const isSelected = (type, itemId) => {
    return selectedItems.includes(`${type}:${itemId}`);
  };

  const handleBulkAction = () => {
    if (bulkAction && selectedItems.length > 0) {
      setShowBulkModal(true);
    }
  };

  const getResultIcon = (type) => {
    const icons = {
      account: '🏢',
      contact: '👤',
      task: '📋',
      deal: '💼',
      quote: '📄',
      invoice: '🧾'
    };
    return icons[type] || '📄';
  };

  const getStatusBadge = (status) => {
    if (!status) return null;

    const statusColors = {
      completed: '#28a745',
      pending: '#ffc107',
      in_progress: '#17a2b8',
      cancelled: '#6c757d',
      sent: '#007bff',
      paid: '#28a745',
      overdue: '#dc3545',
      draft: '#6c757d'
    };

    return (
      <span
        className="status-badge"
        style={{ backgroundColor: statusColors[status] || '#6c757d' }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return null;

    const priorityColors = {
      urgent: '#dc3545',
      high: '#fd7e14',
      medium: '#007bff',
      low: '#28a745'
    };

    return (
      <span
        className="priority-badge"
        style={{ backgroundColor: priorityColors[priority] || '#6c757d' }}
      >
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const renderResultItem = (item, type, index) => (
    <div key={`${type}-${item.id}`} className={`result-item ${index % 2 === 0 ? 'result-item-even' : ''}`}>
      <div className="result-checkbox">
        <input
          type="checkbox"
          checked={isSelected(type, item.id)}
          onChange={() => handleSelectItem(type, item.id)}
        />
      </div>

      <div className="result-content">
        <div className="result-header">
          <h4 className="result-title">
            <a href={item.url} className="result-link">
              {getResultIcon(type)} {item.title}
            </a>
          </h4>
          <div className="result-badges">
            {getStatusBadge(item.status)}
            {getPriorityBadge(item.priority)}
          </div>
        </div>

        <div className="result-details">
          <span className="result-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>

          {item.email && (
            <span className="result-email">📧 {item.email}</span>
          )}

          {item.phone && (
            <span className="result-phone">📞 {item.phone}</span>
          )}

          {item.value && (
            <span className="result-value">💰 {formatCurrency(item.value)}</span>
          )}

          {item.due_date && (
            <span className={`result-date ${new Date(item.due_date) < new Date() ? 'overdue' : ''}`}>
              📅 Due: {formatDate(item.due_date)}
            </span>
          )}

          {item.created_at && (
            <span className="result-date">
              📅 Created: {formatDate(item.created_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderResultSection = (type, items) => (
    <div key={type} className="result-section">
      <div className="section-header">
        <div className="section-title">
          <input
            type="checkbox"
            onChange={() => handleSelectAll(type)}
            className="select-all-checkbox"
          />
          <h3>
            {getResultIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
            <span className="result-count">({items.length})</span>
          </h3>
        </div>
      </div>

      <div className="result-items">
        {items.map((item, index) => renderResultItem(item, type, index))}
      </div>
    </div>
  );

  if (!results || (!results.results && !results.error)) {
    return (
      <div className="search-results">
        <div className="no-results">
          <p>Enter search terms or filters to find results</p>
        </div>
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="search-results">
        <div className="error-message">
          <p>Error: {results.error}</p>
        </div>
      </div>
    );
  }

  const isGlobalSearch = typeof results.results === 'object' && !Array.isArray(results.results);
  const hasResults = isGlobalSearch
    ? Object.values(results.results).some(items => items.length > 0)
    : results.results.length > 0;

  if (!hasResults) {
    return (
      <div className="search-results">
        <div className="no-results">
          <p>No results found for your search.</p>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <div className="results-summary">
          <h3>Search Results ({results.total_count} total)</h3>
          {results.query && <p>Searching for: "<strong>{results.query}</strong>"</p>}
        </div>

        {selectedItems.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              {selectedItems.length} selected
            </span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <option value="">Choose action...</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="bulk-action-btn"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="results-content">
        {isGlobalSearch ? (
          Object.entries(results.results).map(([type, items]) =>
            items.length > 0 ? renderResultSection(type, items) : null
          )
        ) : (
          <div className="result-section">
            <div className="result-items">
              {results.results.map((item, index) => renderResultItem(item, results.type || 'item', index))}
            </div>
          </div>
        )}
      </div>

      {results.total_count > results.results.length && onLoadMore && (
        <div className="load-more">
          <button onClick={onLoadMore} className="load-more-btn">
            Load More Results
          </button>
        </div>
      )}

      {showBulkModal && (
        <BulkActionModal
          action={bulkAction}
          selectedItems={selectedItems}
          onConfirm={(actionData) => {
            onBulkAction(bulkAction, selectedItems, actionData);
            setShowBulkModal(false);
            setSelectedItems([]);
            setBulkAction('');
          }}
          onCancel={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
};

const BulkActionModal = ({ action, selectedItems, onConfirm, onCancel }) => {
  const [actionData, setActionData] = useState({});

  const handleConfirm = () => {
    onConfirm(actionData);
  };

  const renderActionForm = () => {
    switch (action) {
      case 'update':
        return (
          <div className="bulk-form">
            <h4>Bulk Update</h4>
            <p>Update {selectedItems.length} selected items</p>
            <div className="form-group">
              <label>Status:</label>
              <select
                value={actionData.status || ''}
                onChange={(e) => setActionData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Keep current</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        );
      case 'delete':
        return (
          <div className="bulk-form">
            <h4>Bulk Delete</h4>
            <p className="warning">
              ⚠️ Are you sure you want to delete {selectedItems.length} selected items?
              This action cannot be undone.
            </p>
          </div>
        );
      case 'export':
        return (
          <div className="bulk-form">
            <h4>Export Data</h4>
            <p>Export {selectedItems.length} selected items</p>
            <div className="form-group">
              <label>Format:</label>
              <select
                value={actionData.format || 'csv'}
                onChange={(e) => setActionData(prev => ({ ...prev, format: e.target.value }))}
              >
                <option value="csv">CSV</option>
                <option value="xlsx">Excel</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirm Bulk Action</h3>
          <button onClick={onCancel} className="close-btn">&times;</button>
        </div>

        <div className="modal-body">
          {renderActionForm()}
        </div>

        <div className="modal-actions">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`btn-confirm ${action === 'delete' ? 'btn-danger' : ''}`}
          >
            Confirm {action.charAt(0).toUpperCase() + action.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
