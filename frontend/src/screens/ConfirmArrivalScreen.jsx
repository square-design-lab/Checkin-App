import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ConfirmArrivalScreen() {
  const navigate = useNavigate();
  const { appointments, selectedAppointment, setSelectedAppointment, patient, dept } = useCheckin();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  // If we came from single-appointment flow, auto-select the only appointment
  useEffect(() => {
    if (!selectedAppointment && appointments.length === 1) {
      setSelectedAppointment(appointments[0]);
    }
  }, [selectedAppointment, appointments, setSelectedAppointment]);

  const appt = selectedAppointment || appointments[0];

  // Guard: if no appointment data, go back to start
  useEffect(() => {
    if (!appt) navigate('/', { replace: true });
  }, [appt, navigate]);

  if (!appt) return null;

  async function handleConfirm() {
    setConfirming(true);
    setError('');

    try {
      const res = await fetch('/api/checkin/confirm-arrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appt.appointmentId,
          appointmentType: appt.appointmentType,
          appointmentTime: formatTime(appt.appointmentTime),
          patientFirstName: patient?.firstName || '',
          providerAthenaId: appt.providerId,
          departmentId: dept,
        }),
      });

      if (!res.ok) {
        // Even if the backend call partially fails, we continue — the note write
        // failure is logged server-side but should not block the patient
        console.warn('[confirm-arrival] Backend returned', res.status);
      }

      // Always proceed to notices check after confirmation attempt
      navigate('/notices');
    } catch {
      setError('Unable to confirm at this moment. Please try again or ask a staff member for help.');
      setConfirming(false);
    }
  }

  return (
    <div className="screen">
      <div className="screen-inner">
        <h1 className="screen-title">Confirm Your Arrival</h1>
        <p className="screen-subtitle" style={{ marginBottom: 24 }}>
          Please review your appointment details below
        </p>

        <div className="detail-card">
          <div className="detail-row">
            <span className="detail-label">Provider</span>
            <span className="detail-value">{appt.providerName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span className="detail-value">{formatTime(appt.appointmentTime) || appt.appointmentTime}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Type</span>
            <span className="detail-value">{appt.appointmentType}</span>
          </div>
        </div>

        {error && <p className="msg-error" style={{ marginBottom: 16 }}>{error}</p>}

        {confirming ? (
          <div className="spinner-wrap">
            <div className="spinner" />
            <span className="spinner-label">Checking you in…</span>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirm I'm Here
          </button>
        )}
      </div>
    </div>
  );
}
