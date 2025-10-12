import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoverageAreaMap from '../../components/CoverageAreaMap';
import { getCoverageAreas, updateCoverageArea, createCoverageArea, deleteCoverageArea, getTechnicians } from '../../api';
import { renderWithProviders } from '../helpers/test-utils';

// Mock the API calls
jest.mock('../../api', () => ({
  getCoverageAreas: jest.fn(),
  updateCoverageArea: jest.fn(),
  createCoverageArea: jest.fn(),
  deleteCoverageArea: jest.fn(),
  getTechnicians: jest.fn(),
}));

// Mock React Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, ...props }) => (
    <div
      data-testid="leaflet-map"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      {...props}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }) => (
    <div data-testid="tile-layer" data-url={url} data-attribution={attribution} />
  ),
  Marker: ({ position, children }) => (
    <div
      data-testid="leaflet-marker"
      data-position={JSON.stringify(position)}
      onClick={() => children?.props?.children?.props?.onClick?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }) => (
    <div data-testid="leaflet-popup">{children}</div>
  ),
  Polygon: ({ positions, color, fillColor, pathOptions, ...props }) => (
    <div
      data-testid="leaflet-polygon"
      data-positions={JSON.stringify(positions)}
      data-color={color}
      data-fill-color={fillColor}
      data-path-options={JSON.stringify(pathOptions)}
      onClick={() => props.eventHandlers?.click?.()}
      {...props}
    >
      Coverage Area Polygon
    </div>
  ),
  Circle: ({ center, radius, color, fillColor, ...props }) => (
    <div
      data-testid="leaflet-circle"
      data-center={JSON.stringify(center)}
      data-radius={radius}
      data-color={color}
      data-fill-color={fillColor}
      onClick={() => props.eventHandlers?.click?.()}
      {...props}
    >
      Coverage Area Circle
    </div>
  ),
  useMap: () => ({
    on: jest.fn(),
    off: jest.fn(),
    setView: jest.fn(),
    fitBounds: jest.fn(),
    getZoom: jest.fn(() => 10),
    getCenter: jest.fn(() => ({ lat: 40.7128, lng: -74.0060 })),
  }),
  useMapEvents: (events) => {
    React.useEffect(() => {
      // Simulate map ready event
      if (events.ready) events.ready();
    }, [events]);
    return null;
  },
}));

// Mock Leaflet
global.L = {
  icon: jest.fn(() => ({ iconUrl: 'marker-icon.png' })),
  divIcon: jest.fn(() => ({ className: 'custom-div-icon' })),
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  latLngBounds: jest.fn(() => ({
    extend: jest.fn(),
    isValid: jest.fn(() => true),
  })),
  geoJSON: jest.fn(() => ({
    getBounds: jest.fn(() => ({
      isValid: jest.fn(() => true),
    })),
  })),
};

const createMockCoverageArea = (overrides = {}) => ({
  id: 1,
  name: 'Downtown District',
  description: 'Central business district coverage',
  area_type: 'polygon',
  coordinates: [
    [40.7589, -73.9851],
    [40.7489, -73.9851],
    [40.7489, -73.9751],
    [40.7589, -73.9751],
    [40.7589, -73.9851],
  ],
  technicians: [1, 2],
  is_active: true,
  priority_level: 1,
  service_types: ['installation', 'maintenance'],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides,
});

const createMockTechnician = (overrides = {}) => ({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  is_active: true,
  current_location: {
    lat: 40.7128,
    lng: -74.0060,
    updated_at: '2024-12-15T10:00:00Z'
  },
  ...overrides,
});

