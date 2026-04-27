import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckin } from '../context/CheckinContext';

// Convert YYYY-MM-DD (HTML date input) → MM/DD/YYYY (Athena format)
function toAthenaDate(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${m}/${d}/${y}`;
}

export default function VerificationScreen() {
  const navigate = useNavigate();
  const { dept, setPatient, setAppointments } = useCheckin();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1 — find patient via Athena GET /patients/bestmatch
      // Requires: firstname, lastname, dob (MM/DD/YYYY) + at least one of zip/phone/email/ssn
      const findRes = await fetch('/api/checkin/find-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: firstName.trim(),
          lastname: lastName.trim(),
          dob: toAthenaDate(dob),
          zip: zip.trim(),
          departmentid: dept,
        }),
      });

      if (!findRes.ok) {
        setError('Unable to connect. Please try again or ask a staff member for help.');
        setLoading(false);
        return;
      }

      const findData = await findRes.json();

      if (findData.status === 'no_match') {
        navigate('/staff-assist', { state: { reason: 'no_match' } });
        return;
      }

      if (findData.status === 'ambiguous') {
        // Duplicate chart — backend already sent support SMS
        navigate('/staff-assist', { state: { reason: 'ambiguous' } });
        return;
      }

      if (findData.status !== 'found') {
        setError('Something went wrong. Please try again or ask a staff member for help.');
        setLoading(false);
        return;
      }

      const patientId = findData.patientId;
      setPatient({ patientId, firstName: firstName.trim(), lastName: lastName.trim() });

      // Step 2 — get today's appointments
      const apptRes = await fetch('/api/checkin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, departmentid: dept }),
      });

      if (!apptRes.ok) {
        setError('Unable to load your appointments. Please try again or ask a staff member for help.');
        setLoading(false);
        return;
      }

      const apptData = await apptRes.json();
      const appts = apptData.appointments || [];
      setAppointments(appts);

      if (appts.length === 0) {
        navigate('/no-appointment');
      } else if (appts.length === 1) {
        // Single appointment — skip selection screen
        navigate('/confirm');
      } else {
        navigate('/appointments');
      }
    } catch {
      setError('Unable to connect. Please check your connection or ask a staff member for help.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      <div className="screen-inner">
        <h1 className="screen-title">Check In</h1>
        <p className="screen-subtitle">Enter your information to find your appointment</p>

        <form className="form" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="form-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoCapitalize="words"
              autoComplete="given-name"
              autoCorrect="off"
              spellCheck="false"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="form-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoCapitalize="words"
              autoComplete="family-name"
              autoCorrect="off"
              spellCheck="false"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              className="form-input"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="zip">ZIP Code</label>
            <input
              id="zip"
              className="form-input"
              type="text"
              inputMode="numeric"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              required
              autoComplete="postal-code"
              placeholder="5-digit ZIP"
              pattern="\d{5}"
              title="5-digit ZIP code"
              disabled={loading}
            />
          </div>

          {error && <p className="msg-error">{error}</p>}

          {loading ? (
            <div className="spinner-wrap" style={{ marginTop: 8 }}>
              <div className="spinner" />
              <span className="spinner-label">Finding your appointment…</span>
            </div>
          ) : (
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
              Continue
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
