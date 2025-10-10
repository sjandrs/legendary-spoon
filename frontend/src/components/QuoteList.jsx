import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import LoadingSkeleton from './LoadingSkeleton'; // TASK-083
import './QuoteList.css';

function QuoteList() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchQuotes();
  }, [searchQuery, statusFilter, currentPage]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      };
      const response = await api.get('/api/quotes/', { params });

      if (response.data.results) {
        setQuotes(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 20));
      } else {
        setQuotes(response.data);
      }
      setError(null);
    } catch (_err) {
      console.error('Error fetching quotes:', _err);
      setError('Failed to load quotes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQuotes();
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: 'Draft', className: 'status-badge draft' },
      sent: { label: 'Sent', className: 'status-badge sent' },
      accepted: { label: 'Accepted', className: 'status-badge accepted' },
      rejected: { label: 'Rejected', className: 'status-badge rejected' },
      converted: { label: 'Converted', className: 'status-badge converted' },
    };
    const statusInfo = statusMap[status] || { label: status, className: 'status-badge' };
    return <span className={statusInfo.className}>{statusInfo.label}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // TASK-083: Loading skeleton for better perceived performance
  if (loading && quotes.length === 0) {
    return (
      <div className="quote-list-container">
        <div className="quote-list-header">
          <h1>Quotes</h1>
        </div>
        <LoadingSkeleton variant="table" count={5} />
      </div>
    );
  }

  return (
    <div className="quote-list-container">
      <div className="quote-list-header">
        <h1>Quotes</h1>
        <Link to="/quotes/new" className="btn-primary">
          Create Quote
        </Link>
      </div>

      <div className="quote-list-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search quotes by name or account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">
            Search
          </button>
        </form>

        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusChange}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="converted">Converted</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!loading && quotes.length === 0 ? (
        <div className="empty-state">
          <p>No quotes found.</p>
          <Link to="/quotes/new" className="btn-primary">
            Create Your First Quote
          </Link>
        </div>
      ) : (
        <>
          <div className="quote-table-wrapper">
            <table className="quote-table striped-table">
              <thead>
                <tr>
                  <th>Quote Name</th>
                  <th>Account</th>
                  <th>Contact</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <Link to={`/quotes/${quote.id}`} className="quote-link">
                        {quote.name || `Quote #${quote.id}`}
                      </Link>
                    </td>
                    <td>{quote.account_name || 'N/A'}</td>
                    <td>{quote.contact_name || 'N/A'}</td>
                    <td className="amount-cell">{formatCurrency(quote.total_amount)}</td>
                    <td>{getStatusBadge(quote.status)}</td>
                    <td>{formatDate(quote.valid_until)}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/quotes/${quote.id}`} className="btn-view">
                          View
                        </Link>
                        <Link to={`/quotes/${quote.id}/edit`} className="btn-edit">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default QuoteList;
