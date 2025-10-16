import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import {
  getCoverageAreas,
  createCoverageArea,
  updateCoverageArea,
  deleteCoverageArea,
  getTechnicians,
  getCoverageShapes,
  createCoverageShape,
  updateCoverageShape,
  deleteCoverageShape,
  getCoverageShapeSummary,
} from '../api';
import LoadingSkeleton from './LoadingSkeleton';
import 'leaflet/dist/leaflet.css';
import './CoverageAreaMap.css';
import { buildClusterIndex, getClusters, createPointsFromData } from '../utils/clustering';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CoverageAreaMap = ({ technicianId = null, onAreaSelect }) => {
  const [coverageAreas, setCoverageAreas] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(technicianId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingArea, setEditingArea] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // 'polygon', 'circle'
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [searchAddress, setSearchAddress] = useState('');
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [circleDraft, setCircleDraft] = useState(null); // { center: [lat,lng], radius_m }
  const [circleShapes, setCircleShapes] = useState([]); // persisted circle shapes
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, area }
  const [searchParams, setSearchParams] = useSearchParams();
  const [priorityFilter, setPriorityFilter] = useState([]); // [1,2,3]
  const [serviceTypeFilter, setServiceTypeFilter] = useState([]); // ['electrical']
  // clustering state
  const [clusterIndex, setClusterIndex] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [clusterAnnouncement, setClusterAnnouncement] = useState('');

  // Area colors for different technicians
  const areaColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#f97316', '#6366f1', '#14b8a6', '#f43f5e'
  ];

  const fetchTechnicians = React.useCallback(async () => {
    try {
      const response = await getTechnicians();
      const techData = response.data.results || response.data || [];
      setTechnicians(techData);
      if (techData.length > 0 && !selectedTechnician) {
        setSelectedTechnician(techData[0].id);
        // Center map on the first technician's current location if available
        const loc = techData[0]?.current_location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(10);
        }
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technician locations.');
    }
  }, [selectedTechnician]);

  const fetchCoverageAreas = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = selectedTechnician ? { technician: selectedTechnician } : {};
      const [areasResp, shapesResp] = await Promise.all([
        getCoverageAreas(params),
        getCoverageShapes(params)
      ]);
      const areas = areasResp.data.results || areasResp.data || [];
      const areasMapped = areas.map(a => ({ ...a, _source: 'legacy' }));
      // Keep raw shapes for circle rendering
      const rawShapes = (shapesResp.data.results || shapesResp.data || []);
      const polygonShapes = rawShapes
        .filter((s) => s.area_type === 'polygon' && s.geometry?.coordinates)
        .map((s) => ({
          id: s.id,
          name: s.name || 'Shape',
          description: s.description || '',
          area_type: 'polygon',
          coordinates: s.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          color: s.color,
          priority_level: s.priority_level,
          technician: s.technician,
          technician_name: s.technician_name,
          is_active: s.is_active,
          properties: s.properties || {},
          _source: 'shape',
        }));

      const circles = rawShapes
        .filter((s) => s.area_type === 'circle' && s.geometry?.center && typeof s.geometry?.radius_m === 'number')
        .map((s) => ({
          id: s.id,
          name: s.name || 'Circle',
          description: s.description || '',
          area_type: 'circle',
          center: [s.geometry.center[1], s.geometry.center[0]], // [lat,lng]
          radius_m: s.geometry.radius_m,
          color: s.color,
          priority_level: s.priority_level,
          technician: s.technician,
          technician_name: s.technician_name,
          is_active: s.is_active,
          properties: s.properties || {},
        }));

    setCoverageAreas([...areasMapped, ...polygonShapes]);
      setCircleShapes(circles);
      setCircleDraft(null);
      setSelectedArea(null);
    } catch (err) {
      console.error('Error fetching coverage areas:', err);
      setError('Failed to load coverage areas. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTechnician]);

  useEffect(() => {
    if (!technicianId) {
      fetchTechnicians();
    }
    fetchCoverageAreas();
  }, [technicianId, fetchTechnicians, fetchCoverageAreas]);

  useEffect(() => {
    if (selectedTechnician) {
      fetchCoverageAreas();
    }
  }, [selectedTechnician, fetchCoverageAreas]);

  // Initialize filters from URL on first render
  useEffect(() => {
    const pri = searchParams.get('priority');
    const svc = searchParams.get('services');
    if (pri) {
      const vals = pri
        .split(',')
        .map((v) => parseInt(v, 10))
        .filter((n) => [1, 2, 3].includes(n));
      if (vals.length) setPriorityFilter(vals);
    }
    if (svc) {
      const vals = svc
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (vals.length) setServiceTypeFilter(vals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAreaClick = (area) => {
    setSelectedArea(area);
    if (onAreaSelect) {
      onAreaSelect(area);
    }
  };

  const startDrawing = (mode) => {
    setDrawingMode(mode);
    setIsDrawing(true);
    setDrawingPoints([]);
    setEditingArea(null);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setDrawingMode(null);
    setDrawingPoints([]);
  };

  // Context menu helpers
  const openContextMenu = (leafletEventOrPos, area, anchorEl) => {
    const container = mapContainerRef.current;
    const rect = container ? container.getBoundingClientRect() : null;
    let clientX;
    let clientY;
    const evt = leafletEventOrPos?.originalEvent || leafletEventOrPos;
    if (evt && typeof evt.clientX === 'number' && typeof evt.clientY === 'number') {
      clientX = evt.clientX;
      clientY = evt.clientY;
      if (evt.preventDefault) evt.preventDefault();
    } else if (anchorEl && anchorEl.getBoundingClientRect) {
      const b = anchorEl.getBoundingClientRect();
      clientX = b.left + b.width;
      clientY = b.top + b.height;
    }
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      const left = rect ? Math.max(0, Math.min(clientX - rect.left, rect.width - 160)) : clientX;
      const top = rect ? Math.max(0, Math.min(clientY - rect.top, rect.height - 80)) : clientY;
      setContextMenu({ x: left, y: top, area });
    }
  };
  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!contextMenu) return;
      // Close when clicking outside the menu
      const menuEl = document.getElementById('coverage-context-menu');
      if (menuEl && !menuEl.contains(e.target)) {
        closeContextMenu();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeContextMenu();
    };
    document.addEventListener('mousedown', handleGlobalClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);

  const handleMapClick = (e) => {
    if (isDrawing && drawingMode === 'polygon') {
      const newPoint = [e.latlng.lat, e.latlng.lng];
      setDrawingPoints(prev => [...prev, newPoint]);
    } else if (isDrawing && drawingMode === 'circle') {
      const center = [e.latlng.lat, e.latlng.lng];
      setCircleDraft({ center, radius_m: 500 });
    }
  };

  const finishPolygonDrawing = () => {
    if (drawingPoints.length >= 3) {
      const newArea = {
        name: `Area ${coverageAreas.length + 1}`,
        area_type: 'polygon',
        coordinates: drawingPoints,
        technician: selectedTechnician,
        color: areaColors[coverageAreas.length % areaColors.length],
        description: ''
      };
      setEditingArea(newArea);
      setShowAreaForm(true);
    }
    stopDrawing();
  };

  const finishCircleDrawing = async () => {
    if (!circleDraft || !selectedTechnician) { stopDrawing(); return; }
    const geometry = {
      center: [circleDraft.center[1], circleDraft.center[0]], // [lng,lat]
      radius_m: circleDraft.radius_m,
    };
    const payload = {
      technician: selectedTechnician,
      area_type: 'circle',
      geometry,
      color: areaColors[coverageAreas.length % areaColors.length],
      priority_level: 2,
      name: `Circle ${coverageAreas.length + 1}`,
    };
    try {
      await createCoverageShape(payload);
      await fetchCoverageAreas();
    } catch (err) {
      console.error('Failed to save circle', err);
      setError('Failed to save circle area.');
    } finally {
      stopDrawing();
    }
  };

  const getAreaColor = (area, index) => {
    // Priority-based color mapping expected by tests
    if (area.priority_level) {
      if (area.priority_level === 1) return '#EF4444'; // High - red
      if (area.priority_level === 2) return '#F59E0B'; // Medium - amber
      if (area.priority_level === 3) return '#10B981'; // Low - green
    }
    return (area.color || areaColors[index % areaColors.length]).toUpperCase();
  };

  // Filters and analytics
  const filtersActive = priorityFilter.length > 0 || serviceTypeFilter.length > 0;
  const passPriority = React.useCallback((p) => (priorityFilter.length ? priorityFilter.includes(p || 0) : true), [priorityFilter]);
  const passServices = React.useCallback((props) => {
    if (!serviceTypeFilter.length) return true;
    const arr = props?.service_types || [];
    const lower = arr.map((x) => String(x).toLowerCase());
    return serviceTypeFilter.every((s) => lower.includes(String(s).toLowerCase()));
  }, [serviceTypeFilter]);
  const filteredPolygons = useMemo(
    () => coverageAreas.filter((a) => passPriority(a.priority_level) && passServices(a.properties)),
    [coverageAreas, passPriority, passServices]
  );
  const filteredCircles = useMemo(
    () => circleShapes.filter((c) => passPriority(c.priority_level) && passServices(c.properties)),
    [circleShapes, passPriority, passServices]
  );
  const displayAreas = useMemo(() => [...filteredPolygons, ...filteredCircles], [filteredPolygons, filteredCircles]);
  // Server-side analytics summary
  const [analytics, setAnalytics] = useState({ total: 0, byPriority: { 1: 0, 2: 0, 3: 0 } });

  useEffect(() => {
    const params = {};
    if (selectedTechnician) params.technician = selectedTechnician;
    // When filters are set, pass them along so server aggregates match UI
    if (priorityFilter.length) params.priority_level = priorityFilter; // server will treat as IN if supported
    if (serviceTypeFilter.length) params.service_type = serviceTypeFilter[0]; // simplify: require all service types locally

    let cancelled = false;
    (async () => {
      try {
        const resp = await getCoverageShapeSummary(params);
        const d = resp?.data || {};
        // Normalize for UI
        const byPriority = { 1: 0, 2: 0, 3: 0 };
        const bp = d.by_priority_level || {};
        [1, 2, 3].forEach((p) => {
          const key = String(p);
          const val = bp[key] ?? 0;
          byPriority[p] = typeof val === 'number' ? val : parseInt(val, 10) || 0;
        });
        if (!cancelled) setAnalytics({ total: d.total || 0, byPriority });
  } catch {
        // Fallback to local computation if server summary unavailable
        const all = [...filteredPolygons, ...filteredCircles];
        const total = all.length;
        const byPriority = { 1: 0, 2: 0, 3: 0 };
        all.forEach((a) => {
          const p = a.priority_level;
          if (p && byPriority[p] !== undefined) byPriority[p] += 1;
        });
        if (!cancelled) setAnalytics({ total, byPriority });
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTechnician, priorityFilter, serviceTypeFilter, filteredPolygons, filteredCircles]);

  // Sync filters to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (priorityFilter.length) next.set('priority', priorityFilter.join(','));
    else next.delete('priority');
    if (serviceTypeFilter.length) next.set('services', serviceTypeFilter.join(','));
    else next.delete('services');
    setSearchParams(next, { replace: true });
  }, [priorityFilter, serviceTypeFilter, searchParams, setSearchParams]);

  // Build cluster index when data changes
  useEffect(() => {
    const threshold = 200; // enable clustering when many items
    const points = createPointsFromData({
      technicians,
      polygons: filteredPolygons,
      circles: filteredCircles,
    });
    if (points.length >= threshold) {
      try {
        const idx = buildClusterIndex(points, { radius: 70, maxZoom: 18 });
        setClusterIndex(idx);
      } catch (err) {
        console.warn('Clustering disabled (supercluster missing or failed):', err);
        setClusterIndex(null);
      }
    } else {
      setClusterIndex(null);
    }
  }, [technicians, filteredPolygons, filteredCircles]);

  // Update visible clusters on map move/zoom
  const ClusterUpdater = () => {
    const map = useMap();
    useEffect(() => {
      if (!clusterIndex) return;
      const b = map.getBounds();
      const z = map.getZoom();
      const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
      const items = getClusters(clusterIndex, bbox, z);
      setClusters(items);
  // re-run when map instance changes
  }, [map]);
    useMapEvents({
      moveend() {
        if (!clusterIndex) return;
        const b = map.getBounds();
        const z = map.getZoom();
        const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
        const items = getClusters(clusterIndex, bbox, z);
        setClusters(items);
      },
      zoomend() {
        if (!clusterIndex) return;
        const b = map.getBounds();
        const z = map.getZoom();
        const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
        const items = getClusters(clusterIndex, bbox, z);
        setClusters(items);
      }
    });
    return null;
  };

  const searchLocation = async () => {
    if (!searchAddress.trim()) return;

    try {
      // Using Nominatim API for geocoding (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMapZoom(12);
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) {
      console.error('Error searching location:', err);
      setError('Failed to search location. Please try again.');
    }
  };



  // Map event handler component
  const MapEventHandler = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  // Map center controller component
  const MapController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
      if (center && zoom) {
        map.setView(center, zoom);
      }
    }, [center, zoom, map]);

    return null;
  };

  if (loading && !coverageAreas.length) {
    return (
      <div>
        <div role="status">Loading Coverage Areas...</div>
        <div data-testid="map-skeleton"><LoadingSkeleton variant="rectangle" height="400px" /></div>
      </div>
    );
  }

  return (
    <div className="coverage-area-map space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coverage Area Map</h1>
          <p className="text-gray-600">
            Manage service territories and technician coverage areas
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Technician Selector */}
          {!technicianId && (
            <div className="min-w-48">
              <select
                value={selectedTechnician || ''}
                onChange={(e) => setSelectedTechnician(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Technicians</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={fetchCoverageAreas}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Map Controls</h2>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Location Search */}
          <div className="flex-1 min-w-64">
            <div className="flex">
              <input
                type="text"
                placeholder="Search for address or location..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={searchLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>

          {/* Drawing Controls */}
          {selectedTechnician && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Draw Area:</span>
              <button
                onClick={() => startDrawing('polygon')}
                disabled={isDrawing}
                className={`px-3 py-2 text-sm font-medium rounded ${
                  isDrawing && drawingMode === 'polygon'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                } disabled:opacity-50`}
              >
                Polygon
              </button>
              <button
                onClick={() => startDrawing('circle')}
                disabled={isDrawing}
                className={`px-3 py-2 text-sm font-medium rounded ${
                  isDrawing && drawingMode === 'circle'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                } disabled:opacity-50`}
                aria-label="Draw Circle"
              >
                Circle
              </button>
              {isDrawing && drawingMode === 'polygon' && (
                <div className="flex space-x-2">
                  <button
                    onClick={finishPolygonDrawing}
                    disabled={drawingPoints.length < 3}
                    className="px-3 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Finish ({drawingPoints.length} points)
                  </button>
                  <button
                    onClick={stopDrawing}
                    className="px-3 py-2 text-sm font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {isDrawing && drawingMode === 'circle' && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm" htmlFor="circle-radius">Radius (m):</label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={circleDraft?.radius_m || 500}
                    onChange={(e) => setCircleDraft(d => ({ ...(d||{center: mapCenter}), radius_m: Number(e.target.value) }))}
                    className="w-28 px-2 py-1 border border-gray-300 rounded"
                    aria-label="Circle Radius"
                    id="circle-radius"
                  />
                  <button
                    onClick={finishCircleDrawing}
                    className="px-3 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save Circle
                  </button>
                  <button
                    onClick={stopDrawing}
                    className="px-3 py-2 text-sm font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((p) => (
                <label key={p} className="inline-flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={priorityFilter.includes(p)}
                    onChange={(e) => {
                      setPriorityFilter((prev) =>
                        e.target.checked ? [...prev, p] : prev.filter((x) => x !== p)
                      );
                    }}
                  />
                  Priority {p}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="service-types" className="text-sm font-medium text-gray-700">Service types</label>
            <input
              id="service-types"
              type="text"
              placeholder="e.g., electrical,hvac"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={serviceTypeFilter.join(',')}
              onChange={(e) => {
                const vals = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                setServiceTypeFilter(vals);
              }}
            />
          </div>
        </div>

        {/* Drawing Instructions */}
        {isDrawing && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              {drawingMode === 'polygon' && 'Click on the map to add points to your polygon. You need at least 3 points to complete the area.'}
            </p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div ref={mapContainerRef} className="map-container" style={{ height: '600px', width: '100%', position: 'relative' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <MapController center={mapCenter} zoom={mapZoom} />
            <MapEventHandler />
            <ClusterUpdater />

            {/* Render existing coverage areas */}
            {(filtersActive ? filteredPolygons : coverageAreas).map((area, index) => {
              const color = getAreaColor(area, index);

              if (area.area_type === 'polygon' && area.coordinates) {
                return (
                  <Polygon
                    key={area.id}
                    positions={area.coordinates}
                    color={color}
                    fillColor={color}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => handleAreaClick(area),
                      contextmenu: (e) => openContextMenu(e, area)
                    }}
                  >
                    <Popup>
                      <div className="area-popup">
                        <h4 className="font-semibold">{area.name}</h4>
                        <p className="text-sm text-gray-600">
                          Technician: {area.technician_name || 'Unknown'}
                        </p>
                        {typeof area.priority_level !== 'undefined' && (
                          <p className="text-sm text-gray-600">Priority: {area.priority_level}</p>
                        )}
                        {area.description && (
                          <p className="text-sm mt-1">{area.description}</p>
                        )}
                        <div className="mt-2 space-x-2">
                          <button
                            onClick={() => {
                              setEditingArea(area);
                              setShowAreaForm(true);
                            }}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                );
              }

              return null;
            })}

            {/* Render circle shapes drafted (preview while drawing) */}
            {isDrawing && drawingMode === 'circle' && circleDraft && (
              <Marker position={circleDraft.center}>
                <Popup>Circle center</Popup>
              </Marker>
            )}

            {/* Render persisted circle shapes */}
            {(filtersActive ? filteredCircles : circleShapes).map((c, idx) => {
              const color = getAreaColor(c, idx);
              return (
                <Circle
                  key={`circle-${c.id}`}
                  center={c.center}
                  radius={c.radius_m}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }}
                  eventHandlers={{ contextmenu: (e) => openContextMenu(e, c) }}
                >
                  <Popup>
                    <div className="area-popup">
                      <h4 className="font-semibold">{c.name}</h4>
                      <p className="text-sm text-gray-600">Technician: {c.technician_name || 'Unknown'}</p>
                      {typeof c.priority_level !== 'undefined' && (
                        <p className="text-sm text-gray-600">Priority: {c.priority_level}</p>
                      )}
                      {c.description && (
                        <p className="text-sm mt-1">{c.description}</p>
                      )}
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            {/* Clusters or technician markers */}
            {clusterIndex && clusters.length > 0 ? (
              clusters.map((c) => {
                const [lng, lat] = c.geometry.coordinates;
                const isCluster = c.properties.cluster;
                if (isCluster) {
                  const count = c.properties.point_count_abbreviated || c.properties.point_count;
                  const icon = L.divIcon({
                    html: `<div class="cluster-badge">${count}</div>`,
                    className: 'cluster-icon',
                    iconSize: [30, 30],
                  });
                  return (
                    <Marker
                      key={`cluster-${c.id}`}
                      position={[lat, lng]}
                      icon={icon}
                      eventHandlers={{
                        click: () => {
                          const map = mapRef.current;
                          if (map && map?.flyTo) map.flyTo([lat, lng], Math.min(map.getZoom() + 2, 19));
                          setClusterAnnouncement(`Expanded cluster to show around ${count} items`);
                        },
                      }}
                    >
                      <Popup>
                        <div>{count} items</div>
                      </Popup>
                    </Marker>
                  );
                }
                return (
                  <Marker key={`pt-${c.properties.pointId || `${lat}-${lng}`}`} position={[lat, lng]} data-testid="cluster-point" />
                );
              })
            ) : (
              technicians
                .filter(t => t?.current_location && typeof t.current_location.lat === 'number' && typeof t.current_location.lng === 'number')
                .map(t => (
                  <Marker key={t.id} position={[t.current_location.lat, t.current_location.lng]}>
                    <Popup>
                      <div>
                        <div className="font-semibold">{t.first_name} {t.last_name}</div>
                        {t.email && <div className="text-sm text-gray-700">{t.email}</div>}
                        <div className="text-xs text-gray-500">Last updated: {t.current_location.updated_at || '—'}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))
            )}

            {/* Render drawing points */}
            {drawingPoints.map((point, index) => (
              <Marker key={index} position={point}>
                <Popup>Point {index + 1}</Popup>
              </Marker>
            ))}

            {/* Render drawing polygon preview */}
            {drawingPoints.length >= 2 && (
              <Polygon
                positions={drawingPoints}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}
          </MapContainer>

          {/* Context Menu Overlay */}
          {contextMenu && (
            <div
              id="coverage-context-menu"
              role="menu"
              aria-label="Coverage area actions"
              className="absolute bg-white border border-gray-200 rounded shadow-lg z-10"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                role="menuitem"
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setEditingArea(contextMenu.area);
                  setShowAreaForm(true);
                  closeContextMenu();
                }}
              >
                Edit
              </button>
              <button
                role="menuitem"
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  closeContextMenu();
                  handleDeleteArea(contextMenu.area.id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analytics + Area Summary */}
      {(coverageAreas.length + circleShapes.length) > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="sr-only" aria-live="polite" data-testid="cluster-announcer">{clusterAnnouncement}</div>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-56">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <ul className="text-sm text-gray-700 space-y-1" aria-label="Coverage analytics">
                <li data-testid="analytics-total">Total Areas: {analytics.total}</li>
                <li>Priority 1: {analytics.byPriority[1]}</li>
                <li>Priority 2: {analytics.byPriority[2]}</li>
                <li>Priority 3: {analytics.byPriority[3]}</li>
              </ul>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Coverage Areas Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(filtersActive ? displayAreas : [...coverageAreas, ...circleShapes]).map((area, index) => {
              const color = getAreaColor(area, index);
              return (
                <div
                  key={area.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedArea?.id === area.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAreaClick(area);
                    }
                  }}
                  onClick={() => handleAreaClick(area)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div
                          className="w-4 h-4 rounded border-2 border-white shadow"
                          style={{ backgroundColor: color }}
                        />
                        <h4 className="font-medium text-gray-900">{area.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">Technician: {area.technician_name || 'Unknown'}</p>
                      {Array.isArray(area.properties?.service_types) && area.properties.service_types.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Services: {area.properties.service_types.join(', ')}</p>
                      )}
                      {area.description && (
                        <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingArea(area);
                          setShowAreaForm(true);
                        }}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArea(area.id);
                        }}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                      <button
                        aria-haspopup="menu"
                        aria-label="More actions"
                        onClick={(e) => {
                          e.stopPropagation();
                          openContextMenu(null, area, e.currentTarget);
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded"
                      >
                        •••
                      </button>
                    </div>
                  </div>
                </div>
              );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Area Form Modal */}
      {showAreaForm && (
        <AreaFormModal
          area={editingArea}
          technicians={technicians}
          selectedTechnician={selectedTechnician}
          onSave={handleSaveArea}
          onClose={() => {
            setShowAreaForm(false);
            setEditingArea(null);
          }}
        />
      )}
    </div>
  );

  // Helper functions
  async function handleSaveArea(areaData) {
    try {
      const isShape = editingArea?._source === 'shape' || areaData.area_type === 'polygon';
      if (isShape) {
        const geometry = {
          coordinates: (areaData.coordinates || []).map(([lat, lng]) => [lng, lat])
        };
        const payload = {
          name: areaData.name,
          description: areaData.description,
          technician: areaData.technician,
          color: areaData.color,
          area_type: 'polygon',
          geometry,
        };
        if (editingArea && editingArea.id) {
          await updateCoverageShape(editingArea.id, payload);
        } else {
          await createCoverageShape(payload);
        }
      } else {
        if (editingArea && editingArea.id) {
          await updateCoverageArea(editingArea.id, areaData);
        } else {
          await createCoverageArea(areaData);
        }
      }

      await fetchCoverageAreas();
      setShowAreaForm(false);
      setEditingArea(null);

    } catch (err) {
      console.error('Error saving area:', err);
      setError('Failed to save coverage area. Please try again.');
    }
  }

  async function handleDeleteArea(areaId) {
    if (!window.confirm('Are you sure you want to delete this coverage area?')) {
      return;
    }

    try {
      const area = coverageAreas.find(a => a.id === areaId);
      if (area && area._source === 'shape') {
        await deleteCoverageShape(areaId);
      } else {
        await deleteCoverageArea(areaId);
      }
      await fetchCoverageAreas();
      setSelectedArea(null);
    } catch (err) {
      console.error('Error deleting area:', err);
      setError('Failed to delete coverage area. Please try again.');
    }
  }
};

// Area Form Modal Component
const AreaFormModal = ({ area, technicians, selectedTechnician, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    technician: selectedTechnician || '',
    color: '#3b82f6',
    coordinates: [],
    area_type: 'polygon'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name || '',
        description: area.description || '',
        technician: area.technician || selectedTechnician || '',
        color: area.color || '#3b82f6',
        coordinates: area.coordinates || [],
        area_type: area.area_type || 'polygon'
      });
    }
  }, [area, selectedTechnician]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Area name is required.');
      return;
    }

    if (!formData.technician) {
      setError('Please select a technician.');
      return;
    }

    if (!formData.coordinates || formData.coordinates.length < 3) {
      setError('Invalid area coordinates.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await onSave(formData);

    } catch (err) {
      console.error('Error saving area:', err);
      setError('Failed to save area. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {area?.id ? 'Edit Coverage Area' : 'Add Coverage Area'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area-name">
              Area Name
            </label>
            <input
              id="area-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter area name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area-tech">
              Technician
            </label>
            <select
              id="area-tech"
              value={formData.technician}
              onChange={(e) => setFormData(prev => ({ ...prev, technician: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Technician</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.first_name} {tech.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area-color">
              Color
            </label>
            <input
              id="area-color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="area-desc">
              Description
            </label>
            <textarea
              id="area-desc"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : (area?.id ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoverageAreaMap;
