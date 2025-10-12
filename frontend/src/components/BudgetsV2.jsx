import React from 'react';
import { getBudgetsV2, getCostCenters, createBudgetV2 } from '../api';
import BudgetV2Editor from './BudgetV2Editor';

export default function BudgetsV2() {
  const [budgets, setBudgets] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [costCenters, setCostCenters] = React.useState([]);
  const [form, setForm] = React.useState({ name: '', year: new Date().getFullYear(), cost_center: null });
  const [filters, setFilters] = React.useState({ year: '', cost_center: '' });

  const load = React.useCallback(async () => {
    // Build query params from filters
    const params = {};
    if (filters.year) params.year = filters.year;
    if (filters.cost_center) params.cost_center = filters.cost_center;

    const [bs, ccs] = await Promise.all([getBudgetsV2(params), getCostCenters()]);
    setBudgets(bs.data || []);
    setCostCenters(ccs.data || []);
    if (bs.data && bs.data.length) setSelected(bs.data[0]);
  }, [filters]);

  React.useEffect(() => { load(); }, [filters]);

  React.useEffect(() => {
    // Sync filters to URL on change
    const url = new URL(window.location);
    if (filters.year) {
      url.searchParams.set('year', filters.year);
    } else {
      url.searchParams.delete('year');
    }
    if (filters.cost_center) {
      url.searchParams.set('cost_center', filters.cost_center);
    } else {
      url.searchParams.delete('cost_center');
    }
    window.history.replaceState({}, '', url);
  }, [filters]);

  React.useEffect(() => {
    // Initialize filters from URL on load
    const url = new URL(window.location);
    const year = url.searchParams.get('year') || '';
    const cost_center = url.searchParams.get('cost_center') || '';
    setFilters({ year, cost_center });
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.year || !form.cost_center) return alert('Name, year, and cost center are required');
    const res = await createBudgetV2({ ...form });
    await load();
    setSelected(res.data);
  };

  return (
    <div>
      <h2>Budgets V2</h2>

      {/* Filter Controls */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Filters</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
          <div>
            <label>Year<br />
              <input
                type="number"
                placeholder="Filter by year..."
                value={filters.year}
                onChange={e => setFilters({ ...filters, year: e.target.value })}
                data-testid="year-filter"
              />
            </label>
          </div>
          <div>
            <label>Cost Center<br />
              <select
                value={filters.cost_center}
                onChange={e => setFilters({ ...filters, cost_center: e.target.value })}
                data-testid="cost-center-filter"
              >
                <option value="">All Cost Centers</option>
                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </label>
          </div>
          <div>
            <button
              onClick={() => setFilters({ year: '', cost_center: '' })}
              data-testid="clear-filters"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: '0 0 300px' }}>
          <h3>Existing Budgets</h3>
          <ul>
            {budgets.map(b => (
              <li key={b.id}>
                <button onClick={() => setSelected(b)}>{b.name} ({b.year})</button>
              </li>
            ))}
          </ul>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Create Budget</h3>
            <div>
              <label>Name<br />
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
            </div>
            <div>
              <label>Year<br />
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
              </label>
            </div>
            <div>
              <label>Cost Center<br />
                <select value={form.cost_center || ''} onChange={e => setForm({ ...form, cost_center: Number(e.target.value) })}>
                  <option value="">Select…</option>
                  {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                </select>
              </label>
            </div>
            <button onClick={handleCreate}>Create</button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {selected ? (
            <BudgetV2Editor budget={selected} onSaved={(b) => setSelected(b)} />
          ) : (
            <p>Select a budget to edit distributions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
