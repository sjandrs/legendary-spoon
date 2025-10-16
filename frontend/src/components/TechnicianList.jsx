import React, { useState, useEffect, useMemo } from 'react';
import FixedSizeList from 'react-window/dist/es/FixedSizeList';
import { useSearchParams } from 'react-router-dom';
import { getTechnicians, getCertifications } from '../api';
import LoadingSkeleton from './LoadingSkeleton';

const TechnicianList = ({ onTechnicianSelect, onTechnicianEdit, onTechnicianDelete }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    is_active: '',
    hire_date_from: '',
    hire_date_to: '',
    min_hourly_rate: '',
    max_hourly_rate: '',
    certification: '',
    tech_level_min: '',
    tech_level_max: '',
    certification_status: '', // active|expired
    coverage_presence: '', // true|false
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [certifications, setCertifications] = useState([]);

  // Fetch technicians with filters
  const fetchTechnicians = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add active filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '') {
          params[key] = value;
        }
      });

      const response = await getTechnicians(params);
      setTechnicians(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // Load certifications for filter dropdown
  useEffect(() => {
    (async () => {
      try {
        const resp = await getCertifications();
        setCertifications(resp.data.results || resp.data || []);
      } catch {
        // Non-fatal
      }
    })();
    // Initialize filters from URL
    const urlFilters = {};
    ['is_active','hire_date_from','hire_date_to','min_hourly_rate','max_hourly_rate','certification','tech_level_min','tech_level_max','certification_status','coverage_presence']
      .forEach((k) => {
        const v = searchParams.get(k);
        if (v !== null) urlFilters[k] = v;
      });
    if (Object.keys(urlFilters).length) {
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    fetchTechnicians();
  }, [debouncedSearchTerm, fetchTechnicians]);

  // Sync filters to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '') next.set(k, v); else next.delete(k);
    });
    setSearchParams(next, { replace: true });
  }, [filters, searchParams, setSearchParams]);

  // Filter technicians for additional client-side filtering
  const filteredTechnicians = useMemo(() => {
    return technicians.filter(technician => {
      // Additional client-side search through name, employee_id, phone
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${technician.first_name} ${technician.last_name}`.toLowerCase();
        const employeeId = (technician.employee_id || '').toLowerCase();
        const phone = (technician.phone || '').toLowerCase();

        if (!fullName.includes(term) && !employeeId.includes(term) && !phone.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [technicians, searchTerm]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      is_active: '',
      hire_date_from: '',
      hire_date_to: '',
      min_hourly_rate: '',
      max_hourly_rate: '',
      certification: '',
      tech_level_min: '',
      tech_level_max: '',
      certification_status: '',
      coverage_presence: '',
    });
  };

  // Virtualized row component
  const TechnicianRow = ({ index, style }) => {
    const technician = filteredTechnicians[index];

    return (
      <div role="listitem" style={style} className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50">
        <div className="flex-shrink-0 h-12 w-12">
          <img
            className="h-12 w-12 rounded-full object-cover"
            src={technician.photo || '/default-avatar.png'}
            alt={`${technician.first_name} ${technician.last_name}`}
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>

        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {technician.first_name} {technician.last_name}
              </h3>
              <p className="text-sm text-gray-500">
                ID: {technician.employee_id} | {technician.email}
              </p>
              <p className="text-sm text-gray-500">
                Phone: {technician.phone} | Rate: ${technician.base_hourly_rate}/hr
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                technician.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {technician.is_active ? 'Active' : 'Inactive'}
              </span>

              <div className="flex space-x-1">
                <button
                  onClick={() => onTechnicianSelect?.(technician)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                  aria-label={`View details for ${technician.first_name} ${technician.last_name}`}
                >
                  View
                </button>
                <button
                  onClick={() => onTechnicianEdit?.(technician)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm ml-2"
                  aria-label={`Edit ${technician.first_name} ${technician.last_name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onTechnicianDelete?.(technician)}
                  className="text-red-600 hover:text-red-900 text-sm ml-2"
                  aria-label={`Delete ${technician.first_name} ${technician.last_name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchTechnicians}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Active Status Filter */}
          <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="is_active"
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Certification */}
          <div>
            <label htmlFor="certification" className="block text-sm font-medium text-gray-700 mb-1">
              Certification
            </label>
            <select
              id="certification"
              value={filters.certification}
              onChange={(e) => handleFilterChange('certification', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {certifications.map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Level {c.tech_level})</option>
              ))}
            </select>
          </div>

          {/* Hourly Rate Range */}
          <div className="md:col-span-2 lg:col-span-1">
            <label htmlFor="rate-minmax" className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate Range
            </label>
            <div id="rate-minmax" className="flex space-x-2">
              <input
                type="number"
                value={filters.min_hourly_rate}
                onChange={(e) => handleFilterChange('min_hourly_rate', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={filters.max_hourly_rate}
                onChange={(e) => handleFilterChange('max_hourly_rate', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tech Level Range */}
          <div className="md:col-span-2 lg:col-span-1">
            <label htmlFor="level-minmax" className="block text-sm font-medium text-gray-700 mb-1">
              Tech Level Range
            </label>
            <div id="level-minmax" className="flex space-x-2">
              <input
                type="number"
                value={filters.tech_level_min}
                onChange={(e) => handleFilterChange('tech_level_min', e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={filters.tech_level_max}
                onChange={(e) => handleFilterChange('tech_level_max', e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Certification Status */}
          <div>
            <label htmlFor="cert_status" className="block text-sm font-medium text-gray-700 mb-1">
              Certification Status
            </label>
            <select
              id="cert_status"
              value={filters.certification_status}
              onChange={(e) => handleFilterChange('certification_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Coverage Presence */}
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.coverage_presence === 'true'}
                onChange={(e) => handleFilterChange('coverage_presence', e.target.checked ? 'true' : '')}
              />
              Has Coverage
            </label>
          </div>

          {/* Hire Date Range */}
          <div className="md:col-span-2 lg:col-span-2">
            <label htmlFor="hire-dates" className="block text-sm font-medium text-gray-700 mb-1">
              Hire Date Range
            </label>
            <div id="hire-dates" className="flex space-x-2">
              <input
                type="date"
                value={filters.hire_date_from}
                onChange={(e) => handleFilterChange('hire_date_from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="date"
                value={filters.hire_date_to}
                onChange={(e) => handleFilterChange('hire_date_to', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Clear Filters */}
          <div className="md:col-span-3 lg:col-span-1 flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Virtualized List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        {filteredTechnicians.length > 0 ? (
          <div style={{ height: '600px' }} className="technician-list" role="list" aria-label="Technicians">
            <List
              height={600}
              itemCount={filteredTechnicians.length}
              itemSize={96}
              width={'100%'}
            >
              {({ index, style }) => (
                <TechnicianRow index={index} style={style} />
              )}
            </List>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No technicians found matching your criteria.</p>
            {(searchTerm || Object.values(filters).some(v => v !== '')) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters to show all technicians
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianList;
