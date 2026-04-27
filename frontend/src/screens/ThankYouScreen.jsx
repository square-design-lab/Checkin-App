import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

const RESET_SECONDS = 30;

export default function ThankYouScreen() {
  const navigate = useNavigate();
  const { patient, resetSession } = useCheckin();
  const [countdown, setCountdown] = useState(RESET_SECONDS);

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

  const firstName = patient?.firstName || 'there';

  return (
    <div className="screen">
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <div className="status-icon success" aria-hidden="true">✓</div>
        <h1 className="status-title success">You're checked in!</h1>
        <p className="status-body">
          Thank you, <strong>{firstName}</strong>!<br />
          Your provider will come and get you shortly.<br />
          Please have a seat in the waiting area.
        </p>
        <p className="countdown-note">This screen will reset in {countdown} seconds.</p>
      </div>
    </div>
  );
}
