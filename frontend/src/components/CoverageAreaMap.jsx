import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  getCoverageAreas,
  createCoverageArea,
  updateCoverageArea,
  deleteCoverageArea,
  getTechnicians
} from '../api';
import LoadingSkeleton from './LoadingSkeleton';
import 'leaflet/dist/leaflet.css';
import './CoverageAreaMap.css';

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
  const [drawingMode, setDrawingMode] = useState(null); // 'polygon', 'circle', 'rectangle'
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [mapCenter, setMapCenter] = useState([39.8283, -98.5795]); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [searchAddress, setSearchAddress] = useState('');
  const [drawingPoints, setDrawingPoints] = useState([]);
  const mapRef = useRef(null);

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
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians.');
    }
  }, [selectedTechnician]);

  const fetchCoverageAreas = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = selectedTechnician ? { technician: selectedTechnician } : {};
      const response = await getCoverageAreas(params);
      const areas = response.data.results || response.data || [];

      setCoverageAreas(areas);
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

  const handleMapClick = (e) => {
    if (isDrawing && drawingMode === 'polygon') {
      const newPoint = [e.latlng.lat, e.latlng.lng];
      setDrawingPoints(prev => [...prev, newPoint]);
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

  const getAreaColor = (area, index) => {
    return area.color || areaColors[index % areaColors.length];
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
    return <LoadingSkeleton />;
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
            </div>
          )}
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
        <div className="map-container" style={{ height: '600px', width: '100%' }}>
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

            {/* Render existing coverage areas */}
            {coverageAreas.map((area, index) => {
              const color = getAreaColor(area, index);

              if (area.area_type === 'polygon' && area.coordinates) {
                return (
                  <Polygon
                    key={area.id}
                    positions={area.coordinates}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => handleAreaClick(area)
                    }}
                  >
                    <Popup>
                      <div className="area-popup">
                        <h4 className="font-semibold">{area.name}</h4>
                        <p className="text-sm text-gray-600">
                          Technician: {area.technician_name || 'Unknown'}
                        </p>
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
        </div>
      </div>

      {/* Area Summary */}
      {coverageAreas.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Coverage Areas Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverageAreas.map((area, index) => {
              const color = getAreaColor(area, index);
              return (
                <div
                  key={area.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedArea?.id === area.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
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
                      <p className="text-sm text-gray-600">
                        Technician: {area.technician_name || 'Unknown'}
                      </p>
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
                    </div>
                  </div>
                </div>
              );
            })}
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
      if (editingArea && editingArea.id) {
        await updateCoverageArea(editingArea.id, areaData);
      } else {
        await createCoverageArea(areaData);
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
      await deleteCoverageArea(areaId);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter area name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician
            </label>
            <select
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
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
