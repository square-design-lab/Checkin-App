// ── Bulk Appointment Creator ─────────────────────────────────────────────────
// Creates one appointment per patient per day from 05/06/2026 to 05/31/2026
// then books each appointment to the correct patient.
//
// SETUP:
//   1. Copy this file to your Checkin App/backend/ folder
//   2. Run: node create-appointments.js
//
// REQUIRES: .env file in the same folder with ATHENA credentials
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const axios = require('axios');

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL   = process.env.ATHENA_BASE_URL  || 'https://api.preview.platform.athenahealth.com';
const PRACTICE   = process.env.ATHENA_PRACTICE_ID || '3153301';
const CLIENT_ID  = process.env.ATHENA_CLIENT_ID;
const CLIENT_SEC = process.env.ATHENA_CLIENT_SECRET;

const DEPARTMENT_ID      = '1';
const PROVIDER_ID        = '1';
const APPOINTMENT_TYPE   = '2';   // MM Follow-up (Office)

const START_DATE = new Date('2026-05-06');
const END_DATE   = new Date('2026-05-31');

// Patients to book — one appointment each per day
const PATIENTS = [
  { patientId: '4035', firstName: 'John',   lastName: 'Smith' },
  { patientId: '4036', firstName: 'Robert', lastName: 'Smith' },
  { patientId: '4037', firstName: 'James',  lastName: 'Smith' },
];

// Random times between 08:00 and 14:00 (30-min slots)
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00'
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomTime() {
  return TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
}

function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getDatesInRange(start, end) {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(formatDate(new Date(current)));
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Auth ──────────────────────────────────────────────────────────────────────

let tokenCache = { token: null, expiresAt: 0 };

async function getToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  const res = await axios.post(
    `${BASE_URL}/oauth2/v1/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'athena/service/Athenanet.MDP.*'
    }),
    {
      auth: { username: CLIENT_ID, password: CLIENT_SEC },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );
  tokenCache = {
    token: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in - 120) * 1000
  };
  console.log('  ✔ Token acquired');
  return tokenCache.token;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

async function createOpenSlot(date, time) {
  const token = await getToken();
  const res = await axios.post(
    `${BASE_URL}/v1/${PRACTICE}/appointments/open`,
    new URLSearchParams({
      appointmentdate:   date,
      appointmenttime:   time,
      appointmenttypeid: APPOINTMENT_TYPE,
      departmentid:      DEPARTMENT_ID,
      providerid:        PROVIDER_ID
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  // Response: { "appointmentids": { "208300": "10:00" } }
  const ids = res.data.appointmentids;
  if (!ids) throw new Error('No appointmentids in response: ' + JSON.stringify(res.data));
  return Object.keys(ids)[0]; // return first appointment ID
}

async function bookAppointment(appointmentId, patientId) {
  const token = await getToken();
  await axios.put(
    `${BASE_URL}/v1/${PRACTICE}/appointments/${appointmentId}`,
    new URLSearchParams({
      patientid:         patientId,
      departmentid:      DEPARTMENT_ID,
      appointmenttypeid: APPOINTMENT_TYPE
    }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Vantage Bulk Appointment Creator');
  console.log(`  Practice: ${PRACTICE}`);
  console.log(`  Date range: 05/06/2026 → 05/31/2026`);
  console.log(`  Patients: ${PATIENTS.length}`);
  console.log('═══════════════════════════════════════════\n');

  if (!CLIENT_ID || !CLIENT_SEC) {
    console.error('ERROR: ATHENA_CLIENT_ID or ATHENA_CLIENT_SECRET missing from .env');
    process.exit(1);
  }

  const dates = getDatesInRange(START_DATE, END_DATE);
  console.log(`  Weekdays in range: ${dates.length}`);
  console.log(`  Total appointments to create: ${dates.length * PATIENTS.length}\n`);

  let created = 0;
  let failed  = 0;
  const errors = [];

  for (const date of dates) {
    console.log(`\n── ${date} ──────────────────────────────`);

    for (const patient of PATIENTS) {
      const time = randomTime();
      process.stdout.write(`  ${patient.firstName} ${patient.lastName} @ ${time} ... `);

      try {
        // Step 1: Create open slot
        const apptId = await createOpenSlot(date, time);
        await sleep(300); // small delay between calls

        // Step 2: Book patient into slot
        await bookAppointment(apptId, patient.patientId);
        await sleep(300);

        console.log(`✔ appt ${apptId}`);
        created++;

      } catch (err) {
        const msg = err.response?.data?.detailedmessage || err.response?.data?.error || err.message;
        console.log(`✘ FAILED — ${msg}`);
        errors.push({ date, patient: patient.firstName, time, error: msg });
        failed++;
      }
    }

    // Pause between days to avoid rate limiting
    await sleep(500);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════');
  console.log('  COMPLETE');
  console.log(`  ✔ Created: ${created}`);
  console.log(`  ✘ Failed:  ${failed}`);
  console.log('═══════════════════════════════════════════');

  if (errors.length > 0) {
    console.log('\nFailed appointments:');
    errors.forEach(e => {
      console.log(`  ${e.date} | ${e.patient} @ ${e.time} → ${e.error}`);
    });
  }
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});