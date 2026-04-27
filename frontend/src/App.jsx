import { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCheckin } from './context/CheckinContext';

import WelcomeScreen from './screens/WelcomeScreen';
import VerificationScreen from './screens/VerificationScreen';
import AppointmentSelectionScreen from './screens/AppointmentSelectionScreen';
import ConfirmArrivalScreen from './screens/ConfirmArrivalScreen';
import NoticesScreen from './screens/NoticesScreen';
import BalanceScreen from './screens/BalanceScreen';
import ThankYouScreen from './screens/ThankYouScreen';
import NoAppointmentScreen from './screens/NoAppointmentScreen';
import StaffAssistScreen from './screens/StaffAssistScreen';

const INACTIVITY_MS = 60 * 1000;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { initDept, locationName, resetSession } = useCheckin();
  const timerRef = useRef(null);

  // Read dept from URL once on load (?dept=1, ?dept=5, ?dept=8)
  useEffect(() => {
    const deptParam = searchParams.get('dept');
    if (deptParam) initDept(deptParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inactivity timer — 60 s of no interaction on any screen → back to Welcome
  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        resetSession();
        navigate('/', { replace: true });
      }, INACTIVITY_MS);
    }

    const events = ['mousedown', 'touchstart', 'keydown'];
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));
    resetTimer(); // start immediately

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, resetSession]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">Vantage Mental Health</span>
        {locationName && (
          <span className="app-header-location">{locationName}</span>
        )}
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/verify" element={<VerificationScreen />} />
          <Route path="/appointments" element={<AppointmentSelectionScreen />} />
          <Route path="/confirm" element={<ConfirmArrivalScreen />} />
          <Route path="/notices" element={<NoticesScreen />} />
          <Route path="/balance" element={<BalanceScreen />} />
          <Route path="/thankyou" element={<ThankYouScreen />} />
          <Route path="/no-appointment" element={<NoAppointmentScreen />} />
          <Route path="/staff-assist" element={<StaffAssistScreen />} />
        </Routes>
      </main>
    </div>
  );
}
