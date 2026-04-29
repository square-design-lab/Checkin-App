import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

const NOTICE_LABELS = {
  privacyNotice:      'HIPAA Privacy Notice',
  insuredSignature:   'Assignment of Benefits',
  patientSignature:   'Release of Billing Information',
};

export default function NoticesScreen() {
  const navigate = useNavigate();
  const { patient, dept } = useCheckin();

  // 'checking' | 'form' | 'submitting' | 'done'
  const [phase, setPhase] = useState('checking');
  const [missing, setMissing] = useState({});
  const [signatureName, setSignatureName] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Guard: no patient means the session was lost — go back to Welcome
  useEffect(() => {
    if (!patient) {
      navigate('/', { replace: true });
    }
  }, [patient, navigate]);

  // On mount: call check-notices
  useEffect(() => {
    if (!patient) return;

    async function checkNotices() {
      try {
        const res = await fetch('/api/checkin/check-notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient.patientId,
            departmentid: dept,
          }),
        });

        if (!res.ok) {
          // API error — fail-safe: show all three notices
          setMissing({ privacyNotice: true, insuredSignature: true, patientSignature: true });
          setPhase('form');
          return;
        }

        const data = await res.json();

        if (data.all_current) {
          navigate('/balance', { replace: true });
          return;
        }

        setMissing(data.missing || { privacyNotice: true, insuredSignature: true, patientSignature: true });
        setPhase('form');
      } catch {
        // Network error — fail-safe: show all three notices
        setMissing({ privacyNotice: true, insuredSignature: true, patientSignature: true });
        setPhase('form');
      }
    }

    checkNotices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setPhase('submitting');

    try {
      const res = await fetch('/api/checkin/submit-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.patientId,
          departmentid: dept,
          signatureName,
          missing,
        }),
      });

      const data = await res.json();

      if (data.success) {
        navigate('/balance');
      } else {
        setSubmitError('We were unable to save your signature. Please try again or ask a staff member for help.');
        setPhase('form');
      }
    } catch {
      setSubmitError('Unable to connect. Please check your connection or ask a staff member for help.');
      setPhase('form');
    }
  }

  // Signature is valid when it contains at least one space (first + last name)
  const signatureValid = signatureName.trim().includes(' ');
  const missingKeys = Object.keys(NOTICE_LABELS).filter((k) => missing[k]);

  // ── Checking spinner ──────────────────────────────────────────────────────
  if (phase === 'checking') {
    return (
      <div className="screen">
        <div className="spinner-wrap">
          <div className="spinner" />
          <span className="spinner-label">Checking your records…</span>
        </div>
      </div>
    );
  }

  // ── Signature form ────────────────────────────────────────────────────────
  return (
    <div className="screen">
      <div className="screen-inner">
        <h1 className="screen-title">Please Review and Sign</h1>
        <p className="screen-subtitle">
          Please acknowledge the following notices by typing your full legal name below.
        </p>

        <ul style={{ width: '100%', marginBottom: 24, paddingLeft: 20 }}>
          {missingKeys.map((k) => (
            <li key={k} style={{ marginBottom: 8, fontSize: '1.05rem' }}>
              {NOTICE_LABELS[k]}
            </li>
          ))}
        </ul>

        <form className="form" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="signatureName">
              Type your full legal name
            </label>
            <input
              id="signatureName"
              className="form-input"
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              style={{ minHeight: 56 }}
              autoCapitalize="words"
              autoComplete="name"
              autoCorrect="off"
              spellCheck="false"
              disabled={phase === 'submitting'}
              required
            />
          </div>

          {submitError && <p className="msg-error">{submitError}</p>}

          {phase === 'submitting' ? (
            <div className="spinner-wrap" style={{ marginTop: 8 }}>
              <div className="spinner" />
              <span className="spinner-label">Saving your signature…</span>
            </div>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              disabled={!signatureValid}
            >
              Agree &amp; Continue
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
