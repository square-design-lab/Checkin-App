import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

// Phase 3 stub — auto-skips to thank you because the backend returns balance: 0
// When Phase 3 is built, this screen will display the balance with Pay Now / Skip options

export default function BalanceScreen() {
  const navigate = useNavigate();
  const { patient } = useCheckin();

  useEffect(() => {
    async function checkBalance() {
      try {
        const res = await fetch('/api/checkin/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: patient?.patientId }),
        });
        const data = await res.json();

        if (data.balance === 0 || !data.balance) {
          navigate('/thankyou', { replace: true });
        }
        // Phase 3: display balance with Pay Now / Skip for Now buttons
      } catch {
        navigate('/thankyou', { replace: true });
      }
    }

    checkBalance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen">
      <div className="spinner-wrap">
        <div className="spinner" />
        <span className="spinner-label">Almost done…</span>
      </div>
      <span className="stub-badge">Phase 3</span>
    </div>
  );
}
