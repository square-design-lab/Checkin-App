import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/brand-icon.webp';
import HelpRequestModal from '../components/HelpRequestModal';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="screen">
      <div className="screen-inner-top">
        <div className="welcome-icon" aria-hidden="true">
          <img src={logo} alt="Vantage Mental Health" className="app-header-logo-img" />
        </div>

        <h1 className="screen-title" style={{ marginBottom: 10 }}>
          Welcome to Vantage Mental Health
        </h1>
        <p className="screen-subtitle" style={{ marginBottom: 48 }}>
          Tap below to check in for your appointment
        </p>
      </div>
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary btn-large"
          onClick={() => navigate('/verify')}
          style={{ minWidth: 280 }}
        >
          Check In
        </button>

        <button
          className="btn btn-secondary btn-large"
          onClick={() => setModalOpen(true)}
          style={{ marginTop: 16, minWidth: 280 }}
        >
          I don't have an appointment
        </button>
      </div>

      <HelpRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        prefillMessage="I am in the waiting room and don't have a scheduled appointment."
      />
    </div>
  );
}
