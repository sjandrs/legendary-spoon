
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor, screen } from '@testing-library/react';
import * as api from '../../api';
import { Route, Routes } from 'react-router-dom';
import BudgetForm from '../../components/BudgetForm';

jest.mock('../../api');

/**
 * Fetch invocation tests for BudgetForm (Batch 2)
 */

describe('BudgetForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('does not fetch budget in create mode', async () => {
    api.get.mockResolvedValue({ data: {} });

    renderWithProviders(
      <Routes>
        <Route path="/budgets/new" element={<BudgetForm />} />
      </Routes>,
      { initialEntries: ['/budgets/new'] }
    );

  // Header and submit button both contain this text; target the heading to avoid ambiguity
  expect(screen.getByRole('heading', { name: /create budget/i })).toBeInTheDocument();
    await waitFor(() => {});
    expect(api.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/budgets\/.+\//));
  });

  it('fetches budget once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/budgets/55/') return Promise.resolve({ data: { id: 55, category: 'rent', period: '2025-10', amount: '1000' } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <Routes>
        <Route path="/budgets/:id/edit" element={<BudgetForm />} />
      </Routes>,
      { initialEntries: ['/budgets/55/edit'] }
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/budgets/55/'));
    expect(api.get.mock.calls.filter(c => c[0] === '/api/budgets/55/')).toHaveLength(1);
  });
});
