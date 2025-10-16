import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import DealsByStageChart from '../../charts/DealsByStageChart.jsx';

jest.mock('react-chartjs-2', () => ({
  Bar: ({ children, ...props }) => <div role="img" aria-label={props['aria-label'] || 'chart'}>{children}</div>,
}));

describe('DealsByStageChart accessibility', () => {
  const sampleData = [
    { stage__id: 1, stage__name: 'Qualified', count: 5 },
    { stage__id: 2, stage__name: 'Proposal', count: 3 },
  ];

  it('renders an offscreen data table fallback with proper headers', async () => {
    const { container } = render(<DealsByStageChart data={sampleData} />);
    const table = container.querySelector('#deals-by-stage-table');
    expect(table).toBeTruthy();
    expect(table.querySelector('caption')).toBeTruthy();
    const rowHeaders = table.querySelectorAll('tbody th[scope="row"]');
    expect(rowHeaders.length).toBe(sampleData.length);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
