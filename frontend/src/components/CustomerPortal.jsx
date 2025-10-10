import React, { useState, useEffect } from 'react';
import api from '../api';
import './CustomerPortal.css';

const CustomerPortal = () => {
  const [activeTab, setActiveTab] = useState('booking');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentRequest, setAppointmentRequest] = useState({
    preferred_date: '',
    preferred_time: '',
    service_type: '',
    description: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    urgency_level: 'normal',
    additional_notes: ''
  });
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadServiceTypes();
    if (activeTab === 'booking') {
      loadAvailableSlots();
    }
  }, [activeTab]);

  const loadServiceTypes = async () => {
    try {
      // For now, use static service types - could be made dynamic via API
      setServiceTypes([
        { id: 'hvac_maintenance', name: 'HVAC Maintenance' },
        { id: 'hvac_repair', name: 'HVAC Repair' },
        { id: 'plumbing_repair', name: 'Plumbing Repair' },
        { id: 'electrical_repair', name: 'Electrical Repair' },
        { id: 'general_maintenance', name: 'General Maintenance' },
        { id: 'emergency_service', name: 'Emergency Service' },
        { id: 'installation', name: 'New Installation' },
        { id: 'inspection', name: 'Inspection/Assessment' }
      ]);
    } catch (_err) {
      console.error('Error loading service types:', _err);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      // Generate available slots for the next 14 days
      const slots = [];
      const today = new Date();

      for (let day = 1; day <= 14; day++) {
        const date = new Date(today);
        date.setDate(today.getDate() + day);

        // Skip weekends for regular service
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Generate time slots from 8 AM to 5 PM
        for (let hour = 8; hour < 17; hour++) {
          const slotTime = new Date(date);
          slotTime.setHours(hour, 0, 0, 0);

          slots.push({
            id: `${date.toISOString().split('T')[0]}-${hour}`,
            date: date.toISOString().split('T')[0],
            time: `${hour}:00`,
            datetime: slotTime,
            available: Math.random() > 0.3 // Simulate availability
          });
        }
      }

      setAvailableSlots(slots.filter(slot => slot.available));
    } catch (_err) {
      console.error('Error loading available slots:', _err);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setAppointmentRequest({
      ...appointmentRequest,
      preferred_date: slot.date,
      preferred_time: slot.time
    });
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/api/appointment-requests/', {
        ...appointmentRequest,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });

      if (response.status === 201) {
        setMessage('Your appointment request has been submitted successfully! We will contact you within 24 hours to confirm.');
        setAppointmentRequest({
          preferred_date: '',
          preferred_time: '',
          service_type: '',
          description: '',
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          customer_address: '',
          urgency_level: 'normal',
          additional_notes: ''
        });
        setSelectedSlot(null);
      }
    } catch (_err) {
      console.error('Error submitting appointment request:', _err);
      setMessage('Error submitting your request. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  const formatSlotDisplay = (slot) => {
    const date = new Date(slot.datetime);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

    return `${dayName}, ${monthDay} at ${time}`;
  };

  const renderBookingTab = () => (
    <div className="booking-tab">
      <h2>Schedule Service Appointment</h2>
      <p>Select a preferred time slot and provide service details. We'll confirm your appointment within 24 hours.</p>

      <form onSubmit={handleSubmitRequest}>
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customer-name">Full Name *</label>
              <input
                id="customer-name"
                type="text"
                value={appointmentRequest.customer_name}
                onChange={(e) => setAppointmentRequest({...appointmentRequest, customer_name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="customer-email">Email Address *</label>
              <input
                id="customer-email"
                type="email"
                value={appointmentRequest.customer_email}
                onChange={(e) => setAppointmentRequest({...appointmentRequest, customer_email: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customer-phone">Phone Number *</label>
              <input
                id="customer-phone"
                type="tel"
                value={appointmentRequest.customer_phone}
                onChange={(e) => setAppointmentRequest({...appointmentRequest, customer_phone: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="service-address">Service Address *</label>
              <input
                id="service-address"
                type="text"
                value={appointmentRequest.customer_address}
                onChange={(e) => setAppointmentRequest({...appointmentRequest, customer_address: e.target.value})}
                placeholder="123 Main St, City, State 12345"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Service Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service-type">Service Type *</label>
              <select
                id="service-type"
                value={appointmentRequest.service_type}
                onChange={(e) => setAppointmentRequest({...appointmentRequest, service_type: e.target.value})}
                required
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="urgency-level">Urgency Level</label>
              <select
                id="urgency-level"
                value={appointmentRequest.urgency_level}
                onChange={(e) => setAppointmentRequest({...appointmentRequest, urgency_level: e.target.value})}
              >
                <option value="low">Low - Within a few days</option>
                <option value="normal">Normal - Within 24-48 hours</option>
                <option value="high">High - Same day preferred</option>
                <option value="emergency">Emergency - ASAP</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="problem-description">Problem Description *</label>
            <textarea
              id="problem-description"
              value={appointmentRequest.description}
              onChange={(e) => setAppointmentRequest({...appointmentRequest, description: e.target.value})}
              rows="4"
              placeholder="Please describe the issue or service needed in detail..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="additional-notes">Additional Notes</label>
            <textarea
              id="additional-notes"
              value={appointmentRequest.additional_notes}
              onChange={(e) => setAppointmentRequest({...appointmentRequest, additional_notes: e.target.value})}
              rows="3"
              placeholder="Any additional information, special instructions, or access details..."
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Preferred Appointment Time</h3>
          {selectedSlot ? (
            <div className="selected-slot">
              <p><strong>Selected:</strong> {formatSlotDisplay(selectedSlot)}</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedSlot(null)}
              >
                Change Time
              </button>
            </div>
          ) : (
            <div className="time-slots">
              <p>Select your preferred appointment time:</p>
              <div className="slots-grid">
                {availableSlots.slice(0, 20).map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    className="slot-btn"
                    onClick={() => handleSlotSelect(slot)}
                  >
                    {formatSlotDisplay(slot)}
                  </button>
                ))}
              </div>
              {availableSlots.length > 20 && (
                <p className="slots-note">Showing first 20 available slots. More times available after selection.</p>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading || !selectedSlot}>
            {loading ? 'Submitting...' : 'Submit Appointment Request'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderInfoTab = () => (
    <div className="info-tab">
      <h2>Service Information</h2>

      <div className="info-sections">
        <div className="info-section">
          <h3>Our Services</h3>
          <ul>
            <li><strong>HVAC Services:</strong> Heating, ventilation, and air conditioning maintenance and repair</li>
            <li><strong>Plumbing:</strong> Pipe repair, fixture installation, drain cleaning</li>
            <li><strong>Electrical:</strong> Wiring, outlet installation, electrical troubleshooting</li>
            <li><strong>General Maintenance:</strong> Routine building and equipment maintenance</li>
            <li><strong>Emergency Services:</strong> 24/7 urgent repair services</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>Service Areas</h3>
          <p>We provide services throughout the metropolitan area including:</p>
          <ul>
            <li>Downtown and surrounding areas</li>
            <li>Residential neighborhoods</li>
            <li>Commercial and industrial districts</li>
            <li>Suburban communities within 25 miles</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>Response Times</h3>
          <ul>
            <li><strong>Emergency:</strong> Within 2 hours</li>
            <li><strong>High Priority:</strong> Same day</li>
            <li><strong>Normal:</strong> Within 24-48 hours</li>
            <li><strong>Low Priority:</strong> Within 3-5 business days</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>Contact Information</h3>
          <div className="contact-info">
            <p><strong>Phone:</strong> (555) 123-4567</p>
            <p><strong>Emergency Line:</strong> (555) 123-HELP</p>
            <p><strong>Email:</strong> service@convergecrm.com</p>
            <p><strong>Office Hours:</strong> Monday - Friday, 8 AM - 6 PM</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="customer-portal">
      <div className="portal-header">
        <h1>Customer Service Portal</h1>
        <p>Request service appointments and get information about our services</p>
      </div>

      <div className="portal-tabs">
        <button
          className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`}
          onClick={() => setActiveTab('booking')}
        >
          Book Appointment
        </button>
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Service Information
        </button>
      </div>

      <div className="portal-content">
        {activeTab === 'booking' && renderBookingTab()}
        {activeTab === 'info' && renderInfoTab()}
      </div>
    </div>
  );
};

export default CustomerPortal;
