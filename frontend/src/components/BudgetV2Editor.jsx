import React, { useMemo, useReducer } from 'react';
import { createBudgetV2, updateBudgetV2, getBudgetsV2, getBudgetV2 } from '../api';
import Toast from './Toast';

// Reducer for monthly distributions editing with month locking
function reducer(state, action) {
  switch (action.type) {
    case 'init': {
      const rows = action.rows || Array.from({ length: 12 }, (_, i) => ({ month: i + 1, percent: 8.33 }));
      const locks = Object.fromEntries(rows.map(r => [r.month, false]));
      return { rows, locks };
    }
    case 'setPercent': {
      const { month, percent } = action;
      return {
        ...state,
        rows: state.rows.map(r => (r.month === month ? { ...r, percent } : r)),
      };
    }
    case 'toggleLock': {
      const { month } = action;
      return { ...state, locks: { ...state.locks, [month]: !state.locks[month] } };
    }
    case 'normalize': {
      // Adjust the last unlocked month to make total exactly 100.00
      const unlocked = state.rows.filter(r => !state.locks[r.month]);
      if (unlocked.length === 0) return state; // nothing to normalize
      const total = state.rows.reduce((sum, r) => sum + Number(r.percent || 0), 0);
      const delta = 100 - total;
      const targetMonth = unlocked[unlocked.length - 1].month;
      return {
        ...state,
        rows: state.rows.map(r => (r.month === targetMonth ? { ...r, percent: Number((Number(r.percent || 0) + delta).toFixed(2)) } : r)),
      };
    }
    default:
      return state;
  }
}

export default function BudgetV2Editor({ budget, onSaved }) {
  const [state, dispatch] = useReducer(reducer, { rows: [], locks: {} });
  const [toast, setToast] = React.useState({ message: '', type: 'info' });

  React.useEffect(() => {
    const initial = budget && budget.distributions ? budget.distributions.map(d => ({ month: d.month, percent: Number(d.percent) })) : undefined;
    dispatch({ type: 'init', rows: initial });
  }, [budget]);

  const total = useMemo(() => state.rows.reduce((sum, r) => sum + Number(r.percent || 0), 0).toFixed(2), [state.rows]);
  const isValidTotal = useMemo(() => Math.abs(parseFloat(total) - 100.0) < 0.005, [total]);

  const handleChange = (month, value) => {
    const percent = Number(value);
    if (!Number.isNaN(percent)) dispatch({ type: 'setPercent', month, percent });
  };

  const handleSave = async () => {
    const payload = {
      name: budget?.name,
      year: budget?.year,
      cost_center: budget?.cost_center,
      distributions: state.rows.map(r => ({ month: r.month, percent: Number(r.percent) })),
    };
    try {
      let res;
      if (budget && budget.id) {
        res = await updateBudgetV2(budget.id, { distributions: payload.distributions });
      } else {
        res = await createBudgetV2(payload);
      }
      if (onSaved) onSaved(res.data);
      setToast({ message: 'Budget saved successfully', type: 'success' });
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message || 'Save failed');
      setToast({ message: msg, type: 'error' });
    }
  };

  const handleCopyLastYear = async () => {
    try {
      if (!budget?.cost_center || !budget?.year) return;
      const res = await getBudgetsV2();
      const prev = (res.data || []).find(b => b.cost_center === budget.cost_center && b.year === budget.year - 1);
      if (!prev) {
        setToast({ message: 'No prior-year budget found for this cost center.', type: 'info' });
        return;
      }
      let distributions = prev.distributions;
      // If list payload omitted distributions, fetch detail
      if (!Array.isArray(distributions) || distributions.length === 0) {
        const detail = await getBudgetV2(prev.id);
        distributions = detail?.data?.distributions || [];
      }
      if (Array.isArray(distributions) && distributions.length) {
        const rows = distributions.map(d => ({ month: d.month, percent: Number(d.percent) }));
        dispatch({ type: 'init', rows });
      } else {
        setToast({ message: 'No distributions available on prior-year budget.', type: 'info' });
      }
    } catch (e) {
      // Non-fatal UX helper
      setToast({ message: `Failed to load prior-year budget: ${e?.message || 'Unknown error'}` , type: 'error' });
    }
  };

  return (
    <div className="card">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} data-testid="toast" />
      <h3>Monthly Distributions</h3>
      <table className="striped-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Percent</th>
            <th>Lock</th>
          </tr>
        </thead>
        <tbody>
          {state.rows.map(r => (
            <tr key={r.month}>
              <td>{r.month}</td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={r.percent}
                  onChange={(e) => handleChange(r.month, e.target.value)}
                  disabled={state.locks[r.month]}
                  aria-label={`percent-month-${r.month}`}
                  data-testid={`percent-input-${r.month}`}
                />
              </td>
              <td>
                <label>
                  <input type="checkbox" checked={!!state.locks[r.month]} onChange={() => dispatch({ type: 'toggleLock', month: r.month })} />
                  Lock
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => dispatch({ type: 'normalize' })} data-testid="normalize-button">Normalize Total to 100%</button>
        <span
          style={{ marginLeft: 12, color: isValidTotal ? undefined : 'red' }}
          aria-live="polite"
          role={!isValidTotal ? 'alert' : undefined}
          data-testid="total-display"
        >
          Total: <strong>{total}%</strong>
        </span>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleSave} disabled={!isValidTotal} data-testid="save-button">Save</button>
        <button onClick={handleCopyLastYear} style={{ marginLeft: 8 }} data-testid="copy-last-year-button">Copy Last Year</button>
      </div>
    </div>
  );
}
