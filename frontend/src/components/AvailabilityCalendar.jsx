import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  getTechnicianAvailability,
  createTechnicianAvailability,
  updateTechnicianAvailability,
  deleteTechnicianAvailability,
  getTechnicians
} from '../api';
import LoadingSkeleton from './LoadingSkeleton';
import './AvailabilityCalendar.css';

const AvailabilityCalendar = ({ technicianId = null, onAvailabilityChange }) => {
  const [availability, setAvailability] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(technicianId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarView, setCalendarView] = useState('timeGridWeek');
  const selectedDate = new Date();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editingAvailability, setEditingAvailability] = useState(null);
  const calendarRef = useRef(null);

  // Default availability templates
  const availabilityTemplates = {
    fullTime: {
      name: 'Full Time (8-5)',
      schedule: [
        { day_of_week: 1, start_time: '08:00', end_time: '17:00' }, // Monday
        { day_of_week: 2, start_time: '08:00', end_time: '17:00' }, // Tuesday
        { day_of_week: 3, start_time: '08:00', end_time: '17:00' }, // Wednesday
        { day_of_week: 4, start_time: '08:00', end_time: '17:00' }, // Thursday
        { day_of_week: 5, start_time: '08:00', end_time: '17:00' }, // Friday
      ]
    },
    partTime: {
      name: 'Part Time (9-1)',
      schedule: [
        { day_of_week: 1, start_time: '09:00', end_time: '13:00' },
        { day_of_week: 3, start_time: '09:00', end_time: '13:00' },
        { day_of_week: 5, start_time: '09:00', end_time: '13:00' },
      ]
    },
    weekend: {
      name: 'Weekend Only',
      schedule: [
        { day_of_week: 6, start_time: '08:00', end_time: '16:00' }, // Saturday
        { day_of_week: 0, start_time: '08:00', end_time: '16:00' }, // Sunday
      ]
    }
  };

  useEffect(() => {
    if (!technicianId) {
      fetchTechnicians();
    }
  }, [technicianId]);

  useEffect(() => {
    if (selectedTechnician) {
      fetchAvailability();
    }
  }, [selectedTechnician]);

  const fetchTechnicians = async () => {
    try {
      const response = await getTechnicians();
      setTechnicians(response.data.results || response.data || []);
      if (response.data.results?.length > 0 && !selectedTechnician) {
        setSelectedTechnician(response.data.results[0].id);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to load technicians.');
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = selectedTechnician ? { technician: selectedTechnician } : {};
      const response = await getTechnicianAvailability(params);
      const availabilityData = response.data.results || response.data || [];

      setAvailability(availabilityData);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Convert availability data to FullCalendar events
  const getCalendarEvents = () => {
    const events = [];

    availability.forEach(avail => {
      // Handle recurring weekly events
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week

      for (let week = 0; week < 4; week++) { // Show 4 weeks
        const eventDate = new Date(startDate);
        eventDate.setDate(eventDate.getDate() + (week * 7) + avail.day_of_week);

        const startDateTime = new Date(eventDate);
        const endDateTime = new Date(eventDate);

        // Parse time strings (HH:MM format)
        const [startHour, startMin] = avail.start_time.split(':').map(Number);
        const [endHour, endMin] = avail.end_time.split(':').map(Number);

        startDateTime.setHours(startHour, startMin, 0, 0);
        endDateTime.setHours(endHour, endMin, 0, 0);

        events.push({
          id: `${avail.id}-${week}`,
          title: `Available (${avail.start_time} - ${avail.end_time})`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: avail.is_available ? '#10b981' : '#ef4444',
          borderColor: avail.is_available ? '#059669' : '#dc2626',
          textColor: 'white',
          extendedProps: {
            availabilityId: avail.id,
            isAvailable: avail.is_available,
            dayOfWeek: avail.day_of_week,
            startTimeStr: avail.start_time,
            endTimeStr: avail.end_time,
            notes: avail.notes
          }
        });
      }
    });

    return events;
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay
    });
    setEditingAvailability(null);
    setShowCreateModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const availabilityId = clickInfo.event.extendedProps.availabilityId;
    const availabilityItem = availability.find(a => a.id === availabilityId);

    if (availabilityItem) {
      setEditingAvailability(availabilityItem);
      setSelectedSlot(null);
      setShowCreateModal(true);
    }
  };

  const handleEventDrop = async (dropInfo) => {
    const availabilityId = dropInfo.event.extendedProps.availabilityId;
    const availabilityItem = availability.find(a => a.id === availabilityId);

    if (!availabilityItem) return;

    try {
      const newStartTime = dropInfo.event.start.toTimeString().slice(0, 5);
      const newEndTime = dropInfo.event.end.toTimeString().slice(0, 5);
      const newDayOfWeek = dropInfo.event.start.getDay();

      const updatedData = {
        ...availabilityItem,
        day_of_week: newDayOfWeek,
        start_time: newStartTime,
        end_time: newEndTime
      };

      await updateTechnicianAvailability(availabilityId, updatedData);
      await fetchAvailability();

      if (onAvailabilityChange) {
        onAvailabilityChange(updatedData);
      }

    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability. Please try again.');
      dropInfo.revert();
    }
  };

  const handleEventResize = async (resizeInfo) => {
    const availabilityId = resizeInfo.event.extendedProps.availabilityId;
    const availabilityItem = availability.find(a => a.id === availabilityId);

    if (!availabilityItem) return;

    try {
      const newStartTime = resizeInfo.event.start.toTimeString().slice(0, 5);
      const newEndTime = resizeInfo.event.end.toTimeString().slice(0, 5);

      const updatedData = {
        ...availabilityItem,
        start_time: newStartTime,
        end_time: newEndTime
      };

      await updateTechnicianAvailability(availabilityId, updatedData);
      await fetchAvailability();

      if (onAvailabilityChange) {
        onAvailabilityChange(updatedData);
      }

    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability. Please try again.');
      resizeInfo.revert();
    }
  };

  const applyTemplate = async (templateKey) => {
    if (!selectedTechnician) return;

    try {
      setLoading(true);
      const template = availabilityTemplates[templateKey];

      // Create availability entries for each day in the template
      for (const scheduleItem of template.schedule) {
        const availabilityData = {
          technician: selectedTechnician,
          day_of_week: scheduleItem.day_of_week,
          start_time: scheduleItem.start_time,
          end_time: scheduleItem.end_time,
          is_available: true,
          notes: `Applied ${template.name} template`
        };

        await createTechnicianAvailability(availabilityData);
      }

      await fetchAvailability();

    } catch (err) {
      console.error('Error applying template:', err);
      setError('Failed to apply template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllAvailability = async () => {
    if (!selectedTechnician) return;

    if (!window.confirm('Are you sure you want to clear all availability for this technician?')) {
      return;
    }

    try {
      setLoading(true);

      // Delete all availability entries for this technician
      for (const avail of availability) {
        await deleteTechnicianAvailability(avail.id);
      }

      await fetchAvailability();

    } catch (err) {
      console.error('Error clearing availability:', err);
      setError('Failed to clear availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const _selectedTechnicianName = () => {
    if (!selectedTechnician || !technicians.length) return 'Select Technician';
    const tech = technicians.find(t => t.id === selectedTechnician);
    return tech ? `${tech.first_name} ${tech.last_name}` : 'Unknown Technician';
  };

  if (loading && !availability.length) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="availability-calendar space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
          <p className="text-gray-600">
            Manage technician availability schedules with drag-and-drop functionality
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
                <option value="">Select Technician</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* View Controls */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setCalendarView('timeGridWeek')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                calendarView === 'timeGridWeek'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarView('timeGridDay')}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                calendarView === 'timeGridDay'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarView('dayGridMonth')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                calendarView === 'dayGridMonth'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Month
            </button>
          </div>
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
                  onClick={fetchAvailability}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {selectedTechnician && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Quick Templates:</span>
            {Object.entries(availabilityTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                disabled={loading}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded text-sm disabled:opacity-50"
              >
                {template.name}
              </button>
            ))}
            <button
              onClick={clearAllAvailability}
              disabled={loading}
              className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded text-sm disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        {selectedTechnician ? (
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              events={getCalendarEvents()}
              selectable={true}
              selectMirror={true}
              editable={true}
              eventResizableFromStart={true}
              eventDurationEditable={true}
              dayMaxEvents={true}
              weekends={true}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="00:30:00"
              snapDuration="00:15:00"
              allDaySlot={false}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '17:00'
              }}
              eventClassNames="availability-event"
              eventDisplay="block"
              displayEventTime={true}
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Please select a technician to view their availability.</p>
          </div>
        )}
      </div>

      {/* Availability Modal */}
      {showCreateModal && (
        <AvailabilityModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          selectedSlot={selectedSlot}
          editingAvailability={editingAvailability}
          technicianId={selectedTechnician}
          onSave={fetchAvailability}
          onAvailabilityChange={onAvailabilityChange}
        />
      )}
    </div>
  );
};

