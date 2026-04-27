import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

const RESET_SECONDS = 60;

export default function StaffAssistScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetSession } = useCheckin();
  const [countdown, setCountdown] = useState(RESET_SECONDS);

  const reason = location.state?.reason; // 'no_match' | 'ambiguous'

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
        <div className="status-icon warning" aria-hidden="true">⚠</div>
        <h1 className="status-title primary">Please See a Staff Member</h1>

        {reason === 'ambiguous' ? (
          <p className="status-body">
            We found multiple records matching your information. A member of our
            team has been notified and will assist you shortly.
          </p>
        ) : (
          <p className="status-body">
            We were unable to verify your information. Please double-check your
            name and date of birth, or ask a staff member for assistance.
          </p>
        )}

        <p className="countdown-note">This screen will reset in {countdown} seconds.</p>
      </div>
    </div>
  );
}
