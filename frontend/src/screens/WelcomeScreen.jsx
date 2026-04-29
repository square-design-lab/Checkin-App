import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';
import logo from '../assets/brand-icon.webp';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { locationName } = useCheckin();

  return (
    <div className="screen">
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <div className="welcome-icon" aria-hidden="true">
          {/* Simple heart/health icon using SVG */}
          <img src={logo} alt="Vantage Mental Health" className="app-header-logo-img" />
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