// Modal component for creating/editing availability
const AvailabilityModal = ({
  isOpen,
  onClose,
  selectedSlot,
  editingAvailability,
  technicianId,
  onSave,
  onAvailabilityChange
}) => {
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingAvailability) {
      setFormData({
        day_of_week: editingAvailability.day_of_week,
        start_time: editingAvailability.start_time,
        end_time: editingAvailability.end_time,
        is_available: editingAvailability.is_available,
        notes: editingAvailability.notes || ''
      });
    } else if (selectedSlot) {
      const dayOfWeek = selectedSlot.start.getDay();
      const startTime = selectedSlot.start.toTimeString().slice(0, 5);
      const endTime = selectedSlot.end.toTimeString().slice(0, 5);

      setFormData({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_available: true,
        notes: ''
      });
    }
  }, [editingAvailability, selectedSlot]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!technicianId) {
      setError('Please select a technician.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const data = {
        ...formData,
        technician: technicianId
      };

      if (editingAvailability) {
        await updateTechnicianAvailability(editingAvailability.id, data);
      } else {
        await createTechnicianAvailability(data);
      }

      if (onAvailabilityChange) {
        onAvailabilityChange(data);
      }

      await onSave();
      onClose();

    } catch (err) {
      console.error('Error saving availability:', err);
      setError('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAvailability) return;

    if (!window.confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      setSaving(true);
      await deleteTechnicianAvailability(editingAvailability.id);
      await onSave();
      onClose();
    } catch (err) {
      console.error('Error deleting availability:', err);
      setError('Failed to delete availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingAvailability ? 'Edit Availability' : 'Add Availability'}
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
              Day of Week
            </label>
            <select
              value={formData.day_of_week}
              onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dayNames.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Uncheck to mark as unavailable (blocked time)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes about this availability slot..."
            />
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {editingAvailability && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="flex space-x-2">
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
                {saving ? 'Saving...' : (editingAvailability ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
