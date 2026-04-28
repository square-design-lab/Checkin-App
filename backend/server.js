require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    'https://checkin.vantagementalhealth.org',
    'http://localhost:5173',
    'http://localhost:4173',
  ],
}));

const providerContacts = require('./provider-contacts.json');

const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// ─── Athena OAuth ─────────────────────────────────────────────────────────────

let tokenCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const response = await axios.post(
    `${process.env.ATHENA_BASE_URL}/oauth2/v1/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'athena/service/Athenanet.MDP.*',
    }),
    {
      auth: {
        username: process.env.ATHENA_CLIENT_ID,
        password: process.env.ATHENA_CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  const { access_token, expires_in } = response.data;
  tokenCache = {
    accessToken: access_token,
    expiresAt: Date.now() + (expires_in - 120) * 1000,
  };

  return access_token;
}

async function athenaGet(path, params = {}) {
  const token = await getAccessToken();
  const response = await axios.get(`${process.env.ATHENA_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return response.data;
}

async function athenaPost(path, data = {}) {
  const token = await getAccessToken();
  const response = await axios.post(
    `${process.env.ATHENA_BASE_URL}${path}`,
    new URLSearchParams(data),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOCATION_NAMES = { '1': 'Stillwater', '5': 'St. Anthony', '8': 'Edina' };

function locationName(departmentId) {
  return LOCATION_NAMES[String(departmentId)] || 'clinic';
}

// Normalize DOB to MM/DD/YYYY regardless of what arrives.
// HTML date inputs send YYYY-MM-DD; this converts it defensively on the server
// so the call never breaks even if the frontend format changes.
function normalizeDob(dob) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return `${dob.slice(5, 7)}/${dob.slice(8, 10)}/${dob.slice(0, 4)}`;
  }
  return dob; // already MM/DD/YYYY or some other format — pass through
}

function todayMMDDYYYY() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

function nowCentralTime12h() {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date());
}

async function sendSms(to, body) {
  if (!twilioClient) {
    console.log('[SMS skipped — Twilio not configured]');
    return;
  }
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_FROM_NUMBER,
      to,
      body,
    });
  } catch (err) {
    console.error('[SMS error]', err.message);
  }
}

async function alertSupport(message) {
  if (process.env.SUPPORT_PHONE) {
    await sendSms(process.env.SUPPORT_PHONE, message);
  } else {
    console.warn('[SUPPORT_PHONE not set] Would have sent:', message);
  }
}

// ─── GET /api/checkin/health ──────────────────────────────────────────────────

