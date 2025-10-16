import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Virtual mock supercluster behavior
jest.mock('supercluster', () => {
  return function MockSupercluster() {
    this._features = [];
    this.load = (features) => { this._features = features; };
    this.getClusters = () => [{
      id: 99,
      geometry: { type: 'Point', coordinates: [-122.3, 47.6] },
      properties: { cluster: true, point_count: this._features.length, point_count_abbreviated: String(this._features.length) }
    }];
  };
}, { virtual: true });

jest.mock('react-leaflet', () => {
  const ReactLib = require('react');
  return {
    MapContainer: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'map' }, children),
    TileLayer: () => null,
    Marker: ({ position, children, icon, eventHandlers, ...rest }) => ReactLib.createElement('div', { 'data-testid': icon ? 'cluster-marker' : 'leaflet-marker', 'data-pos': JSON.stringify(position), onClick: () => eventHandlers?.click?.(), ...rest }, children),
    Popup: ({ children }) => ReactLib.createElement('div', { 'data-testid': 'popup' }, children),
    Polygon: () => null,
    Circle: () => null,
    useMap: () => ({ getBounds: () => ({ getWest: () => -180, getSouth: () => -85, getEast: () => 180, getNorth: () => 85 }), getZoom: () => 3, flyTo: () => {} }),
    useMapEvents: () => null,
  };
});

jest.mock('../../api', () => {
  const manyTechs = Array.from({ length: 250 }, (_, i) => ({ id: i + 1, first_name: 'T', last_name: String(i+1), current_location: { lat: 47.6 + (i/10000), lng: -122.3 + (i/10000) } }));
  return {
    getCoverageAreas: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    getCoverageShapes: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    getTechnicians: jest.fn(() => Promise.resolve({ data: { results: manyTechs } })),
  };
});

import CoverageAreaMap from '../../components/CoverageAreaMap.jsx';

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('CoverageAreaMap clustering', () => {
  it('renders cluster markers and announces expansion', async () => {
    renderWithRouter(<CoverageAreaMap />);
    // Wait until map is present and clustering has computed
    await waitFor(() => expect(screen.getByTestId('map')).toBeInTheDocument());
    // Should render at least one cluster marker
    await waitFor(() => expect(screen.getByTestId('cluster-marker')).toBeInTheDocument());

    // Click cluster marker to trigger announcement
    await userEvent.click(screen.getByTestId('cluster-marker'));
    await waitFor(() => {
      expect(screen.getByTestId('cluster-announcer').textContent).toMatch(/Expanded cluster/);
    });
  });
});
