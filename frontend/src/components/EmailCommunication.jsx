import React, { useState, useEffect } from 'react';
import { sendInvoiceEmail, sendOverdueReminders, getOverdueInvoices } from '../api';
import './EmailCommunication.css';

const EmailCommunication = () => {
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResults, setEmailResults] = useState(null);

  useEffect(() => {
    fetchOverdueInvoices();
  }, []);

  const fetchOverdueInvoices = async () => {
    try {
      setLoading(true);
      const response = await getOverdueInvoices();
      setOverdueInvoices(response.data);
    } catch (err) {
      setError('Failed to fetch overdue invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoiceEmail = async (invoiceId) => {
    try {
      setSendingEmail(true);
      await sendInvoiceEmail(invoiceId);
      alert('Invoice email sent successfully!');
      fetchOverdueInvoices(); // Refresh the list
    } catch (err) {
      setError('Failed to send invoice email');
      console.error(err);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendOverdueReminders = async () => {
    try {
      setSendingEmail(true);
      const response = await sendOverdueReminders();
      setEmailResults(response.data);
      alert(`Sent ${response.data.sent} reminders, ${response.data.failed} failed`);
      fetchOverdueInvoices(); // Refresh the list
    } catch (err) {
      setError('Failed to send overdue reminders');
      console.error(err);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div>Loading email communication...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="email-communication">
      <div className="email-header">
        <h1>Email Communication</h1>
        <p>Manage automated customer communications for invoices and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="communication-summary">
        <div className="summary-card">
          <h3>Overdue Invoices</h3>
          <p className="summary-value warning">{overdueInvoices.length}</p>
          <p className="summary-label">Require attention</p>
        </div>
        <div className="summary-card">
          <h3>Last Reminder Batch</h3>
          <p className="summary-value">
            {emailResults ? `${emailResults.sent}/${emailResults.sent + emailResults.failed}` : 'N/A'}
          </p>
          <p className="summary-label">Sent/Total</p>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bulk-actions">
        <h2>Bulk Email Actions</h2>
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={handleSendOverdueReminders}
            disabled={sendingEmail || overdueInvoices.length === 0}
          >
            {sendingEmail ? 'Sending...' : `Send Overdue Reminders (${overdueInvoices.length})`}
          </button>
        </div>
        {emailResults && (
          <div className="email-results">
            <h3>Last Batch Results</h3>
            <p>Sent: {emailResults.sent} | Failed: {emailResults.failed}</p>
            <p>{emailResults.message}</p>
          </div>
        )}
      </div>

      {/* Overdue Invoices List */}
      <div className="overdue-invoices">
        <h2>Overdue Invoices</h2>
        {overdueInvoices.length === 0 ? (
          <div className="no-overdue">
            <p>🎉 No overdue invoices! All payments are up to date.</p>
          </div>
        ) : (
          <div className="striped-table">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Work Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Helper function for work order display */}
                {overdueInvoices.map(invoice => {
                  const dueDate = new Date(invoice.due_date);
                  const today = new Date();
                  const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

                  const getWorkOrderDisplay = (invoice) => {
                    if (invoice.work_order?.project?.title) {
                      return invoice.work_order.project.title;
                    }
                    if (invoice.work_order?.description) {
                      return invoice.work_order.description;
                    }
                    return 'N/A';
                  };

                  const getCustomerDisplay = (invoice) => {
                    const contact = invoice.work_order?.project?.contact;
                    if (contact) {
                      return `${contact.first_name} ${contact.last_name}`;
                    }
                    return 'N/A';
                  };

                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.id}</td>
                      <td>{getWorkOrderDisplay(invoice)}</td>
                      <td>{getCustomerDisplay(invoice)}</td>
                      <td>${invoice.total_amount}</td>
                      <td>{dueDate.toLocaleDateString()}</td>
                      <td>
                        <span className={`days-overdue ${daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'warning' : 'mild'}`}>
                          {daysOverdue} days
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => handleSendInvoiceEmail(invoice.id)}
                          disabled={sendingEmail}
                        >
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Email Templates Info */}
      <div className="email-templates">
        <h2>Email Templates</h2>
        <div className="template-info">
          <div className="template-card">
            <h3>Invoice Email</h3>
            <p>Sent when generating new invoices or manually requested.</p>
            <ul>
              <li>Includes invoice details and payment instructions</li>
              <li>Automatically attaches PDF if available</li>
              <li>CC'd to project owner for tracking</li>
            </ul>
          </div>
          <div className="template-card">
            <h3>Overdue Reminder</h3>
            <p>Sent for invoices past due date.</p>
            <ul>
              <li>Includes payment terms and overdue amount</li>
              <li>Escalation language based on days overdue</li>
              <li>Multiple reminder levels available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailCommunication;