app.get('/api/checkin/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── GET /api/checkin/test-athena ─────────────────────────────────────────────
// Non-PHI endpoint to verify OAuth + Athena connection in dev/sandbox.
// Hit this first when troubleshooting: curl http://localhost:3001/api/checkin/test-athena

app.get('/api/checkin/test-athena', async (_req, res) => {
  const practiceId = process.env.ATHENA_PRACTICE_ID;
  const baseUrl    = process.env.ATHENA_BASE_URL;

  try {
    const token = await getAccessToken();

    // departments call has no PHI and confirms practice ID is valid
    const depts = await athenaGet(`/v1/${practiceId}/departments`, { limit: 5 });

    return res.json({
      status: 'ok',
      practiceId,
      baseUrl,
      tokenAcquired: !!token,
      departmentsResponse: depts,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      practiceId,
      baseUrl,
      httpStatus: err.response?.status,
      message: err.message,
      athenaError: err.response?.data,
    });
  }
});

// ─── POST /api/checkin/find-patient ───────────────────────────────────────────
// HIPAA: never log req.body — contains patient name, DOB, zip.
//
// Athena endpoint: GET /v1/{practiceId}/patients/bestmatch
//   Required: firstname, lastname, dob (MM/DD/YYYY), + one of zip/phone/email/ssn
//   Response: direct array  →  [{ "patientid": "...", ... }]

app.post('/api/checkin/find-patient', async (req, res) => {
  const { firstname, lastname, dob, zip, departmentid } = req.body;

  if (!firstname || !lastname || !dob || !zip) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Server-side DOB normalization — safety net for any format the frontend sends
  const athenaDob = normalizeDob(dob);
  const dobIsValid = /^\d{2}\/\d{2}\/\d{4}$/.test(athenaDob);
  if (!dobIsValid) {
    console.error('[find-patient] DOB could not be normalized:', dob, '→', athenaDob);
    return res.status(400).json({ error: 'Invalid date format' });
  }

  console.log('[find-patient] Calling bestmatch, dobFormat=MM/DD/YYYY ✓, zipLength=' + String(zip).length);

  try {
    const data = await athenaGet(
      `/v1/${process.env.ATHENA_PRACTICE_ID}/patients/bestmatch`,
      { firstname, lastname, dob: athenaDob, zip }
    );

    console.log('[find-patient] Athena 200, responseType=' + (Array.isArray(data) ? `array[${data.length}]` : typeof data));

    const patients = Array.isArray(data) ? data : (data.patients || []);

    if (patients.length === 0) {
      console.log('[find-patient] Result: no_match (empty array)');
      return res.json({ status: 'no_match' });
    }

    if (patients.length > 1) {
      console.log('[find-patient] Result: ambiguous (' + patients.length + ' records)');
      await alertSupport(
        `Check-in alert: Patient ${firstname} ${lastname} needs assistance at ${locationName(departmentid)} — possible duplicate chart.`
      );
      return res.json({ status: 'ambiguous' });
    }

    const patient = patients[0];
    const patientId = patient.patientid || patient.enterprisepatientid || patient.localpatientid;

    console.log('[find-patient] Result: found');
    return res.json({ status: 'found', patientId: String(patientId) });

  } catch (err) {
    const httpStatus = err.response?.status;
    const errBody    = err.response?.data;

    if (httpStatus === 404) {
      // Some Athena endpoints return 404 for "no results"
      console.log('[find-patient] 404 from Athena — treating as no_match');
      return res.json({ status: 'no_match' });
    }

    if (httpStatus === 400) {
      // 400 = bad request parameters — log the full Athena error so we can debug
      // param name wrong? dob format issue? This will tell us.
      console.error('[find-patient] 400 from Athena. Full error:', JSON.stringify(errBody));
      console.error('[find-patient] Params sent — dob:', athenaDob, '| zipLength:', String(zip).length);
      return res.json({ status: 'no_match' });
    }

    console.error('[find-patient] Athena error:', httpStatus, err.message);
    return res.status(503).json({ error: 'service_unavailable' });
  }
});

// ─── POST /api/checkin/appointments ───────────────────────────────────────────

// DATE_OFFSET_DAYS shifts the appointment lookup date forward by N days.
// Set to 1 in .env (sandbox) because Athena's minimum scheduling lead time
// is 24 hours — appointments can't be booked for today in the sandbox.
// Leave unset (defaults to 0) in production where real same-day appointments exist.
function appointmentDate() {
  const offset = parseInt(process.env.DATE_OFFSET_DAYS || '0', 10);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(d);
}

app.post('/api/checkin/appointments', async (req, res) => {
  const { patientId, departmentid } = req.body;

  if (!patientId || !departmentid) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // _testDate in the request body still overrides everything (manual curl testing)
  const dateParam = req.body._testDate || appointmentDate();

  console.log('[appointments] Looking up appointments for date:', dateParam, process.env.DATE_OFFSET_DAYS ? `(offset +${process.env.DATE_OFFSET_DAYS}d)` : '(today)');

  try {
    const data = await athenaGet(
      `/v1/${process.env.ATHENA_PRACTICE_ID}/patients/${patientId}/appointments`,
      {
        startdate: dateParam,
        enddate: dateParam,
        departmentid,
      }
    );

    console.log('[appointments] Athena response type:', Array.isArray(data) ? `array[${data.length}]` : typeof data, '| keys:', data && typeof data === 'object' ? Object.keys(data).join(',') : '');

    // Athena returns { appointments: [...], totalcount: N } or a direct array
    const rawAppts = data.appointments || (Array.isArray(data) ? data : []);

    console.log('[appointments] Appointment count:', rawAppts.length);

    const appointments = rawAppts.map((a) => {
      const pid = String(a.providerid || '');
      // Cross-reference provider-contacts.json for the display name.
      // Athena's appointment response often omits or abbreviates the provider name.
      const contact = providerContacts.find((p) => String(p.athena_provider_id) === pid);
      const providerName = contact?.provider_name
        || a.providername
        || a.providerusername
        || 'Your provider';

      return {
        appointmentId:   String(a.appointmentid),
        appointmentType: a.appointmenttype || 'Appointment',
        appointmentDate: a.date || a.appointmentdate,
        appointmentTime: a.starttime || a.appointmenttime || '',
        providerId:      pid,
        providerName,
        departmentId:    String(a.departmentid || departmentid),
      };
    });

    return res.json({ appointments });
  } catch (err) {
    console.error('[appointments] Athena error:', err.response?.status, err.message, JSON.stringify(err.response?.data));
    return res.status(503).json({ error: 'service_unavailable' });
  }
});

// ─── POST /api/checkin/confirm-arrival ────────────────────────────────────────

app.post('/api/checkin/confirm-arrival', async (req, res) => {
  const { appointmentId, appointmentType, appointmentTime, patientFirstName, providerAthenaId, departmentId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ error: 'Missing appointmentId' });
  }

  const arrivalTime = nowCentralTime12h();
  const type        = appointmentType || 'Appointment';
  const noteText    = `${type} - Patient has arrived at clinic at ${arrivalTime}`;

  // Write appointment note — do not fail the check-in if this errors
  try {
    await athenaPost(
      `/v1/${process.env.ATHENA_PRACTICE_ID}/appointments/${appointmentId}/notes`,
      { notetext: noteText, displayonschedule: 'true' }
    );
    console.log('[confirm-arrival] Note written for appointment', appointmentId);
  } catch (err) {
    console.error('[confirm-arrival] Note write error:', err.response?.status, JSON.stringify(err.response?.data));
  }

  // Send provider SMS if opted in — silently skip if not
  if (providerAthenaId && patientFirstName) {
    const provider = providerContacts.find(
      (p) => String(p.athena_provider_id) === String(providerAthenaId)
    );
    if (provider && provider.sms_opt_in && provider.mobile_number) {
      const location    = locationName(departmentId);
      const timeDisplay = appointmentTime || arrivalTime;
      await sendSms(
        provider.mobile_number,
        `${patientFirstName} has arrived for their ${timeDisplay} appointment at ${location}.`
      );
    }
  }

  return res.json({ success: true });
});

