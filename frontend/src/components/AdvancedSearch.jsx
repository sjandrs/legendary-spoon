import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, post } from '../api';
import './AdvancedSearch.css';

// Add screen reader only CSS if not already defined
if (typeof document !== 'undefined' && !document.querySelector('#sr-only-styles')) {
  const style = document.createElement('style');
  style.id = 'sr-only-styles';
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  document.head.appendChild(style);
}

const AdvancedSearch = ({ onSearch, onSaveSearch }) => {
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState(searchParams.get('type') || 'global');

  // Initialize filters from URL params but don't add default status filter
  const initialFilters = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_')) {
      initialFilters[key.replace('filter_', '')] = value;
    }
  }
  const [filters, setFilters] = useState(initialFilters);

  const [availableFilters, setAvailableFilters] = useState({});
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort_order') || 'desc');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  useEffect(() => {
    if (searchType !== 'global') {
        loadAvailableFilters();
    }
  }, [searchType]);

  useEffect(() => {
    if (searchParams.toString()) {
        triggerSearch();
    }
  }, []);

  const loadAvailableFilters = async () => {
    try {
      const response = await get(`/api/search/filters/?entity_type=${searchType}`);
      setAvailableFilters(response.data[searchType] || {});
    } catch (_err) {
      console.error('Error loading filters:', _err);
    }
  };

  const triggerSearch = async (offset = 0) => {
    const searchPayload = {
        q: searchQuery,
        type: searchType,
        filters: filters,
        sort_by: sortBy,
        sort_order: sortOrder,
        offset: offset,
        limit: 50
    };
    if (onSearch) {
        setLoading(true);
        try {
            await onSearch(searchPayload);
    } catch (_err) {
      console.error('Search error:', _err);
        } finally {
            setLoading(false);
        }
    }
  };

  const handleQueryChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Get suggestions for queries with at least 2 characters
    if (query.length >= 2) {
      try {
        const response = await get(`/api/search/suggestions/?q=${encodeURIComponent(query)}&type=${searchType}`);
        setSuggestions(response.data.suggestions || []);
        setShowSuggestions(true);
      } catch (_err) {
        console.error('Error getting suggestions:', _err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleDateRangeChange = (filterKey, startDate, endDate) => {
    if (startDate && endDate) {
      setFilters(prev => ({
        ...prev,
        [filterKey]: `${startDate} to ${endDate}`
      }));
    } else if (startDate) {
      setFilters(prev => ({
        ...prev,
        [`${filterKey}__gte`]: startDate
      }));
    } else if (endDate) {
      setFilters(prev => ({
        ...prev,
        [`${filterKey}__lte`]: endDate
      }));
    }
  };

  const handleNumberRangeChange = (filterKey, min, max) => {
    const rangeFilter = {};
    if (min !== null && min !== '') {
      rangeFilter.gte = parseFloat(min);
    }
    if (max !== null && max !== '') {
      rangeFilter.lte = parseFloat(max);
    }

    if (Object.keys(rangeFilter).length > 0) {
      setFilters(prev => ({
        ...prev,
        [filterKey]: rangeFilter
      }));
    } else {
      setFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters[filterKey];
        return newFilters;
      });
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const saveSearch = async (name, description, isPublic = false) => {
    try {
      const response = await post('/api/saved-searches/', {
        name,
        description,
        search_type: searchType,
        search_query: searchQuery,
        filters,
        sort_by: sortBy,
        sort_order: sortOrder,
        is_public: isPublic
      });

      setShowSaveModal(false);
      if (onSaveSearch) {
        onSaveSearch(response.data);
      }
    } catch (_err) {
  console.error('Error saving search:', _err);
    }
  };

  const renderTextFilter = (key, label) => (
    <div key={key} className="filter-group">
      <label>{label}</label>
      <input
        type="text"
        value={filters[key] || ''}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        placeholder={`Filter by ${label.toLowerCase()}`}
      />
    </div>
  );

  const renderChoiceFilter = (key, label, choices) => (
    <div key={key} className="filter-group">
      <label>{label}</label>
      <select
        value={filters[key] || ''}
        onChange={(e) => handleFilterChange(key, e.target.value)}
      >
        <option value="">All {label}</option>
        {choices.map(choice => (
          <option key={choice} value={choice}>{choice}</option>
        ))}
      </select>
    </div>
  );

  const renderDateFilter = (key, label) => (
    <div key={key} className="filter-group date-range">
      <label>{label} Range</label>
      <div className="date-inputs">
        <input
          type="date"
          onChange={(e) => {
            const endDate = filters[key]?.split(' to ')[1] || '';
            handleDateRangeChange(key, e.target.value, endDate);
          }}
          placeholder="From"
        />
        <span>to</span>
        <input
          type="date"
          onChange={(e) => {
            const startDate = filters[key]?.split(' to ')[0] || '';
            handleDateRangeChange(key, startDate, e.target.value);
          }}
          placeholder="To"
        />
      </div>
    </div>
  );

  const renderNumberFilter = (key, label) => (
    <div key={key} className="filter-group number-range">
      <label>{label} Range</label>
      <div className="number-inputs">
        <input
          type="number"
          placeholder="Min"
          onChange={(e) => {
            const currentMax = filters[key]?.lte || null;
            handleNumberRangeChange(key, e.target.value, currentMax);
          }}
        />
        <span>to</span>
        <input
          type="number"
          placeholder="Max"
          onChange={(e) => {
            const currentMin = filters[key]?.gte || null;
            handleNumberRangeChange(key, currentMin, e.target.value);
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="advanced-search">
      <div className="search-header">
        <h3>Advanced Search</h3>
        <div className="search-actions">
          <button
            onClick={() => setShowSaveModal(true)}
            className="btn-save"
            disabled={!searchQuery.trim() && Object.keys(filters).length === 0}
          >
            Save Search
          </button>
          <button onClick={clearFilters} className="btn-clear">
            Clear All
          </button>
        </div>
      </div>

      <div className="search-form">
        <div className="search-main">
          <div className="search-type-selector">
            <label htmlFor="search-type-select" className="sr-only">Search Type</label>
            <select
              id="search-type-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              aria-label="Search type selector"
            >
              <option value="global">Global Search</option>
              <option value="accounts">Accounts</option>
              <option value="contacts">Contacts</option>
              <option value="tasks">Tasks</option>
              <option value="deals">Deals</option>
              <option value="quotes">Quotes</option>
              <option value="invoices">Invoices</option>
            </select>
          </div>

          <div className="search-input-container">
            <label htmlFor="search-input" className="sr-only">Search terms</label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={handleQueryChange}
              placeholder="Enter search terms..."
              className="search-input"
              aria-label="Enter search terms"
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => triggerSearch()}
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchType !== 'global' && (
          <div className="search-options">
            <div className="sort-options">
              <div className="sort-group">
                <label>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="created_at">Created Date</option>
                  <option value="updated_at">Updated Date</option>
                  {searchType === 'tasks' && <option value="due_date">Due Date</option>}
                  {searchType === 'deals' && <option value="value">Value</option>}
                  <option value="name">Name</option>
                </select>
              </div>

              <div className="sort-group">
                <label>Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {Object.keys(availableFilters).length > 0 && (
          <div className="filters-header">
            <h4 onClick={() => setIsFiltersVisible(!isFiltersVisible)}>
              Filters
              <span className={`toggle-arrow ${isFiltersVisible ? 'open' : ''}`}>▼</span>
            </h4>
          </div>
        )}

        {isFiltersVisible && Object.keys(availableFilters).length > 0 && (
          <div className="search-filters">
            <div className="filters-container">
              <div className="filters-grid">
                {availableFilters.text_filters?.map(field =>
                  renderTextFilter(field, field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                )}

                {Object.entries(availableFilters.choice_filters || {}).map(([field, choices]) =>
                  renderChoiceFilter(field, field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), choices)
                )}

                {availableFilters.date_filters?.map(field =>
                  renderDateFilter(field, field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                )}

                {availableFilters.number_filters?.map(field =>
                  renderNumberFilter(field, field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showSaveModal && (
        <SaveSearchModal
          onSave={saveSearch}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

const SaveSearchModal = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name, description, isPublic);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="save-search-title" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="save-search-title">Save Search</h3>
          <button onClick={onClose} className="close-btn" aria-label="Close modal">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="save-search-form">
          <div className="form-group">
            <label htmlFor="search-name">Name *</label>
            <input
              id="search-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter search name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="search-description">Description</label>
            <textarea
              id="search-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this search (optional)"
              rows="3"
            />
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Make this search public (available to all users)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-save" data-testid="save-search-submit">
              Save Search
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSearch;
