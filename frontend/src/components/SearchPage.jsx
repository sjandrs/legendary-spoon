import React, { useState } from 'react';
import AdvancedSearch from './AdvancedSearch';
import SearchResults from './SearchResults';
import { get, post } from '../api';
import './SearchPage.css';

const SearchPage = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(null);

  const handleSearch = async (searchParams) => {
    console.log('Executing search with params:', searchParams); // Added for debugging
    setLoading(true);
    setCurrentQuery(searchParams);

    try {
      const params = new URLSearchParams();
      if (searchParams.q) params.append('q', searchParams.q);
      if (searchParams.type) params.append('type', searchParams.type);
      if (searchParams.sort_by) params.append('sort_by', searchParams.sort_by);
      if (searchParams.sort_order) params.append('sort_order', searchParams.sort_order);
      if (searchParams.offset) params.append('offset', searchParams.offset);
      if (searchParams.limit) params.append('limit', searchParams.limit);

      if (searchParams.filters) {
        Object.entries(searchParams.filters).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                params.append(`filter_${key}`, value);
            }
        });
      }

      const response = await get(`/api/search/?${params.toString()}`);

      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({
        error: 'Search failed. Please try again.',
        results: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action, selectedItems, actionData) => {
    setLoading(true);

    try {
      const response = await post('/api/search/bulk-operations/', {
        action,
        items: selectedItems,
        data: actionData
      });

      // Refresh search results
      if (currentQuery) {
        await handleSearch(currentQuery);
      }

      // Show success message
      alert(`Bulk ${action} completed successfully!`);
    } catch (error) {
      console.error('Bulk action error:', error);
      alert(`Bulk ${action} failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!currentQuery) return;

    setLoading(true);

    try {
      const offset = searchResults?.results?.length || 0;
      const params = { ...currentQuery, offset };

      let response;
      if (currentQuery.query && !currentQuery.filters) {
        response = await post('/api/search/', params);
      } else {
        response = await post('/api/search/advanced/', params);
      }

      setSearchResults(prev => ({
        ...prev,
        results: prev.results.concat(response.results)
      }));
    } catch (error) {
      console.error('Load more error:', error);
      alert('Failed to load more results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-content">
        <div className="search-panel">
          <AdvancedSearch
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        <div className="results-panel">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          <SearchResults
            results={searchResults}
            onBulkAction={handleBulkAction}
            onLoadMore={
              searchResults &&
              searchResults.total_count > (searchResults.results?.length || 0)
                ? handleLoadMore
                : null
            }
          />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
