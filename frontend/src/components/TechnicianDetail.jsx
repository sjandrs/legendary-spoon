import React, { useState, useEffect } from 'react';
import { getTechnician, getTechnicianCertificationsById, getCoverageAreas } from '../api';
import LoadingSkeleton from './LoadingSkeleton';

const TechnicianDetail = ({ technicianId, onEdit, onClose }) => {
  const [technician, setTechnician] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [coverageAreas, setCoverageAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const [photoPreview] = useState(null);

  const fetchTechnicianData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch technician details
      const technicianResponse = await getTechnician(technicianId);
      const technicianData = technicianResponse.data;
      setTechnician(technicianData);

      // Fetch related data in parallel
      const [certificationsResponse, coverageAreasResponse] = await Promise.allSettled([
        getTechnicianCertificationsById(technicianId),
        getCoverageAreas({ technician: technicianId })
      ]);

      // Handle certifications
      if (certificationsResponse.status === 'fulfilled') {
        setCertifications(certificationsResponse.value.data.results || certificationsResponse.value.data || []);
      } else {
        console.warn('Failed to fetch certifications:', certificationsResponse.reason);
      }

      // Handle coverage areas
      if (coverageAreasResponse.status === 'fulfilled') {
        setCoverageAreas(coverageAreasResponse.value.data.results || coverageAreasResponse.value.data || []);
      } else {
        console.warn('Failed to fetch coverage areas:', coverageAreasResponse.reason);
      }

    } catch (err) {
      console.error('Error fetching technician data:', err);
      setError('Failed to load technician details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  useEffect(() => {
    if (technicianId) {
      fetchTechnicianData();
    }
  }, [technicianId, fetchTechnicianData]);

  const handlePhotoError = () => {
    setPhotoError(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCertificationStatus = (certification) => {
    if (!certification.expiration_date) return 'active';

    const expirationDate = new Date(certification.expiration_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    if (expirationDate < today) return 'expired';
    if (expirationDate < thirtyDaysFromNow) return 'expiring';
    return 'active';
  };

  const getCertificationStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      expiring: { color: 'bg-yellow-100 text-yellow-800', text: 'Expiring Soon' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
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
              <div className="mt-4 space-x-2">
                <button
                  onClick={fetchTechnicianData}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded text-sm"
                >
                  Try Again
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded text-sm"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Technician not found.</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <img
                className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg"
                src={photoPreview || (photoError ? '/default-avatar.png' : technician.photo || '/default-avatar.png')}
                alt={`${technician.first_name} ${technician.last_name}`}
                onError={handlePhotoError}
              />
              <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white ${
                technician.is_active ? 'bg-green-400' : 'bg-red-400'
              }`} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {technician.first_name} {technician.last_name}
            </h1>
            <p className="text-lg text-gray-600">Employee ID: {technician.employee_id}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                technician.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {technician.is_active ? 'Active' : 'Inactive'}
              </span>
              <span className="text-sm text-gray-500">
                Hired: {formatDate(technician.hire_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(technician)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Edit Profile
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{technician.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p className="text-gray-900">{technician.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <p className="text-gray-900">{technician.address || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
            <p className="text-gray-900">{technician.emergency_contact || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Employment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Hourly Rate</label>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(technician.base_hourly_rate)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
            <p className="text-gray-900">{formatDate(technician.hire_date)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <p className="text-gray-900">{technician.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        {technician.skills && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <p className="text-gray-900">{technician.skills}</p>
          </div>
        )}

        {technician.notes && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <p className="text-gray-900 whitespace-pre-wrap">{technician.notes}</p>
          </div>
        )}
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
          <span className="text-sm text-gray-500">{certifications.length} certifications</span>
        </div>

        {certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.map((cert, index) => {
              const status = getCertificationStatus(cert);
              return (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{cert.name}</h3>
                    {getCertificationStatusBadge(status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{cert.category}</p>
                  <div className="text-sm text-gray-500">
                    <p>Level: {cert.tech_level}</p>
                    {cert.expiration_date && (
                      <p>Expires: {formatDate(cert.expiration_date)}</p>
                    )}
                    {cert.issued_date && (
                      <p>Issued: {formatDate(cert.issued_date)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No certifications found.</p>
          </div>
        )}
      </div>

      {/* Coverage Areas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Coverage Areas</h2>
          <span className="text-sm text-gray-500">{coverageAreas.length} areas</span>
        </div>

        {coverageAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coverageAreas.map((area, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-gray-900 mb-2">{area.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Type: {area.area_type}</p>
                  {area.zip_codes && (
                    <p>ZIP Codes: {area.zip_codes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No coverage areas assigned.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDetail;
