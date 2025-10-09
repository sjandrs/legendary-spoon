import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './QuoteDetail.css';

function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchQuoteDetails();
  }, [id]);

  const fetchQuoteDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quotes/${id}/`);
      setQuote(response.data);

      // Fetch line items
      const itemsResponse = await api.get(`/api/quotes/${id}/items/`);
      setLineItems(itemsResponse.data);

      setError(null);
    } catch (err) {
      console.error('Error fetching quote details:', err);
      setError('Failed to load quote details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.del(`/api/quotes/${id}/`);
      navigate('/quotes');
    } catch (err) {
      console.error('Error deleting quote:', err);
      setError('Failed to delete quote. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const handleConvertToDeal = async () => {
    if (converting) return;

    try {
      setConverting(true);
      const response = await api.post(`/api/quotes/${id}/convert-to-deal/`);
      alert(`Quote successfully converted to deal! Deal ID: ${response.data.deal_id}`);
      navigate(`/deals/${response.data.deal_id}`);
    } catch (err) {
      console.error('Error converting quote:', err);
      setError('Failed to convert quote to deal. Please try again.');
    } finally {
      setConverting(false);
    }
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
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * ((quote?.tax_rate || 0) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - (quote?.discount || 0);
  };

  if (loading) {
    return (
      <div className="quote-detail-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quote-detail-container">
        <div className="error-message">{error}</div>
        <Link to="/quotes" className="btn-back">
          Back to Quotes
        </Link>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="quote-detail-container">
        <p>Quote not found.</p>
        <Link to="/quotes" className="btn-back">
          Back to Quotes
        </Link>
      </div>
    );
  }

  return (
    <div className="quote-detail-container">
      <div className="quote-detail-header">
        <div className="header-left">
          <Link to="/quotes" className="btn-back">
            ← Back to Quotes
          </Link>
          <h1>{quote.name || `Quote #${quote.id}`}</h1>
          {getStatusBadge(quote.status)}
        </div>
        <div className="header-actions">
          {quote.status === 'accepted' && quote.status !== 'converted' && (
            <button
              onClick={handleConvertToDeal}
              disabled={converting}
              className="btn-convert"
            >
              {converting ? 'Converting...' : 'Convert to Deal'}
            </button>
          )}
          <Link to={`/quotes/${id}/edit`} className="btn-edit">
            Edit
          </Link>
          <button onClick={() => setShowDeleteModal(true)} className="btn-delete">
            Delete
          </button>
        </div>
      </div>

      <div className="quote-detail-content">
        <div className="info-section">
          <h2>Quote Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Account:</span>
              <span className="info-value">
                {quote.account ? (
                  <Link to={`/accounts/${quote.account}`} className="link">
                    {quote.account_name}
                  </Link>
                ) : (
                  'N/A'
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Contact:</span>
              <span className="info-value">
                {quote.contact ? (
                  <Link to={`/contacts/${quote.contact}`} className="link">
                    {quote.contact_name}
                  </Link>
                ) : (
                  'N/A'
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Created Date:</span>
              <span className="info-value">{formatDate(quote.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Valid Until:</span>
              <span className="info-value">{formatDate(quote.valid_until)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Owner:</span>
              <span className="info-value">{quote.owner_name || 'N/A'}</span>
            </div>
            {quote.converted_deal && (
              <div className="info-item">
                <span className="info-label">Converted Deal:</span>
                <span className="info-value">
                  <Link to={`/deals/${quote.converted_deal}`} className="link">
                    View Deal
                  </Link>
                </span>
              </div>
            )}
          </div>
          {quote.notes && (
            <div className="notes-section">
              <h3>Notes</h3>
              <p>{quote.notes}</p>
            </div>
          )}
        </div>

        <div className="line-items-section">
          <h2>Line Items</h2>
          {lineItems.length === 0 ? (
            <p className="empty-message">No line items added yet.</p>
          ) : (
            <div className="line-items-table-wrapper">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>Product/Service</th>
                    <th>Description</th>
                    <th className="align-right">Quantity</th>
                    <th className="align-right">Unit Price</th>
                    <th className="align-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="product-name">{item.product_name}</td>
                      <td>{item.description || '-'}</td>
                      <td className="align-right">{item.quantity}</td>
                      <td className="align-right">{formatCurrency(item.unit_price)}</td>
                      <td className="align-right amount-cell">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="align-right"><strong>Subtotal:</strong></td>
                    <td className="align-right amount-cell">{formatCurrency(calculateSubtotal())}</td>
                  </tr>
                  {quote.tax_rate > 0 && (
                    <tr>
                      <td colSpan="4" className="align-right">
                        <strong>Tax ({quote.tax_rate}%):</strong>
                      </td>
                      <td className="align-right amount-cell">{formatCurrency(calculateTax())}</td>
                    </tr>
                  )}
                  {quote.discount > 0 && (
                    <tr>
                      <td colSpan="4" className="align-right"><strong>Discount:</strong></td>
                      <td className="align-right amount-cell">-{formatCurrency(quote.discount)}</td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan="4" className="align-right"><strong>Total:</strong></td>
                    <td className="align-right amount-cell total-amount">
                      {formatCurrency(calculateTotal())}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this quote? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-delete-confirm">
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuoteDetail;
