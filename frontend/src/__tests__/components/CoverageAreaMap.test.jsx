import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock react-leaflet to avoid Leaflet DOM/Canvas requirements in JSDOM
jest.mock('react-leaflet', () => {
  const ReactLib = require('react');
  return {
    MapContainer: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'map' }, children),
    TileLayer: () => null,
    Polygon: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'polygon' }, children),
    Circle: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'circle' }, children),
    Marker: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'marker' }, children),
    Popup: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'popup' }, children),
    useMap: () => ({ setView: () => {} }),
    useMapEvents: () => null,
  };
});

// Mock API module used by CoverageAreaMap
jest.mock('../../api', () => {
  return {
    getCoverageAreas: jest.fn(() =>
      Promise.resolve({
        data: {
          results: [
            {
              id: 1,
              name: 'Area One',
              description: 'Test polygon area',
              area_type: 'polygon',
              coordinates: [
                [47.61, -122.33],
                [47.62, -122.33],
                [47.62, -122.31],
              ],
              color: '#3b82f6',
              priority_level: 1,
              technician: 10,
              technician_name: 'Casey Tech',
              is_active: true,
              properties: { service_types: ['electrical'] },
            },
            {
              id: 2,
              name: 'Area Two',
              description: 'Another polygon',
              area_type: 'polygon',
              coordinates: [
                [47.60, -122.33],
                [47.60, -122.31],
                [47.61, -122.31],
              ],
              color: '#ef4444',
              priority_level: 3,
              technician: 10,
              technician_name: 'Casey Tech',
              is_active: true,
              properties: { service_types: ['hvac'] },
            },
          ],
        },
      })
    ),
    getCoverageShapes: jest.fn(() =>
      Promise.resolve({
        data: {
          results: [
            {
              id: 101,
              name: 'Circle A',
              description: '',
              area_type: 'circle',
              geometry: { center: [-122.32, 47.605], radius_m: 750 },
              color: '#10b981',
              priority_level: 2,
              technician: 10,
              technician_name: 'Casey Tech',
              is_active: true,
              properties: { service_types: ['electrical', 'hvac'] },
            },
          ],
        },
      })
    ),
    getTechnicians: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    createCoverageArea: jest.fn(),
    updateCoverageArea: jest.fn(),
    deleteCoverageArea: jest.fn(() => Promise.resolve({ data: {} })),
    createCoverageShape: jest.fn(),
    updateCoverageShape: jest.fn(),
    deleteCoverageShape: jest.fn(),
  };
});

import CoverageAreaMap from '../../components/CoverageAreaMap.jsx';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CoverageAreaMap - context menu & keyboard fallback', () => {
  it('shows an accessible "More actions" button and opens the context menu on click', async () => {
    renderWithRouter(<CoverageAreaMap technicianId={10} />);

    // Wait for area to appear in the summary card list
    await waitFor(() => expect(screen.getByText('Area One')).toBeInTheDocument());

    const moreActions = screen.getByRole('button', { name: /more actions/i });
    await userEvent.click(moreActions);

    // The context menu should be present with role="menu" and menu items
    const menu = await screen.findByRole('menu', { name: /coverage area actions/i });
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('closes the context menu on Escape and outside click', async () => {
    renderWithRouter(<CoverageAreaMap technicianId={10} />);

    await waitFor(() => expect(screen.getByText('Area One')).toBeInTheDocument());

    const moreActions = screen.getByRole('button', { name: /more actions/i });
    await userEvent.click(moreActions);

    const menu = await screen.findByRole('menu', { name: /coverage area actions/i });
    expect(menu).toBeInTheDocument();

    // Press Escape to close
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu', { name: /coverage area actions/i })).not.toBeInTheDocument());

    // Re-open, then click outside to close
    await userEvent.click(moreActions);
    await screen.findByRole('menu', { name: /coverage area actions/i });
    await userEvent.click(document.body);
    await waitFor(() => expect(screen.queryByRole('menu', { name: /coverage area actions/i })).not.toBeInTheDocument());
  });

  it('renders analytics and filters coverage areas by priority and service types', async () => {
    renderWithRouter(<CoverageAreaMap technicianId={10} />);

    // Wait for data
    await waitFor(() => expect(screen.getByText('Area One')).toBeInTheDocument());

    // Analytics counts before filters: 3 total (2 polygons + 1 circle)
    expect(screen.getByTestId('analytics-total')).toHaveTextContent('Total Areas: 3');

    // Filter by Priority 1 only
    const priority1 = screen.getByLabelText(/priority 1/i);
    await userEvent.click(priority1);

    // URL should reflect priority filter
    await waitFor(() => {
      expect(window.location.search).toMatch(/priority=1/);
    });

    // Summary should include only priority 1 items (Area One)
    await waitFor(() => {
      expect(screen.getByTestId('analytics-total')).toHaveTextContent('Total Areas: 1');
      expect(screen.getByText('Area One')).toBeInTheDocument();
    });

    // Add service type filter that excludes Area One
    const serviceInput = screen.getByLabelText(/service types/i);
    await userEvent.clear(serviceInput);
    await userEvent.type(serviceInput, 'hvac');

    // URL should include services filter
    await waitFor(() => {
      expect(window.location.search).toMatch(/services=hvac/);
    });

    // Now only entries with hvac remain; Area One (electrical) should be gone
    await waitFor(() => {
      // priority filter + hvac yields zero (since Area One lacks hvac and circle is priority 2)
      expect(screen.getByTestId('analytics-total')).toHaveTextContent('Total Areas: 0');
    });

    // Uncheck Priority 1 to allow circle (priority 2) with hvac
    await userEvent.click(priority1);
    // Priority removed from URL (may be absent or not equal to 1)
    await waitFor(() => {
      expect(window.location.search).not.toMatch(/priority=1/);
    });
    await waitFor(() => {
      expect(screen.getByTestId('analytics-total')).toHaveTextContent('Total Areas: 1');
      expect(screen.getByText('Circle A')).toBeInTheDocument();
    });
  });
});
