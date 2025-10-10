import React, { useState, useEffect } from 'react';
import api from '../api';

const TaxReport = () => {
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchTaxData();
  }, [selectedYear]);

  const fetchTaxData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tax-report/?year=${selectedYear}`);
      setTaxData(response.data);
    } catch (_err) {
      setError('Failed to load tax data');
      console.error('Error fetching tax data:', _err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let year = currentYear - 2; year <= currentYear; year++) {
      options.push(year);
    }
    return options;
  };

  if (loading) return <div>Loading tax reports...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="tax-report">
      <h2>Tax Reporting - {selectedYear}</h2>

      <div className="year-selector">
        <label htmlFor="year-select">Tax Year: </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {generateYearOptions().map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {taxData && (
        <div className="tax-sections">
          {/* 1099 Contractor Payments */}
          <div className="tax-section">
            <h3>1099 Contractor Payments</h3>
            <table className="striped-table">
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>SSN/EIN</th>
                  <th>Total Payments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxData.contractorPayments.map(contractor => (
                  <tr key={contractor.id}>
                    <td>{contractor.name}</td>
                    <td>{contractor.tax_id || 'Not provided'}</td>
                    <td className="text-right">{formatCurrency(contractor.total_payments)}</td>
                    <td>
                      {contractor.total_payments >= 600 && (
                        <button className="btn btn-sm btn-primary">
                          Generate 1099
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tax-note">
              Note: 1099 forms are required for payments of $600 or more to contractors.
            </p>
          </div>

          {/* Sales Tax Collected */}
          <div className="tax-section">
            <h3>Sales Tax Collected</h3>
            <div className="tax-summary">
              <div className="summary-item">
                <strong>Total Sales:</strong> {formatCurrency(taxData.salesTax.total_sales)}
              </div>
              <div className="summary-item">
                <strong>Tax Collected:</strong> {formatCurrency(taxData.salesTax.tax_collected)}
              </div>
              <div className="summary-item">
                <strong>Tax Rate:</strong> {(taxData.salesTax.tax_rate * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Business Expenses by Category */}
          <div className="tax-section">
            <h3>Business Expenses</h3>
            <table className="striped-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Amount</th>
                  <th>Percentage of Total</th>
                </tr>
              </thead>
              <tbody>
                {taxData.expensesByCategory.map(category => (
                  <tr key={category.category}>
                    <td>{category.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="text-right">{formatCurrency(category.total)}</td>
                    <td className="text-right">
                      {((category.total / taxData.totalExpenses) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total Expenses</strong></td>
                  <td className="text-right"><strong>{formatCurrency(taxData.totalExpenses)}</strong></td>
                  <td className="text-right"><strong>100%</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tax Summary */}
          <div className="tax-section">
            <h3>Tax Year Summary</h3>
            <div className="tax-summary-grid">
              <div className="summary-card">
                <h4>Revenue</h4>
                <div className="amount">{formatCurrency(taxData.totalRevenue)}</div>
              </div>
              <div className="summary-card">
                <h4>Expenses</h4>
                <div className="amount">{formatCurrency(taxData.totalExpenses)}</div>
              </div>
              <div className="summary-card">
                <h4>Net Income</h4>
                <div className={`amount ${taxData.netIncome >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(taxData.netIncome)}
                </div>
              </div>
              <div className="summary-card">
                <h4>Tax Liability (est.)</h4>
                <div className="amount">{formatCurrency(taxData.estimatedTax)}</div>
                <small>Based on 25% effective rate</small>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="tax-section">
            <h3>Export Tax Data</h3>
            <div className="export-buttons">
              <button className="btn btn-secondary" onClick={() => window.print()}>
                Print Report
              </button>
              <button className="btn btn-secondary" onClick={() => {
                // Export to CSV functionality would go here
                alert('CSV export functionality to be implemented');
              }}>
                Export to CSV
              </button>
              <button className="btn btn-secondary" onClick={() => {
                // Export to PDF functionality would go here
                alert('PDF export functionality to be implemented');
              }}>
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxReport;
