import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GtinInput from '../GtinInput';

it('enforces digits-only and max length 14', () => {
  let value = '';
  const onChange = (e) => { value = e.target.value; };
  render(<GtinInput value={value} onChange={onChange} />);
  const input = screen.getByPlaceholderText('GTIN (7-14 digits)');
  fireEvent.change(input, { target: { value: '12a34-56 78\n90\t12xyz34' } });
  expect(value).toBe('12345678901234');
  // exceeds 14 should be sliced
  fireEvent.change(input, { target: { value: '1234567890123456' } });
  expect(value).toBe('12345678901234');
});
