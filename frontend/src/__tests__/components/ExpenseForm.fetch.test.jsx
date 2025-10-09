
import { renderWithProviders } from '../helpers/test-utils';
import { waitFor, screen } from '@testing-library/react';
import * as api from '../../api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ExpenseForm from '../../components/ExpenseForm';

jest.mock('../../api');

/**
 * Fetch invocation tests for ExpenseForm (Batch 2)
 */

describe('ExpenseForm fetch behavior', () => {
  afterEach(() => jest.clearAllMocks());

  it('does not fetch expense in create mode', async () => {
    api.get.mockResolvedValue({ data: {} });

    renderWithProviders(
      <MemoryRouter initialEntries={['/expenses/new']}>
        <Routes>
          <Route path="/expenses/new" element={<ExpenseForm />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/add expense/i)).toBeInTheDocument();
    await waitFor(() => {});
    expect(api.get).not.toHaveBeenCalledWith(expect.stringMatching(/\/api\/expenses\/.+\//));
  });

  it('fetches expense once in edit mode', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/expenses/77/') return Promise.resolve({ data: { id: 77, date: '2025-10-01', amount: '12.34', category: 'travel', description: 'Taxi' } });
      return Promise.resolve({ data: {} });
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/expenses/77/edit']}>
        <Routes>
          <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/expenses/77/'));
    expect(api.get.mock.calls.filter(c => c[0] === '/api/expenses/77/')).toHaveLength(1);
  });
});
