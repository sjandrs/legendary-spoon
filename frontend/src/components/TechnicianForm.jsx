import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTechnician, updateTechnician } from '../api';
import './TechnicianForm.css';

const TechnicianForm = ({ technician, onClose, onSuccess }) => {
  const isEditing = !!technician;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      employee_id: '',
      address: '',
      emergency_contact: '',
      base_hourly_rate: '',
      hire_date: '',
      is_active: true,
      skills: '',
      notes: '',
      photo: null,
      ...technician
    }
  });

  // Watch for form changes to enable optimistic updates
  // const formData = watch(); // Currently unused, ready for optimistic updates

  useEffect(() => {
    if (technician) {
      // Populate form with technician data
      Object.keys(technician).forEach(key => {
        if (key === 'hire_date' && technician[key]) {
          // Format date for input[type="date"]
          const date = new Date(technician[key]);
          setValue(key, date.toISOString().split('T')[0]);
        } else {
          setValue(key, technician[key]);
        }
      });

      // Set photo preview if exists
      if (technician.photo) {
        setPhotoPreview(technician.photo);
      }
    }
  }, [technician, setValue]);

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      setValue('photo', file);
      setError(null);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare form data for file upload
      const formPayload = new FormData();

      // Add all form fields
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          if (key === 'photo' && data[key] instanceof File) {
            formPayload.append(key, data[key]);
          } else if (key !== 'photo') {
            formPayload.append(key, data[key]);
          }
        }
      });

      let response;
      if (isEditing) {
        response = await updateTechnician(technician.id, formPayload);
      } else {
        response = await createTechnician(formPayload);
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close form
      onClose();

    } catch (err) {
      console.error('Error saving technician:', err);

      // Handle different types of errors
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData.non_field_errors) {
          setError(errorData.non_field_errors.join(' '));
        } else {
          // Field-specific errors
          const fieldErrors = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          setError(fieldErrors);
        }
      } else {
        setError('Failed to save technician. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    onClose();
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setValue('photo', null);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Technician' : 'Create New Technician'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <img
                  className="h-20 w-20 rounded-full object-cover border-4 border-gray-200"
                  src={photoPreview || '/default-avatar.png'}
                  alt="Profile preview"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
              {photoPreview && (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                {...register('first_name', {
                  required: 'First name is required',
                  minLength: { value: 2, message: 'First name must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                {...register('last_name', {
                  required: 'Last name is required',
                  minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                {...register('employee_id', {
                  required: 'Employee ID is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.employee_id && (
                <p className="mt-1 text-sm text-red-600">{errors.employee_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                {...register('phone', {
                  pattern: {
                    value: /^[+]?[1-9][\d]{0,15}$/,
                    message: 'Invalid phone number'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                {...register('emergency_contact')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Employment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Hourly Rate *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('base_hourly_rate', {
                    required: 'Base hourly rate is required',
                    min: { value: 0, message: 'Rate must be positive' }
                  })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.base_hourly_rate && (
                <p className="mt-1 text-sm text-red-600">{errors.base_hourly_rate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date *
              </label>
              <input
                type="date"
                {...register('hire_date', {
                  required: 'Hire date is required'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.hire_date && (
                <p className="mt-1 text-sm text-red-600">{errors.hire_date.message}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills
            </label>
            <textarea
              {...register('skills')}
              rows={3}
              placeholder="List relevant skills and competencies..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Additional notes or comments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active Status</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Inactive technicians will not appear in scheduling or assignment workflows
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Technician' : 'Create Technician'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TechnicianForm;
