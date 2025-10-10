import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { get, del } from '../api';
import './AccountList.css';

/**
 * AccountDetail - Display detailed account information
 * Shows contacts, deals, and activity related to an account
 */
const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAccountDetails();
  }, [id]);

  const loadAccountDetails = async () => {
    try {
      setLoading(true);
      const [accountRes, contactsRes, dealsRes] = await Promise.all([
        get(`/api/accounts/${id}/`),
        get(`/api/contacts/?account=${id}`),
        get(`/api/deals/?account=${id}`)
      ]);

      setAccount(accountRes.data);
      setContacts(contactsRes.data.results || contactsRes.data);
      setDeals(dealsRes.data.results || dealsRes.data);
      setError(null);
    } catch (_err) {
      setError('Failed to load account details.');
      console.error('Error loading account:', _err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await del(`/api/accounts/${id}/`);
        navigate('/accounts');
      } catch (_err) {
        alert('Failed to delete account. It may have related records.');
        console.error('Error deleting account:', _err);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading account details...</div>;
  }

  if (error || !account) {
    return (
      <div className="error-container">
        <p className="error-message">{error || 'Account not found'}</p>
        <Link to="/accounts" className="btn btn-primary">Back to Accounts</Link>
      </div>
    );
  }

  return (
    <div className="account-detail-container">
      <div className="detail-header">
        <div>
          <h1>{account.name}</h1>
          <p className="account-meta">
            Created {new Date(account.created_at).toLocaleDateString()} |
            Owner: {account.owner_name || account.owner}
          </p>
        </div>
        <div className="detail-actions">
          <Link to={`/accounts/${id}/edit`} className="btn btn-primary">
            Edit Account
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            Delete
          </button>
          <Link to="/accounts" className="btn btn-secondary">
            Back to List
          </Link>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Industry:</label>
              <span>{account.industry || 'Not specified'}</span>
            </div>
            <div className="info-item">
              <label>Website:</label>
              <span>
                {account.website ? (
                  <a href={account.website} target="_blank" rel="noopener noreferrer">
                    {account.website}
                  </a>
                ) : 'Not specified'}
              </span>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <span>{account.phone || 'Not specified'}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{account.email || 'Not specified'}</span>
            </div>
            <div className="info-item full-width">
              <label>Address:</label>
              <span>{account.billing_address || 'Not specified'}</span>
            </div>
            {account.description && (
              <div className="info-item full-width">
                <label>Description:</label>
                <span>{account.description}</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>Contacts ({contacts.length})</h2>
            <Link to={`/contacts/new?account=${id}`} className="btn btn-sm btn-primary">
              + Add Contact
            </Link>
          </div>
          {contacts.length === 0 ? (
            <p className="empty-message">No contacts for this account yet.</p>
          ) : (
            <table className="striped-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => (
                  <tr key={contact.id}>
                    <td>
                      <Link to={`/contacts/${contact.id}`}>
                        {contact.first_name} {contact.last_name}
                      </Link>
                    </td>
                    <td>{contact.email || '-'}</td>
                    <td>{contact.phone || '-'}</td>
                    <td>
                      <Link to={`/contacts/${contact.id}`} className="btn btn-sm btn-view">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>Deals ({deals.length})</h2>
            <Link to={`/deals/new?account=${id}`} className="btn btn-sm btn-primary">
              + Add Deal
            </Link>
          </div>
          {deals.length === 0 ? (
            <p className="empty-message">No deals for this account yet.</p>
          ) : (
            <table className="striped-table">
              <thead>
                <tr>
                  <th>Deal Name</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Close Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map(deal => (
                  <tr key={deal.id}>
                    <td>
                      <Link to={`/deals/${deal.id}`}>{deal.name}</Link>
                    </td>
                    <td>
                      <span className={`status-badge status-${deal.stage?.toLowerCase()}`}>
                        {deal.stage}
                      </span>
                    </td>
                    <td>${deal.value ? Number(deal.value).toLocaleString() : '0'}</td>
                    <td>{deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <Link to={`/deals/${deal.id}`} className="btn btn-sm btn-view">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetail;
