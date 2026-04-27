import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { locationName } = useCheckin();

  return (
    <div className="screen">
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <div className="welcome-icon" aria-hidden="true">
          {/* Simple heart/health icon using SVG */}
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        <h1 className="screen-title" style={{ marginBottom: 10 }}>
          Welcome
          {locationName ? ` to ${locationName}` : ''}
        </h1>
        <p className="screen-subtitle" style={{ marginBottom: 48 }}>
          Tap below to check in for your appointment
        </p>

        <button
          className="btn btn-primary btn-large"
          onClick={() => navigate('/verify')}
          style={{ minWidth: 280 }}
        >
          Check In
        </button>
      </div>
    </div>
  );
}
