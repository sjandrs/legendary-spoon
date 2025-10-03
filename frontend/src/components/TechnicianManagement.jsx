import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import TechnicianForm from './TechnicianForm';

const TechnicianManagement = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch technicians
  const { data: techniciansData, isLoading, isError } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => api.get('/technicians/').then(res => res.data),
  });

  // Delete technician mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/technicians/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['technicians']);
    },
  });

  useEffect(() => {
    if (techniciansData) {
      setTechnicians(techniciansData);
    }
    setLoading(isLoading);
    setError(isError ? 'Failed to load technicians' : null);
  }, [techniciansData, isLoading, isError]);

  const handleEdit = (technician) => {
    setSelectedTechnician(technician);
    setShowForm(true);
  };

  const handleCreate = () => {
    setSelectedTechnician(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTechnician(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this technician?')) {
      deleteMutation.mutate(id);
    }
  };

  if (loading) return <div className="p-4">Loading technicians...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Technician Management</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Technician
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {technicians.map((technician) => (
              <tr key={technician.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={technician.photo || '/default-avatar.png'}
                        alt={`${technician.first_name} ${technician.last_name} profile photo`}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {technician.first_name} {technician.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {technician.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {technician.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    technician.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {technician.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(technician)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(technician.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <TechnicianForm
          technician={selectedTechnician}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default TechnicianManagement;
