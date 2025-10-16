import React from 'react';
import { renderAndExpectAccessible } from '../../__tests__/helpers/test-utils.jsx';
import Deals from '../Deals.jsx';

jest.mock('../../api', () => ({
  get: jest.fn(),
}));

describe('Deals table accessibility', () => {
  it('renders an accessible deals table when data is present', async () => {
    const dealsData = [
      { id: 1, name: 'Deal A', account_name: 'Account X', stage_name: 'Qualified', value: 1000, expected_close_date: '2025-01-01' },
      { id: 2, name: 'Deal B', account_name: 'Account Y', stage_name: 'Proposal', value: 2000, expected_close_date: '2025-02-01' },
    ];

    const { get } = require('../../api');
    get.mockResolvedValueOnce({ data: { results: dealsData } });

    const { findByRole } = await renderAndExpectAccessible(<Deals />);
    const table = await findByRole('table', { name: /deals/i });
    expect(table).toBeInTheDocument();
  });
});