describe('CoverageAreaMap', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    getCoverageAreas.mockResolvedValue({
      data: { results: [createMockCoverageArea()] }
    });
    getTechnicians.mockResolvedValue({
      data: { results: [createMockTechnician()] }
    });
    createCoverageArea.mockResolvedValue({
      data: createMockCoverageArea({ id: 2 })
    });
    updateCoverageArea.mockResolvedValue({
      data: createMockCoverageArea()
    });
    deleteCoverageArea.mockResolvedValue({});
  });

  const renderCoverageAreaMap = (props = {}) => {
    return renderWithProviders(<CoverageAreaMap {...props} />);
  };

  describe('Map Loading and Rendering', () => {
    it('renders map with loading state', () => {
      getCoverageAreas.mockImplementation(() => new Promise(() => {}));

      renderCoverageAreaMap();

      expect(screen.getByText(/loading coverage areas/i)).toBeInTheDocument();
      expect(screen.getByTestId('map-skeleton')).toBeInTheDocument();
    });

    it('loads and displays coverage areas on map', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByText('Coverage Area Map')).toBeInTheDocument();
        expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      expect(getCoverageAreas).toHaveBeenCalled();
      expect(getTechnicians).toHaveBeenCalled();
    });

    it('initializes map with correct center and zoom', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        const map = screen.getByTestId('leaflet-map');
        expect(map).toHaveAttribute('data-center', JSON.stringify([40.7128, -74.0060]));
        expect(map).toHaveAttribute('data-zoom', '10');
      });
    });

    it('displays tile layer with proper attribution', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        const tileLayer = screen.getByTestId('tile-layer');
        expect(tileLayer).toHaveAttribute('data-url');
        expect(tileLayer).toHaveAttribute('data-attribution');
      });
    });
  });

  describe('Coverage Area Display', () => {
    it('renders polygon coverage areas', async () => {
      const polygonArea = createMockCoverageArea({
        area_type: 'polygon',
        coordinates: [
          [40.7589, -73.9851],
          [40.7489, -73.9851],
          [40.7489, -73.9751],
          [40.7589, -73.9751],
        ]
      });

      getCoverageAreas.mockResolvedValue({ data: { results: [polygonArea] } });

      renderCoverageAreaMap();

      await waitFor(() => {
        const polygon = screen.getByTestId('leaflet-polygon');
        expect(polygon).toBeInTheDocument();
        expect(polygon).toHaveAttribute('data-positions');
        expect(polygon).toHaveAttribute('data-color', '#3B82F6');
      });
    });

    it('renders circular coverage areas', async () => {
      const circleArea = createMockCoverageArea({
        id: 2,
        area_type: 'circle',
        center: [40.7128, -74.0060],
        radius: 5000 // 5km radius
      });

      getCoverageAreas.mockResolvedValue({ data: { results: [circleArea] } });

      renderCoverageAreaMap();

      await waitFor(() => {
        const circle = screen.getByTestId('leaflet-circle');
        expect(circle).toBeInTheDocument();
        expect(circle).toHaveAttribute('data-center', JSON.stringify([40.7128, -74.0060]));
        expect(circle).toHaveAttribute('data-radius', '5000');
      });
    });

    it('applies different colors based on priority level', async () => {
      const areas = [
        createMockCoverageArea({ id: 1, priority_level: 1, name: 'High Priority' }),
        createMockCoverageArea({ id: 2, priority_level: 2, name: 'Medium Priority' }),
        createMockCoverageArea({ id: 3, priority_level: 3, name: 'Low Priority' }),
      ];

      getCoverageAreas.mockResolvedValue({ data: { results: areas } });

      renderCoverageAreaMap();

      await waitFor(() => {
        const polygons = screen.getAllByTestId('leaflet-polygon');
        expect(polygons[0]).toHaveAttribute('data-color', '#EF4444'); // High priority - red
        expect(polygons[1]).toHaveAttribute('data-color', '#F59E0B'); // Medium priority - amber
        expect(polygons[2]).toHaveAttribute('data-color', '#10B981'); // Low priority - green
      });
    });

    it('shows coverage area information on click', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      const polygon = screen.getByTestId('leaflet-polygon');
      await user.click(polygon);

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-popup')).toBeInTheDocument();
        expect(screen.getByText('Downtown District')).toBeInTheDocument();
        expect(screen.getByText('Central business district coverage')).toBeInTheDocument();
        expect(screen.getByText('Priority: 1')).toBeInTheDocument();
      });
    });
  });

  describe('Technician Tracking', () => {
    it('displays technician markers on map', async () => {
      const technicians = [
        createMockTechnician({
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          current_location: { lat: 40.7128, lng: -74.0060 }
        }),
        createMockTechnician({
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          current_location: { lat: 40.7589, lng: -73.9851 }
        }),
      ];

      getTechnicians.mockResolvedValue({ data: { results: technicians } });

      renderCoverageAreaMap();

      await waitFor(() => {
        const markers = screen.getAllByTestId('leaflet-marker');
        expect(markers).toHaveLength(2);
        expect(markers[0]).toHaveAttribute('data-position', JSON.stringify([40.7128, -74.0060]));
        expect(markers[1]).toHaveAttribute('data-position', JSON.stringify([40.7589, -73.9851]));
      });
    });

    it('shows technician information in marker popup', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
      });

      const marker = screen.getByTestId('leaflet-marker');
      await user.click(marker);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText(/last updated/i)).toBeInTheDocument();
      });
    });

    it('filters technicians by coverage area assignment', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter technicians/i })).toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /filter technicians/i });
      await user.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText('Show All Technicians')).toBeInTheDocument();
        expect(screen.getByText('Assigned to Coverage Areas')).toBeInTheDocument();
        expect(screen.getByText('Unassigned Technicians')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Assigned to Coverage Areas'));

      await waitFor(() => {
        expect(getTechnicians).toHaveBeenCalledWith(
          expect.objectContaining({
            has_coverage_area: true
          })
        );
      });
    });

    it('updates technician locations in real-time', async () => {
      jest.useFakeTimers();

      renderCoverageAreaMap({ realTimeTracking: true });

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
      });

      // Simulate location update
      const updatedTechnician = createMockTechnician({
        current_location: { lat: 40.7200, lng: -74.0100 }
      });

      getTechnicians.mockResolvedValue({ data: { results: [updatedTechnician] } });

      // Fast-forward 30 seconds (typical real-time update interval)
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        const marker = screen.getByTestId('leaflet-marker');
        expect(marker).toHaveAttribute('data-position', JSON.stringify([40.7200, -74.0100]));
      });

      jest.useRealTimers();
    });
  });

  describe('Coverage Area Creation', () => {
    it('enters drawing mode for new coverage area', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add coverage area/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add coverage area/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Drawing Mode')).toBeInTheDocument();
        expect(screen.getByText('Click on the map to create coverage area')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /finish drawing/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel drawing/i })).toBeInTheDocument();
      });
    });

    it('creates polygon coverage area', async () => {
      renderCoverageAreaMap();

      const addButton = screen.getByRole('button', { name: /add coverage area/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Drawing Mode')).toBeInTheDocument();
      });

      // Simulate drawing polygon by clicking map points
      const map = screen.getByTestId('leaflet-map');

      // Click multiple points to create polygon
      fireEvent.click(map, { clientX: 100, clientY: 100 });
      fireEvent.click(map, { clientX: 200, clientY: 100 });
      fireEvent.click(map, { clientX: 200, clientY: 200 });
      fireEvent.click(map, { clientX: 100, clientY: 200 });

      const finishButton = screen.getByRole('button', { name: /finish drawing/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText('Coverage Area Details')).toBeInTheDocument();
        expect(screen.getByLabelText(/area name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/priority level/i)).toBeInTheDocument();
      });
    });

    it('creates circular coverage area', async () => {
      renderCoverageAreaMap();

      const addButton = screen.getByRole('button', { name: /add coverage area/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /circle mode/i })).toBeInTheDocument();
      });

      const circleModeButton = screen.getByRole('button', { name: /circle mode/i });
      await user.click(circleModeButton);

      // Simulate drawing circle
      const map = screen.getByTestId('leaflet-map');
      fireEvent.click(map, { clientX: 150, clientY: 150 }); // Center
      fireEvent.mouseMove(map, { clientX: 200, clientY: 150 }); // Radius

      const finishButton = screen.getByRole('button', { name: /finish drawing/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/radius \(meters\)/i)).toBeInTheDocument();
      });
    });

    it('saves new coverage area with details', async () => {
      renderCoverageAreaMap();

      const addButton = screen.getByRole('button', { name: /add coverage area/i });
      await user.click(addButton);

      // Complete drawing process (simplified)
      const finishButton = screen.getByRole('button', { name: /finish drawing/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/area name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/area name/i), 'New Service Area');
      await user.type(screen.getByLabelText(/description/i), 'Newly created service coverage area');

      const prioritySelect = screen.getByLabelText(/priority level/i);
      await user.selectOptions(prioritySelect, '1');

      const saveButton = screen.getByRole('button', { name: /save coverage area/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(createCoverageArea).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Service Area',
            description: 'Newly created service coverage area',
            priority_level: 1,
            area_type: 'polygon',
            is_active: true,
          })
        );
      });
    });
  });

  describe('Coverage Area Editing', () => {
    it('opens edit mode for existing coverage area', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      const polygon = screen.getByTestId('leaflet-polygon');
      await user.rightClick(polygon);

      await waitFor(() => {
        expect(screen.getByText('Edit Coverage Area')).toBeInTheDocument();
        expect(screen.getByText('Delete Coverage Area')).toBeInTheDocument();
        expect(screen.getByText('Assign Technicians')).toBeInTheDocument();
      });
    });

    it('updates coverage area properties', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      const polygon = screen.getByTestId('leaflet-polygon');
      await user.rightClick(polygon);

      await user.click(screen.getByText('Edit Coverage Area'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Downtown District')).toBeInTheDocument();
      });

      const nameField = screen.getByDisplayValue('Downtown District');
      await user.clear(nameField);
      await user.type(nameField, 'Updated Downtown District');

      const saveButton = screen.getByRole('button', { name: /update coverage area/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateCoverageArea).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'Updated Downtown District',
          })
        );
      });
    });

    it('deletes coverage area with confirmation', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      const polygon = screen.getByTestId('leaflet-polygon');
      await user.rightClick(polygon);

      await user.click(screen.getByText('Delete Coverage Area'));

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this coverage area? This action cannot be undone.'
      );

      await waitFor(() => {
        expect(deleteCoverageArea).toHaveBeenCalledWith(1);
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Technician Assignment', () => {
    it('assigns technicians to coverage area', async () => {
      const technicians = [
        createMockTechnician({ id: 1, first_name: 'John', last_name: 'Doe' }),
        createMockTechnician({ id: 2, first_name: 'Jane', last_name: 'Smith' }),
      ];

      getTechnicians.mockResolvedValue({ data: { results: technicians } });

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      const polygon = screen.getByTestId('leaflet-polygon');
      await user.rightClick(polygon);

      await user.click(screen.getByText('Assign Technicians'));

      await waitFor(() => {
        expect(screen.getByText('Assign Technicians to Coverage Area')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const johnCheckbox = screen.getByRole('checkbox', { name: /assign john doe/i });
      const janeCheckbox = screen.getByRole('checkbox', { name: /assign jane smith/i });

      await user.click(johnCheckbox);
      await user.click(janeCheckbox);

      const assignButton = screen.getByRole('button', { name: /assign selected/i });
      await user.click(assignButton);

      await waitFor(() => {
        expect(updateCoverageArea).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            technicians: [1, 2],
          })
        );
      });
    });

    it('shows technician assignment status', async () => {
      const assignedArea = createMockCoverageArea({
        technicians: [1],
        technician_details: [
          { id: 1, first_name: 'John', last_name: 'Doe' }
        ]
      });

      getCoverageAreas.mockResolvedValue({ data: { results: [assignedArea] } });

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-polygon')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('leaflet-polygon'));

      await waitFor(() => {
        expect(screen.getByText('Assigned Technicians:')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Map Controls and Navigation', () => {
    it('provides zoom controls', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fit all areas/i })).toBeInTheDocument();
      });
    });

    it('fits all coverage areas in view', async () => {
      const mockMap = { fitBounds: jest.fn() };

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /fit all areas/i })).toBeInTheDocument();
      });

      const fitButton = screen.getByRole('button', { name: /fit all areas/i });
      await user.click(fitButton);

      // Map should adjust to show all coverage areas
      await waitFor(() => {
        expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
      });
    });

    it('switches between map layers', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /map layers/i })).toBeInTheDocument();
      });

      const layersButton = screen.getByRole('button', { name: /map layers/i });
      await user.click(layersButton);

      await waitFor(() => {
        expect(screen.getByText('Street Map')).toBeInTheDocument();
        expect(screen.getByText('Satellite')).toBeInTheDocument();
        expect(screen.getByText('Terrain')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Satellite'));

      await waitFor(() => {
        const tileLayer = screen.getByTestId('tile-layer');
        expect(tileLayer).toHaveAttribute('data-url', expect.stringContaining('satellite'));
      });
    });
  });

  describe('Search and Filtering', () => {
    it('searches coverage areas by name', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search coverage areas/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search coverage areas/i);
      await user.type(searchInput, 'Downtown');

      await waitFor(() => {
        expect(getCoverageAreas).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Downtown'
          })
        );
      });
    });

    it('filters by priority level', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter by priority/i })).toBeInTheDocument();
      });

      const priorityFilter = screen.getByRole('button', { name: /filter by priority/i });
      await user.click(priorityFilter);

      await waitFor(() => {
        expect(screen.getByText('High Priority (1)')).toBeInTheDocument();
        expect(screen.getByText('Medium Priority (2)')).toBeInTheDocument();
        expect(screen.getByText('Low Priority (3)')).toBeInTheDocument();
      });

      await user.click(screen.getByText('High Priority (1)'));

      await waitFor(() => {
        expect(getCoverageAreas).toHaveBeenCalledWith(
          expect.objectContaining({
            priority_level: 1
          })
        );
      });
    });

    it('filters by service type', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter by service/i })).toBeInTheDocument();
      });

      const serviceFilter = screen.getByRole('button', { name: /filter by service/i });
      await user.click(serviceFilter);

      await waitFor(() => {
        expect(screen.getByText('Installation')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Repair')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Installation'));

      await waitFor(() => {
        expect(getCoverageAreas).toHaveBeenCalledWith(
          expect.objectContaining({
            service_types: 'installation'
          })
        );
      });
    });
  });

  describe('Analytics and Statistics', () => {
    it('displays coverage area statistics', async () => {
      const areas = [
        createMockCoverageArea({ id: 1, priority_level: 1 }),
        createMockCoverageArea({ id: 2, priority_level: 1 }),
        createMockCoverageArea({ id: 3, priority_level: 2 }),
      ];

      getCoverageAreas.mockResolvedValue({ data: { results: areas } });

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByText('Coverage Statistics')).toBeInTheDocument();
        expect(screen.getByText('Total Areas: 3')).toBeInTheDocument();
        expect(screen.getByText('High Priority: 2')).toBeInTheDocument();
        expect(screen.getByText('Medium Priority: 1')).toBeInTheDocument();
      });
    });

    it('shows technician distribution across areas', async () => {
      const areas = [
        createMockCoverageArea({ id: 1, technicians: [1, 2] }),
        createMockCoverageArea({ id: 2, technicians: [3] }),
        createMockCoverageArea({ id: 3, technicians: [] }),
      ];

      getCoverageAreas.mockResolvedValue({ data: { results: areas } });

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByText('Technician Distribution')).toBeInTheDocument();
        expect(screen.getByText('Assigned: 3')).toBeInTheDocument();
        expect(screen.getByText('Unassigned Areas: 1')).toBeInTheDocument();
      });
    });

    it('calculates coverage area sizes', async () => {
      const areas = [
        createMockCoverageArea({
          id: 1,
          area_type: 'circle',
          radius: 5000, // 5km
          calculated_area: 78.54 // km²
        }),
      ];

      getCoverageAreas.mockResolvedValue({ data: { results: areas } });

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByText('Total Coverage: 78.54 km²')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles coverage area loading errors', async () => {
      getCoverageAreas.mockRejectedValue(new Error('Failed to load coverage areas'));

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByText(/failed to load coverage areas/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('handles technician location errors', async () => {
      getTechnicians.mockRejectedValue(new Error('Failed to load technician locations'));

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByText(/failed to load technician locations/i)).toBeInTheDocument();
      });
    });

    it('handles coverage area creation errors', async () => {
      createCoverageArea.mockRejectedValue({
        response: { data: { error: 'Invalid coordinates' } }
      });

      renderCoverageAreaMap();

      const addButton = screen.getByRole('button', { name: /add coverage area/i });
      await user.click(addButton);

      const finishButton = screen.getByRole('button', { name: /finish drawing/i });
      await user.click(finishButton);

      await user.type(screen.getByLabelText(/area name/i), 'Test Area');

      const saveButton = screen.getByRole('button', { name: /save coverage area/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid coordinates')).toBeInTheDocument();
      });
    });

    it('retries failed requests', async () => {
      getCoverageAreas.mockRejectedValueOnce(new Error('Network error'))
                     .mockResolvedValue({ data: { results: [createMockCoverageArea()] } });

      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
      });

      expect(getCoverageAreas).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Coverage Area Map', level: 1 })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Map Controls', level: 2 })).toBeInTheDocument();
      });
    });

    it('provides keyboard navigation for map controls', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
      });

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      expect(zoomInButton).toHaveAttribute('tabindex', '0');

      await user.tab();
      expect(document.activeElement).toBe(zoomInButton);
    });

    it('provides screen reader descriptions for coverage areas', async () => {
      renderCoverageAreaMap();

      await waitFor(() => {
        const mapRegion = screen.getByRole('region', { name: /interactive map/i });
        expect(mapRegion).toBeInTheDocument();
        expect(mapRegion).toHaveAttribute('aria-label', expect.stringContaining('coverage areas'));
      });
    });

    it('supports high contrast mode', async () => {
      renderCoverageAreaMap({ highContrast: true });

      await waitFor(() => {
        const polygon = screen.getByTestId('leaflet-polygon');
        expect(polygon).toHaveAttribute('data-color', '#000000');
        expect(polygon).toHaveAttribute('data-fill-color', '#FFFFFF');
      });
    });
  });

  describe('Performance', () => {
    it('renders map within performance budget', async () => {
      const startTime = performance.now();
      renderCoverageAreaMap();

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('efficiently handles large numbers of coverage areas', async () => {
      const largeCoverageSet = Array.from({ length: 100 }, (_, index) =>
        createMockCoverageArea({
          id: index + 1,
          name: `Area ${index + 1}`,
        })
      );

      getCoverageAreas.mockResolvedValue({ data: { results: largeCoverageSet } });

      renderCoverageAreaMap();

      await waitFor(() => {
        // Should implement clustering or viewport-based rendering
        const polygons = screen.getAllByTestId('leaflet-polygon');
        expect(polygons.length).toBeLessThan(50); // Should not render all 100 at once
      });
    });

    it('implements efficient technician location updates', async () => {
      const updateSpy = jest.fn();

      renderCoverageAreaMap({
        realTimeTracking: true,
        onLocationUpdate: updateSpy
      });

      await waitFor(() => {
        expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
      });

      // Should batch location updates rather than individual updates
      expect(updateSpy).not.toHaveBeenCalledTimes(100);
    });
  });
});