// ─── POST /api/checkin/alert-support ──────────────────────────────────────────

app.post('/api/checkin/alert-support', async (req, res) => {
  const { patientFirstName, patientLastName, departmentId, reason } = req.body;
  const location = locationName(departmentId);

  const message =
    reason === 'no_appointment'
      ? `Check-in alert: ${patientFirstName} ${patientLastName} is in the waiting room at ${location} with no scheduled appointment today.`
      : `Check-in alert: Patient ${patientFirstName} ${patientLastName} needs assistance at ${location}.`;

  await alertSupport(message);
  return res.json({ success: true });
});

// ─── Phase 2 stubs — Notices ──────────────────────────────────────────────────

app.post('/api/checkin/check-notices', async (_req, res) => {
  return res.json({ all_current: true, notices: [] });
});

app.post('/api/checkin/submit-notices', async (_req, res) => {
  return res.json({ success: true });
});

// ─── Phase 3 stubs — Balance / Payment ───────────────────────────────────────

app.post('/api/checkin/balance', async (_req, res) => {
  return res.json({ balance: 0 });
});

app.post('/api/checkin/record-payment', async (_req, res) => {
  return res.json({ success: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Vantage check-in backend running on port ${PORT}`);
  console.log(`Athena: ${process.env.ATHENA_BASE_URL} | practice: ${process.env.ATHENA_PRACTICE_ID}`);
  if (!twilioClient)              console.warn('WARNING: Twilio not configured — SMS disabled');
  if (!process.env.SUPPORT_PHONE) console.warn('WARNING: SUPPORT_PHONE not set — support alerts disabled');
});
