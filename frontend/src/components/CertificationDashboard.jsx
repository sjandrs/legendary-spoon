import React, { useState, useEffect, useMemo } from 'react';
import { getCertifications, getTechnicianCertifications } from '../api';
import LoadingSkeleton from './LoadingSkeleton';
import './CertificationDashboard.css';

const CertificationDashboard = ({ technicianId = null }) => {
  const [certifications, setCertifications] = useState([]);
  const [technicianCertifications, setTechnicianCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    tech_level: '',
    status: '', // active, expiring, expired
    requires_renewal: ''
  });
  const [selectedCertifications, setSelectedCertifications] = useState([]);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalCertification, setRenewalCertification] = useState(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all certifications and technician-specific certifications
      const [certsResponse, techCertsResponse] = await Promise.allSettled([
        getCertifications(),
        technicianId ? getTechnicianCertifications({ technician: technicianId }) : getTechnicianCertifications()
      ]);

      if (certsResponse.status === 'fulfilled') {
        setCertifications(certsResponse.value.data.results || certsResponse.value.data || []);
      } else {
        console.error('Failed to fetch certifications:', certsResponse.reason);
      }

      if (techCertsResponse.status === 'fulfilled') {
        setTechnicianCertifications(techCertsResponse.value.data.results || techCertsResponse.value.data || []);
      } else {
        console.error('Failed to fetch technician certifications:', techCertsResponse.reason);
      }

    } catch (err) {
      console.error('Error fetching certification data:', err);
      setError('Failed to load certification data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate certification status
  const getCertificationStatus = (certification) => {
    if (!certification.expiration_date) return 'active';

    const expirationDate = new Date(certification.expiration_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysFromNow = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));

    if (expirationDate < today) return 'expired';
    if (expirationDate < thirtyDaysFromNow) return 'critical';
    if (expirationDate < ninetyDaysFromNow) return 'expiring';
    return 'active';
  };

  // Get status counts for dashboard metrics
  const statusCounts = useMemo(() => {
    const counts = { active: 0, expiring: 0, critical: 0, expired: 0, total: 0 };

    technicianCertifications.forEach(techCert => {
      if (techCert.certification) {
        const status = getCertificationStatus({
          expiration_date: techCert.expiration_date || techCert.certification.expiration_date
        });
        counts[status]++;
        counts.total++;
      }
    });

    return counts;
  }, [technicianCertifications]);

  // Filter certifications based on current filters
  const filteredCertifications = useMemo(() => {
    return technicianCertifications.filter(techCert => {
      if (!techCert.certification) return false;

      // Category filter
      if (filters.category && techCert.certification.category !== filters.category) {
        return false;
      }

      // Tech level filter
      if (filters.tech_level && techCert.certification.tech_level !== filters.tech_level) {
        return false;
      }

      // Status filter
      if (filters.status) {
        const status = getCertificationStatus({
          expiration_date: techCert.expiration_date || techCert.certification.expiration_date
        });
        if (status !== filters.status) return false;
      }

      // Requires renewal filter
      if (filters.requires_renewal && techCert.certification.requires_renewal.toString() !== filters.requires_renewal) {
        return false;
      }

      return true;
    });
  }, [technicianCertifications, filters]);

  // Get unique categories and tech levels for filters
  const filterOptions = useMemo(() => {
    const categories = [...new Set(certifications.map(cert => cert.category).filter(Boolean))];
    const techLevels = [...new Set(certifications.map(cert => cert.tech_level).filter(Boolean))];

    return { categories, techLevels };
  }, [certifications]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      tech_level: '',
      status: '',
      requires_renewal: ''
    });
  };

  const handleRenewal = (techCert) => {
    setRenewalCertification(techCert);
    setShowRenewalModal(true);
  };

  const handleBulkRenewal = () => {
    // Handle bulk renewal for selected certifications
    console.log('Bulk renewal for:', selectedCertifications);
    // Implementation would go here
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Active', icon: '✓' },
      expiring: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Expiring Soon', icon: '⚠' },
      critical: { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Critical', icon: '⚠' },
      expired: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Expired', icon: '✗' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getDaysUntilExpiration = (dateString) => {
    if (!dateString) return null;

    const expirationDate = new Date(dateString);
    const today = new Date();
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={fetchData}
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
    <div className="certification-dashboard space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certification Dashboard</h1>
          <p className="text-gray-600">
            {technicianId ? 'Technician certifications overview' : 'All technician certifications'}
          </p>
        </div>

        <div className="flex space-x-2">
          {selectedCertifications.length > 0 && (
            <button
              onClick={handleBulkRenewal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Renew Selected ({selectedCertifications.length})
            </button>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="status-card bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">{statusCounts.total}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Total</p>
              <p className="text-xs text-gray-500">Certifications</p>
            </div>
          </div>
        </div>

        <div className="status-card bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">{statusCounts.active}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Current</p>
            </div>
          </div>
        </div>

        <div className="status-card bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">{statusCounts.expiring + statusCounts.critical}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Expiring</p>
              <p className="text-xs text-gray-500">Needs attention</p>
            </div>
          </div>
        </div>

        <div className="status-card bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">{statusCounts.expired}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Expired</p>
              <p className="text-xs text-gray-500">Requires renewal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {filterOptions.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tech Level</label>
            <select
              value={filters.tech_level}
              onChange={(e) => handleFilterChange('tech_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              {filterOptions.techLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="critical">Critical</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Certifications List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Certifications ({filteredCertifications.length})
          </h2>
        </div>

        {filteredCertifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCertifications(filteredCertifications.map(tc => tc.id));
                        } else {
                          setSelectedCertifications([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Left
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertifications.map((techCert) => {
                  const status = getCertificationStatus({
                    expiration_date: techCert.expiration_date || techCert.certification.expiration_date
                  });
                  const daysLeft = getDaysUntilExpiration(
                    techCert.expiration_date || techCert.certification.expiration_date
                  );

                  return (
                    <tr key={techCert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCertifications.includes(techCert.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCertifications(prev => [...prev, techCert.id]);
                            } else {
                              setSelectedCertifications(prev => prev.filter(id => id !== techCert.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {techCert.certification.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {techCert.certification.category} • Level {techCert.certification.tech_level}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(techCert.expiration_date || techCert.certification.expiration_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {daysLeft !== null ? (
                          <span className={daysLeft < 0 ? 'text-red-600 font-semibold' :
                                         daysLeft < 30 ? 'text-orange-600 font-semibold' :
                                         'text-gray-900'}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` :
                             daysLeft === 0 ? 'Expires today' :
                             `${daysLeft} days`}
                          </span>
                        ) : 'No expiration'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {(status === 'expiring' || status === 'critical' || status === 'expired') && (
                            <button
                              onClick={() => handleRenewal(techCert)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No certifications found matching your criteria.</p>
            {Object.values(filters).some(v => v !== '') && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters to show all certifications
              </button>
            )}
          </div>
        )}
      </div>

      {/* Renewal Modal Placeholder */}
      {showRenewalModal && renewalCertification && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Renew Certification
            </h3>
            <p className="text-gray-600 mb-4">
              Renew {renewalCertification.certification.name}?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRenewalModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle renewal logic here
                  setShowRenewalModal(false);
                  setRenewalCertification(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationDashboard;
