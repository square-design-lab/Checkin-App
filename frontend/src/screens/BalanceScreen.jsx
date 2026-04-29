import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

function formatDollars(amount) {
  return '$' + Number(amount).toFixed(2);
}

export default function BalanceScreen() {
  const navigate = useNavigate();
  const { patient, dept } = useCheckin();

  // 'loading' | 'show' (balance > 0)
  const [phase, setPhase] = useState('loading');
  const [balance, setBalance] = useState(0);

  // Guard: no patient means the session was lost — go back to Welcome
  useEffect(() => {
    if (!patient) {
      navigate('/', { replace: true });
    }
  }, [patient, navigate]);

  // On mount: fetch balance
  useEffect(() => {
    if (!patient) return;

    async function checkBalance() {
      try {
        const res = await fetch('/api/checkin/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: patient.patientId, departmentid: dept }),
        });

        const data = res.ok ? await res.json() : { balance: 0 };
        const amount = typeof data.balance === 'number' ? data.balance : 0;

        if (amount <= 0) {
          navigate('/thankyou', { replace: true });
        } else {
          setBalance(amount);
          setPhase('show');
        }
      } catch {
        // On any error skip gracefully — balance uncertainty should not block check-in
        navigate('/thankyou', { replace: true });
      }
    }

    checkBalance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="screen">
        <div className="spinner-wrap">
          <div className="spinner" />
          <span className="spinner-label">Almost done…</span>
        </div>
      </div>
    );
  }

  // ── Balance display ───────────────────────────────────────────────────────
  return (
    <div className="screen">
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <h1 className="screen-title">Outstanding Balance</h1>

        {/* Large balance amount */}
        <div
          aria-label={`Balance: ${formatDollars(balance)}`}
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: 'var(--primary)',
            lineHeight: 1,
            margin: '8px 0 16px',
            letterSpacing: '-1px',
          }}
        >
          {formatDollars(balance)}
        </div>

        <p className="screen-subtitle">
          You have an outstanding balance on your account
        </p>

        <div className="btn-stack" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/thankyou')}
          >
            I'll Pay at the Front Desk
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/thankyou')}
          >
            Skip for Now
          </button>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 15,
            color: 'var(--text-muted)',
            lineHeight: 1.4,
          }}
        >
          Payment is optional and will not affect your appointment
        </p>
      </div>
    </div>
  );
}
