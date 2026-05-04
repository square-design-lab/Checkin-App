import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useCheckin } from './context/CheckinContext';
import logo from './assets/logo.png';
import HelpRequestModal from './components/HelpRequestModal';

import WelcomeScreen from './screens/WelcomeScreen';
import VerificationScreen from './screens/VerificationScreen';
import AppointmentSelectionScreen from './screens/AppointmentSelectionScreen';
import ConfirmArrivalScreen from './screens/ConfirmArrivalScreen';
import NoticesScreen from './screens/NoticesScreen';
import BalanceScreen from './screens/BalanceScreen';
import ThankYouScreen from './screens/ThankYouScreen';
import NoAppointmentScreen from './screens/NoAppointmentScreen';
import StaffAssistScreen from './screens/StaffAssistScreen';
import QRCodePage from './screens/QRCodePage';

const INACTIVITY_MS = 60 * 1000;

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { initDept, locationName, resetSession } = useCheckin();
  const timerRef = useRef(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Screens where the floating help button should NOT appear
  const HELP_BTN_HIDDEN = ['/', '/thankyou', '/qr'];
  const showHelpBtn = !HELP_BTN_HIDDEN.includes(location.pathname);
  // Track current pathname in a ref so the timer callback can read it
  // without being re-registered on every navigation change.
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // Read dept from URL once on load (?dept=1, ?dept=5, ?dept=8)
  useEffect(() => {
    const deptParam = searchParams.get('dept');
    if (deptParam) initDept(deptParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inactivity timer — 60 s of no interaction → back to Welcome.
  // Skips the reset when already on the Welcome screen (/) or the admin
  // QR code page (/qr) — no patient session to clear on those screens.
  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const path = pathnameRef.current;
        if (path === '/' || path === '/qr') return;
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
        <img src={logo} alt="Vantage Mental Health" className="app-header-logo-img" />
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
          <Route path="/qr" element={<QRCodePage />} />
        </Routes>
      </main>

      {/* Fixed help button — hidden on Welcome, Thank You, and QR pages */}
      {showHelpBtn && (
        <button
          type="button"
          className="btn btn-secondary help-btn-fixed"
          onClick={() => setHelpModalOpen(true)}
        >
          I need help
        </button>
      )}

      <HelpRequestModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        prefillMessage=""
      />
    </div>
  );
}
