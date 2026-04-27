import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

// Convert "14:30" (24h) to "2:30 PM"
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr; // already formatted or unexpected
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function AppointmentSelectionScreen() {
  const navigate = useNavigate();
  const { appointments, setSelectedAppointment } = useCheckin();

  // Guard: if somehow we land here with 0 or 1 appointment, redirect appropriately
  useEffect(() => {
    if (appointments.length === 0) navigate('/no-appointment', { replace: true });
    if (appointments.length === 1) navigate('/confirm', { replace: true });
  }, [appointments, navigate]);

  function selectAppointment(appt) {
    setSelectedAppointment(appt);
    navigate('/confirm');
  }

  return (
    <div className="screen">
      <div className="screen-inner">
        <h1 className="screen-title">Select Your Appointment</h1>
        <p className="screen-subtitle" style={{ marginBottom: 28 }}>
          You have multiple appointments today. Tap the one you are checking in for.
        </p>

        <div className="appt-list" style={{ width: '100%' }}>
          {appointments.map((appt) => (
            <button
              key={appt.appointmentId}
              className="appt-card"
              onClick={() => selectAppointment(appt)}
            >
              <div className="appt-time">{formatTime(appt.appointmentTime)}</div>
              <div className="appt-type">{appt.appointmentType}</div>
              <div className="appt-provider">{appt.providerName}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
