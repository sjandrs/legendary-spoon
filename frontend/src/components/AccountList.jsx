import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';
import LoadingSkeleton from './LoadingSkeleton'; // TASK-083
import './AccountList.css';

/**
 * AccountList - Display and manage company accounts
 * Features: Search, filter, pagination, and account creation
 */
const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadAccounts();
  }, [currentPage, searchQuery]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * itemsPerPage;
      let url = `/api/accounts/?limit=${itemsPerPage}&offset=${offset}`;

      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const response = await get(url);
      setAccounts(response.data.results || response.data);

      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / itemsPerPage));
      }

      setError(null);
    } catch (_err) {
      setError('Failed to load accounts. Please try again.');
      console.error('Error loading accounts:', _err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadAccounts();
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') {
      setCurrentPage(1);
    }
  };

  // TASK-083: Loading skeleton for better perceived performance
  if (loading) {
    return (
      <div className="account-list-container">
        <div className="account-list-header">
          <h1>Accounts</h1>
        </div>
        {/* Accessible loading announcement for tests and screen readers */}
        <p style={{position:'absolute', left:'-10000px'}} aria-live="polite">Loading accounts...</p>
        <LoadingSkeleton variant="table" count={5} />
      </div>
    );
  }

  return (
    <div className="account-list-container">
      <div className="account-list-header">
        <h1>Accounts</h1>
        <Link to="/accounts/new" className="btn btn-primary">
          + New Account
        </Link>
      </div>

      <div className="account-list-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search accounts by name, industry, or website..."
            className="search-input"
            data-testid="account-search-input"
          />
          <button type="submit" className="btn btn-search">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>No accounts found.</p>
          <Link to="/accounts/new" className="btn btn-primary">
            Create Your First Account
          </Link>
        </div>
      ) : (
        <>
          <table className="account-table striped-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Industry</th>
                <th>Website</th>
                <th>Owner</th>
                <th>Contacts</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} data-testid={`account-row-${account.id}`}>
                  <td>
                    <Link to={`/accounts/${account.id}`} className="account-link">
                      {account.name}
                    </Link>
                  </td>
                  <td>{account.industry || '-'}</td>
                  <td>
                    {account.website ? (
                      <a href={account.website} target="_blank" rel="noopener noreferrer">
                        {account.website}
                      </a>
                    ) : '-'}
                  </td>
                  <td>{
                    typeof account.owner_name === 'string' ? account.owner_name :
                    (typeof account.owner === 'string' ? account.owner :
                      (account.owner && account.owner.username) ? account.owner.username : '-')
                  }</td>
                  <td>{account.contact_count || 0}</td>
                  <td>{new Date(account.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/accounts/${account.id}`} className="btn btn-sm btn-view">
                        View
                      </Link>
                      <Link to={`/accounts/${account.id}/edit`} className="btn btn-sm btn-edit">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-pagination"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountList;
