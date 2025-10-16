import React from 'react';
import { renderAndExpectAccessible } from '../../__tests__/helpers/test-utils.jsx';
import Contacts from '../Contacts.jsx';

jest.mock('../../api', () => ({
  get: jest.fn().mockResolvedValue({ data: { results: [
    { id: 1, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', phone_number: '555-1111', account: { name: 'Analytical Engines' }, owner: { username: 'manager' } },
    { id: 2, first_name: 'Alan', last_name: 'Turing', email: 'alan@example.com', phone_number: '555-2222', account: { name: 'Bletchley Park' }, owner: { username: 'lead' } },
  ] } })
}));

describe('Contacts table accessibility', () => {
  it('renders an accessible contacts table', async () => {
    const { container, findByRole } = await renderAndExpectAccessible(<Contacts />);
    const table = await findByRole('table', { name: /contacts/i });
    expect(table).toBeInTheDocument();
    // Ensure header associations exist
    const firstRowHeader = container.querySelector('tbody tr th[scope="row"]');
    expect(firstRowHeader).toBeTruthy();
  });
});
