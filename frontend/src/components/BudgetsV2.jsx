import React from 'react';
import { getBudgetsV2, getCostCenters, createBudgetV2 } from '../api';
import BudgetV2Editor from './BudgetV2Editor';

export default function BudgetsV2() {
  const [budgets, setBudgets] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [costCenters, setCostCenters] = React.useState([]);
  const [form, setForm] = React.useState({ name: '', year: new Date().getFullYear(), cost_center: null });

  const load = async () => {
    const [bs, ccs] = await Promise.all([getBudgetsV2(), getCostCenters()]);
    setBudgets(bs.data || []);
    setCostCenters(ccs.data || []);
    if (bs.data && bs.data.length) setSelected(bs.data[0]);
  };

  React.useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.year || !form.cost_center) return alert('Name, year, and cost center are required');
    const res = await createBudgetV2({ ...form });
    await load();
    setSelected(res.data);
  };

  return (
    <div>
      <h2>Budgets V2</h2>
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
