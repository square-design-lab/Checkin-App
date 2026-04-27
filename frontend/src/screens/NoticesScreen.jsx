import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

// Phase 2 stub — auto-skips to balance screen because the backend returns all_current: true
// When Phase 2 is built, this screen will display notices for signature

export default function NoticesScreen() {
  const navigate = useNavigate();
  const { patient } = useCheckin();

  useEffect(() => {
    async function checkNotices() {
      try {
        const res = await fetch('/api/checkin/check-notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: patient?.patientId }),
        });
        const data = await res.json();

        if (data.all_current) {
          navigate('/balance', { replace: true });
        }
        // Phase 2: handle data.notices array here
      } catch {
        // On error, proceed rather than blocking the patient
        navigate('/balance', { replace: true });
      }
    }

    checkNotices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen">
      <div className="spinner-wrap">
        <div className="spinner" />
        <span className="spinner-label">Checking your records…</span>
      </div>
      <span className="stub-badge">Phase 2</span>
    </div>
  );
}
