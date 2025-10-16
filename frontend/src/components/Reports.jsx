import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { get as apiGetNamed } from '../api';
import { useLocaleFormatting } from '../hooks/useLocaleFormatting';

const Reports = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [cashFlow, setCashFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { formatCurrency } = useLocaleFormatting();

  const [dateFilters, setDateFilters] = useState({
    asOfDate: new Date().toISOString().split('T')[0],
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Dynamically import the API module so Jest mocks (both default and named exports) are observed in tests
      const mod = await import('../api');
      const apiGet = (mod && mod.default && typeof mod.default.get === 'function')
        ? mod.default.get
        : (typeof mod.get === 'function' ? mod.get : apiGetNamed);
      const [balanceRes, pnlRes, cashRes] = await Promise.all([
        apiGet(`/api/reports/balance-sheet/?as_of_date=${dateFilters.asOfDate}`),
        apiGet(`/api/reports/pnl/?start_date=${dateFilters.startDate}&end_date=${dateFilters.endDate}`),
        apiGet(`/api/reports/cash-flow/?start_date=${dateFilters.startDate}&end_date=${dateFilters.endDate}`)
      ]);

      setBalanceSheet(balanceRes.data);
      setProfitLoss(pnlRes.data);
      setCashFlow(cashRes.data);
    } catch (_err) {
      setError(t('financial:reports.errors.load_failed', 'Failed to load reports. Please try again.'));
      console.error('Error fetching reports:', _err);
    } finally {
      setLoading(false);
    }
  }, [dateFilters.asOfDate, dateFilters.startDate, dateFilters.endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportToCSV = (data, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + data;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print(); // Simple print-to-PDF functionality
  };

  // formatCurrency now comes from useLocaleFormatting hook

  const generateCSVData = (reportType) => {
    let csv = "Category,Amount\n";
    if (reportType === 'balance-sheet' && balanceSheet) {
      csv += `Assets,${balanceSheet.total_assets}\n`;
      csv += `Liabilities,${balanceSheet.total_liabilities}\n`;
      csv += `Equity,${balanceSheet.total_equity}\n`;
    } else if (reportType === 'profit-loss' && profitLoss) {
      csv += `Revenue,${profitLoss.total_revenue}\n`;
      csv += `Expenses,${profitLoss.total_expenses}\n`;
      csv += `Net Income,${profitLoss.net_income}\n`;
    } else if (reportType === 'cash-flow' && cashFlow) {
      csv += `Operating Cash Flow,${cashFlow.operating_cash_flow}\n`;
      csv += `Investing Cash Flow,${cashFlow.investing_cash_flow}\n`;
      csv += `Financing Cash Flow,${cashFlow.financing_cash_flow}\n`;
      csv += `Net Cash Flow,${cashFlow.net_cash_flow}\n`;
    }
    return csv;
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return <div>{t('common:status.loading', 'Loading...')}</div>;

    return (
      <div className="report-section">
  <h3>{t('financial:reports.balance_sheet_title', `Balance Sheet (As of ${balanceSheet.as_of_date})`)}</h3>

        <div className="balance-sheet-grid">
          <div className="assets-section">
            <h4>{t('financial:reports.assets', 'Assets')}</h4>
            <table className="striped-table">
              <tbody>
                {Object.entries(balanceSheet.assets).map(([account, balance]) => (
                  <tr key={account}>
                    <td>{account}</td>
                    <td className="text-right">{formatCurrency(balance)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>{t('financial:reports.total_assets', 'Total Assets')}</strong></td>
                  <td className="text-right"><strong>{formatCurrency(balanceSheet.total_assets)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="liabilities-equity-section">
            <div className="liabilities-section">
              <h4>{t('financial:reports.liabilities', 'Liabilities')}</h4>
              <table className="striped-table">
                <tbody>
                  {Object.entries(balanceSheet.liabilities).map(([account, balance]) => (
                    <tr key={account}>
                      <td>{account}</td>
                      <td className="text-right">{formatCurrency(balance)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>{t('financial:reports.total_liabilities', 'Total Liabilities')}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(balanceSheet.total_liabilities)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="equity-section">
              <h4>{t('financial:reports.equity', 'Equity')}</h4>
              <table className="striped-table">
                <tbody>
                  {Object.entries(balanceSheet.equity).map(([account, balance]) => (
                    <tr key={account}>
                      <td>{account}</td>
                      <td className="text-right">{formatCurrency(balance)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td><strong>{t('financial:reports.total_equity', 'Total Equity')}</strong></td>
                    <td className="text-right"><strong>{formatCurrency(balanceSheet.total_equity)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfitLoss = () => {
    if (!profitLoss) return <div>{t('common:status.loading', 'Loading...')}</div>;

    return (
      <div className="report-section">
  <h3>{t('financial:reports.profit_loss_title', `Profit & Loss (${profitLoss.start_date} to ${profitLoss.end_date})`)}</h3>

        <div className="pnl-grid">
          <div className="revenue-section">
            <h4>{t('financial:reports.revenue', 'Revenue')}</h4>
            <table className="striped-table">
              <tbody>
                {Object.entries(profitLoss.revenue).map(([account, amount]) => (
                  <tr key={account}>
                    <td>{account}</td>
                    <td className="text-right">{formatCurrency(amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>{t('financial:reports.total_revenue', 'Total Revenue')}</strong></td>
                  <td className="text-right"><strong>{formatCurrency(profitLoss.total_revenue)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="expenses-section">
            <h4>{t('financial:reports.expenses', 'Expenses')}</h4>
            <table className="striped-table">
              <tbody>
                {Object.entries(profitLoss.expenses).map(([account, amount]) => (
                  <tr key={account}>
                    <td>{account}</td>
                    <td className="text-right">{formatCurrency(amount)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td><strong>{t('financial:reports.total_expenses', 'Total Expenses')}</strong></td>
                  <td className="text-right"><strong>{formatCurrency(profitLoss.total_expenses)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="net-profit-section">
          <h4>{t('financial:reports.net_profit', 'Net Profit')}: <span className={profitLoss.net_profit >= 0 ? 'positive' : 'negative'}>
            {formatCurrency(profitLoss.net_profit)}
          </span></h4>
        </div>
      </div>
    );
  };

  const renderCashFlow = () => {
    if (!cashFlow) return <div>{t('common:status.loading', 'Loading...')}</div>;

    return (
      <div className="report-section">
  <h3>{t('financial:reports.cash_flow_title', `Cash Flow Statement (${cashFlow.start_date} to ${cashFlow.end_date})`)}</h3>

        <table className="striped-table">
          <tbody>
            <tr>
              <td>{t('financial:reports.operating_activities', 'Operating Activities')}</td>
              <td className="text-right">{formatCurrency(cashFlow.operating_activities)}</td>
            </tr>
            <tr>
              <td>{t('financial:reports.investing_activities', 'Investing Activities')}</td>
              <td className="text-right">{formatCurrency(cashFlow.investing_activities)}</td>
            </tr>
            <tr>
              <td>{t('financial:reports.financing_activities', 'Financing Activities')}</td>
              <td className="text-right">{formatCurrency(cashFlow.financing_activities)}</td>
            </tr>
            <tr className="total-row">
              <td><strong>{t('financial:reports.net_cash_flow', 'Net Cash Flow')}</strong></td>
              <td className="text-right"><strong>{formatCurrency(cashFlow.net_cash_flow)}</strong></td>
            </tr>
          </tbody>
        </table>

        {cashFlow.error && (
          <div className="error-message">
            <p>{t('financial:reports.note', 'Note')}: {cashFlow.error}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="reports-page">
      <h2>{t('financial:reports.title', 'Financial Reports')}</h2>

      <div className="date-filters">
        <div className="filter-group">
          <label>
            {t('financial:reports.as_of', 'Balance Sheet As Of:')}
            <input
              type="date"
              value={dateFilters.asOfDate}
              onChange={(e) => setDateFilters(prev => ({ ...prev, asOfDate: e.target.value }))}
            />
          </label>
        </div>

        <div className="filter-group">
          <label>
            {t('financial:reports.period_start', 'Period Start:')}
            <input
              type="date"
              value={dateFilters.startDate}
              onChange={(e) => setDateFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </label>
          <label>
            {t('financial:reports.period_end', 'Period End:')}
            <input
              type="date"
              value={dateFilters.endDate}
              onChange={(e) => setDateFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </label>
        </div>

        <button onClick={fetchReports} disabled={loading}>
          {loading ? t('common:status.loading', 'Loading...') : t('financial:reports.refresh', 'Refresh Reports')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="report-tabs">
        <button
          className={activeTab === 'balance-sheet' ? 'active' : ''}
          onClick={() => setActiveTab('balance-sheet')}
        >
          {t('financial:reports.tabs.balance_sheet', 'Balance Sheet')}
        </button>
        <button
          className={activeTab === 'profit-loss' ? 'active' : ''}
          onClick={() => setActiveTab('profit-loss')}
        >
          {t('financial:reports.tabs.profit_loss', 'Profit & Loss')}
        </button>
        <button
          className={activeTab === 'cash-flow' ? 'active' : ''}
          onClick={() => setActiveTab('cash-flow')}
        >
          {t('financial:reports.tabs.cash_flow', 'Cash Flow')}
        </button>
      </div>

      <div className="export-buttons">
        <button
          className="btn btn-secondary"
          onClick={() => exportToCSV(generateCSVData(activeTab), `${activeTab}-report.csv`)}
        >
          {t('financial:reports.export_csv', 'Export CSV')}
        </button>
        <button
          className="btn btn-secondary"
          onClick={exportToPDF}
        >
          {t('financial:reports.export_pdf', 'Export PDF')}
        </button>
      </div>

      <div className="report-content">
        {activeTab === 'balance-sheet' && renderBalanceSheet()}
        {activeTab === 'profit-loss' && renderProfitLoss()}
        {activeTab === 'cash-flow' && renderCashFlow()}
      </div>
    </div>
  );
};

export default Reports;
