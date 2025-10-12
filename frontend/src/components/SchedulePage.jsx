import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import MobileOptimizedCalendar from './MobileOptimizedCalendar';
import { TouchUtils } from '../utils/mobile-signature-utils';
import { MobileCalendarUtils, MobileTouchHandlers } from '../utils/mobile-calendar';
import api from '../api';
import './SchedulePage.css';
import '../styles/mobile-scheduling.css';

const SchedulePage = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    technician: '',
    workOrder: '',
    customer: '',
    address: '',
    recurrenceRule: ''
  });
  const [technicians, setTechnicians] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [routeOptimization, setRouteOptimization] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [eventsRes, techniciansRes, workOrdersRes] = await Promise.all([
        api.get('/api/scheduled-events/'),
        api.get('/api/technicians/'),
        api.get('/api/work-orders/')
      ]);

      setEvents(formatEventsForCalendar(eventsRes.data.results || eventsRes.data));
      setTechnicians(techniciansRes.data.results || techniciansRes.data);
      setWorkOrders(workOrdersRes.data.results || workOrdersRes.data);
    } catch (_err) {
      console.error('Error loading schedule data:', _err);
    }
  };

  const formatEventsForCalendar = (events) => {
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: `${event.title} - ${event.technician_name || 'Unassigned'}`,
      start: event.scheduled_date,
      end: event.estimated_end_time,
      extendedProps: {
        description: event.description,
        technicianId: event.technician,
        workOrderId: event.work_order,
        customer: event.customer_name,
        address: event.address,
        status: event.status
      },
      backgroundColor: getEventColor(event.status),
      borderColor: getEventColor(event.status)
    }));

    // Apply mobile optimizations if on touch device
    return TouchUtils.isTouchDevice()
      ? MobileCalendarUtils.formatEventsForMobile(formattedEvents)
      : formattedEvents;
  };

  const getEventColor = (status) => {
    const colors = {
      'scheduled': '#3b82f6', // blue
      'in_progress': '#f59e0b', // amber
      'completed': '#10b981', // green
      'cancelled': '#ef4444', // red
      'rescheduled': '#8b5cf6' // purple
    };
    return colors[status] || '#6b7280'; // gray default
  };

  const handleDateClick = (arg) => {
    setSelectedDate(arg.date);
    setEventForm({
      ...eventForm,
      start: arg.dateStr + 'T09:00',
      end: arg.dateStr + 'T10:00'
    });
    setShowEventModal(true);
  };

  // Calendar navigation handlers for mobile
  const handleCalendarNavigate = (action, newDate) => {
    setSelectedDate(newDate);
  };

  const handleCalendarViewChange = (view) => {
    // Handle view changes for mobile calendar
    console.log('View changed to:', view);
  };

  const handleDateSelect = (slotInfo) => {
    const startDate = slotInfo.start || slotInfo.date;
    const endDate = slotInfo.end || new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default

    setSelectedDate(startDate);
    setEventForm({
      ...eventForm,
      start: startDate.toISOString().slice(0, 16),
      end: endDate.toISOString().slice(0, 16)
    });
    setShowEventModal(true);
  };

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event || clickInfo; // Support both FullCalendar and mobile calendar
    const eventData = event.extendedProps || event;

    // Use mobile touch handler if on touch device
    if (TouchUtils.isTouchDevice()) {
      MobileTouchHandlers.handleMobileEventSelect(clickInfo, (selectedEvent) => {
        const evt = selectedEvent.event || selectedEvent;
        const data = evt.extendedProps || evt;

        setEventForm({
          title: (evt.title || '').split(' - ')[0],
          description: data.description,
          start: evt.start ? evt.start.toISOString().slice(0, 16) : '',
          end: evt.end ? evt.end.toISOString().slice(0, 16) : '',
          technician: data.technicianId || '',
          workOrder: data.workOrderId || '',
          customer: data.customer || '',
          address: data.address || ''
        });
        setShowEventModal(true);
      });
    } else {
      // Desktop handling
      setEventForm({
        title: (event.title || '').split(' - ')[0],
        description: eventData.description,
        start: event.startStr || (event.start ? event.start.toISOString().slice(0, 16) : ''),
        end: event.endStr || (event.end ? event.end.toISOString().slice(0, 16) : ''),
        technician: eventData.technicianId || '',
        workOrder: eventData.workOrderId || '',
        customer: eventData.customer || '',
        address: eventData.address || '',
        recurrenceRule: ''
      });
      setShowEventModal(true);
    }
  };

  const handleEventDrop = async (eventDropInfo) => {
    const event = eventDropInfo.event;
    try {
      await api.patch(`/api/scheduled-events/${event.id}/`, {
        scheduled_date: event.start.toISOString(),
        estimated_end_time: event.end ? event.end.toISOString() : null
      });
      loadInitialData(); // Reload to get updated data
    } catch (_err) {
      console.error('Error updating event:', _err);
      eventDropInfo.revert(); // Revert the change on _err
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        scheduled_date: eventForm.start,
        estimated_end_time: eventForm.end,
        technician: eventForm.technician || null,
        work_order: eventForm.workOrder || null,
        recurrence_rule: eventForm.recurrenceRule || null
      };

      await api.post('/api/scheduled-events/', eventData);
      setShowEventModal(false);
      setEventForm({
        title: '', description: '', start: '', end: '',
        technician: '', workOrder: '', customer: '', address: '', recurrenceRule: ''
      });
      loadInitialData();
    } catch (_err) {
      console.error('Error saving event:', _err);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = async (date) => {
    if (!date) return;

    setLoading(true);
    try {
      const response = await api.post('/api/scheduling/optimize-route/', {
        date: date.toISOString().split('T')[0],
        technician_id: eventForm.technician
      });
      setRouteOptimization(response.data);
    } catch (_err) {
      console.error('Error optimizing route:', _err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>Field Service Schedule</h1>
        <div className="schedule-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowEventModal(true)}
          >
            + New Appointment
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => optimizeRoute(selectedDate)}
            disabled={!selectedDate || loading}
          >
            Optimize Route
          </button>
        </div>
      </div>

      <div className="schedule-content">
        <div className="calendar-container">
          {TouchUtils.isTouchDevice() ? (
            <MobileOptimizedCalendar
              events={events}
              onSelectEvent={handleEventClick}
              onSelectSlot={handleDateSelect}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventDrop}
              onNavigate={handleCalendarNavigate}
              onView={handleCalendarViewChange}
              currentDate={selectedDate || new Date()}
              currentView="week"
            />
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              initialView="timeGridWeek"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventDrop}
              height="auto"
            />
          )}
        </div>

        {routeOptimization && (
          <div className="route-optimization">
            <h3>Route Optimization Suggestions</h3>
            <div className="optimization-results">
              <p><strong>Total Distance:</strong> {routeOptimization.total_distance} miles</p>
              <p><strong>Estimated Time:</strong> {routeOptimization.total_time} minutes</p>
              <div className="route-order">
                <h4>Suggested Order:</h4>
                <ol>
                  {routeOptimization.route_order?.map((stop, index) => (
                    <li key={index}>
                      {stop.address} - {stop.appointment_time}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Schedule Appointment</h3>
              <button
                className="modal-close"
                onClick={() => setShowEventModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEvent}>
              <div className="form-group">
                <label htmlFor="event-title">Title</label>
                <input
                  id="event-title"
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-description">Description</label>
                <textarea
                  id="event-description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event-start">Start Date/Time</label>
                  <input
                    id="event-start"
                    type="datetime-local"
                    value={eventForm.start}
                    onChange={(e) => setEventForm({...eventForm, start: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="event-end">End Date/Time</label>
                  <input
                    id="event-end"
                    type="datetime-local"
                    value={eventForm.end}
                    onChange={(e) => setEventForm({...eventForm, end: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event-technician">Technician</label>
                  <select
                    id="event-technician"
                    value={eventForm.technician}
                    onChange={(e) => setEventForm({...eventForm, technician: e.target.value})}
                  >
                    <option value="">Select Technician</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>
                        {tech.first_name} {tech.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="event-workorder">Work Order</label>
                  <select
                    id="event-workorder"
                    value={eventForm.workOrder}
                    onChange={(e) => setEventForm({...eventForm, workOrder: e.target.value})}
                  >
                    <option value="">Select Work Order</option>
                    {workOrders.map(wo => (
                      <option key={wo.id} value={wo.id}>
                        #{wo.id} - {wo.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="event-recurrence">Recurrence Rule (RRULE format)</label>
                <input
                  id="event-recurrence"
                  type="text"
                  value={eventForm.recurrenceRule}
                  onChange={(e) => setEventForm({...eventForm, recurrenceRule: e.target.value})}
                  placeholder="e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR"
                />
                <small>Leave empty for one-time appointment</small>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
