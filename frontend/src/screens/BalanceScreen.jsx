import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

// NOTE: Card data transits the backend to Athena.
// This is acceptable under Athena's eCommerce mode terms.
// Do NOT log any card fields (accountnumber, cardsecuritycode,
// nameoncard). Only log epaymentid on success.

function formatDollars(amount) {
  return '$' + Number(amount).toFixed(2);
}

const EMPTY_CARD = {
  cardNumber:  '',
  expiryMonth: '',
  expiryYear:  '',
  cvv:         '',
  nameOnCard:  '',
  billingZip:  '',
};

export default function BalanceScreen() {
  const navigate = useNavigate();
  const { patient, dept, selectedAppointment } = useCheckin();

  // 'loading' | 'show' | 'card' | 'submitting' | 'success'
  const [phase, setPhase] = useState('loading');
  const [balance, setBalance] = useState(0);
  const [card, setCard] = useState(EMPTY_CARD);
  const [paymentError, setPaymentError] = useState(false);

  // Guard: no patient means the session was lost — go back to Welcome
  useEffect(() => {
    if (!patient) navigate('/', { replace: true });
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
        // Balance uncertainty should never block check-in
        navigate('/thankyou', { replace: true });
      }
    }

    checkBalance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateCard(field, value) {
    setCard((prev) => ({ ...prev, [field]: value }));
  }

  const cardFilled = Object.values(card).every((v) => v.trim().length > 0);

  async function handlePayment(e) {
    e.preventDefault();
    setPhase('submitting');

    try {
      const res = await fetch('/api/checkin/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId:            patient.patientId,
          departmentid:         dept,
          appointmentId:        selectedAppointment?.appointmentId,
          accountnumber:        card.cardNumber.replace(/\s/g, ''),
          expirationmonthmm:    card.expiryMonth,
          expirationyearyyyy:   card.expiryYear,
          cardsecuritycode:     card.cvv,
          nameoncard:           card.nameOnCard,
          billingzip:           card.billingZip,
          otheramount:          balance,
        }),
      });

      const data = res.ok ? await res.json() : { success: false };

      if (data.success) {
        setPhase('success');
      } else {
        setPaymentError(true);
        setPhase('show');
      }
    } catch {
      setPaymentError(true);
      setPhase('show');
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── STATE 3 — Payment success ─────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="screen">
        <div className="screen-inner" style={{ textAlign: 'center' }}>
          <div className="status-icon success" aria-hidden="true">✓</div>
          <h1 className="status-title success">Payment Received</h1>
          <p className="status-body">
            Payment of {formatDollars(balance)} received. Thank you!
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/thankyou')}
            style={{ marginTop: 8 }}
          >
            Continue Check-In
          </button>
        </div>
      </div>
    );
  }

  // ── STATE 2 — Card entry form (+ submitting spinner) ──────────────────────
  if (phase === 'card' || phase === 'submitting') {
    const busy = phase === 'submitting';
    return (
      <div className="screen">
        <div className="screen-inner">
          <h1 className="screen-title">Enter Payment Details</h1>

          {/* Prominent amount */}
          <div
            aria-label={`Amount: ${formatDollars(balance)}`}
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: 'var(--primary)',
              lineHeight: 1,
              margin: '4px 0 24px',
              letterSpacing: '-1px',
              textAlign: 'center',
            }}
          >
            {formatDollars(balance)}
          </div>

          <form className="form" onSubmit={handlePayment} style={{ width: '100%' }}>
            {/* Card Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-card-number">Card Number</label>
              <input
                id="pay-card-number"
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={16}
                placeholder="Card number"
                value={card.cardNumber}
                onChange={(e) => updateCard('cardNumber', e.target.value.replace(/\D/g, ''))}
                disabled={busy}
                required
                autoComplete="cc-number"
              />
            </div>

            {/* Expiry Month / Year / CVV — row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="pay-exp-month">Month</label>
                <input
                  id="pay-exp-month"
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  value={card.expiryMonth}
                  onChange={(e) => updateCard('expiryMonth', e.target.value.replace(/\D/g, ''))}
                  disabled={busy}
                  required
                  autoComplete="cc-exp-month"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="pay-exp-year">Year</label>
                <input
                  id="pay-exp-year"
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  value={card.expiryYear}
                  onChange={(e) => updateCard('expiryYear', e.target.value.replace(/\D/g, ''))}
                  disabled={busy}
                  required
                  autoComplete="cc-exp-year"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="pay-cvv">CVV</label>
                <input
                  id="pay-cvv"
                  className="form-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={(e) => updateCard('cvv', e.target.value.replace(/\D/g, ''))}
                  disabled={busy}
                  required
                  autoComplete="cc-csc"
                />
              </div>
            </div>

            {/* Name on Card */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-name">Name on Card</label>
              <input
                id="pay-name"
                className="form-input"
                type="text"
                placeholder="Full name on card"
                value={card.nameOnCard}
                onChange={(e) => updateCard('nameOnCard', e.target.value)}
                autoCapitalize="words"
                autoComplete="cc-name"
                disabled={busy}
                required
              />
            </div>

            {/* Billing ZIP */}
            <div className="form-group">
              <label className="form-label" htmlFor="pay-zip">Billing ZIP Code</label>
              <input
                id="pay-zip"
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Billing ZIP code"
                value={card.billingZip}
                onChange={(e) => updateCard('billingZip', e.target.value.replace(/\D/g, ''))}
                autoComplete="postal-code"
                disabled={busy}
                required
              />
            </div>

            {busy ? (
              <div className="spinner-wrap" style={{ marginTop: 8 }}>
                <div className="spinner" />
                <span className="spinner-label">Processing payment…</span>
              </div>
            ) : (
              <div className="btn-stack" style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!cardFilled}
                >
                  Pay {formatDollars(balance)}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setCard(EMPTY_CARD); setPhase('show'); }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // ── STATE 1 — Balance display (+ STATE 4 error on failed payment) ─────────
  return (
    <div className="screen">
      <div className="screen-inner" style={{ textAlign: 'center' }}>
        <h1 className="screen-title">Outstanding Balance</h1>

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

        {/* STATE 4 — payment error message, returns to STATE 1 buttons */}
        {paymentError && (
          <p className="msg-error" style={{ marginBottom: 16, textAlign: 'left' }}>
            Payment could not be processed. Please pay with your provider or skip for now.
          </p>
        )}

        <div className="btn-stack" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setCard(EMPTY_CARD); setPaymentError(false); setPhase('card'); }}
          >
            Pay Now
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/thankyou')}
          >
            Pay with my Provider
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
