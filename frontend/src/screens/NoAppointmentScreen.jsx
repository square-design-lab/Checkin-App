import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

const RESET_SECONDS = 60;

export default function NoAppointmentScreen() {
  const navigate = useNavigate();
  const { patient, dept, resetSession } = useCheckin();
  const [countdown, setCountdown] = useState(RESET_SECONDS);
  const alertSentRef = useRef(false);

  // Send support SMS exactly once on mount
  useEffect(() => {
    if (alertSentRef.current) return;
    alertSentRef.current = true;

    fetch('/api/checkin/alert-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientFirstName: patient?.firstName || 'Unknown',
        patientLastName: patient?.lastName || 'Patient',
        departmentId: dept,
        reason: 'no_appointment',
      }),
    }).catch(() => {
      // Silent fail — SMS is best-effort; patient already sees the screen
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval);
          resetSession();
          navigate('/', { replace: true });
          return 0;
        }
        return n - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, resetSession]);

  return (
    <div className="screen">
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <div className="status-icon warning" aria-hidden="true">!</div>
        <h1 className="status-title warning">No Appointment Found</h1>
        <p className="status-body">
          We couldn't find your appointment today. A member of our team has been
          notified and will be with you shortly.
        </p>
        <p className="status-body" style={{ fontSize: 18, color: 'var(--text-muted)' }}>
          Please have a seat and someone will assist you.
        </p>
        <p className="countdown-note">This screen will reset in {countdown} seconds.</p>
      </div>
    </div>
  );
}
