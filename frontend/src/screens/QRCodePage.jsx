import { QRCodeSVG } from 'qrcode.react';

const BASE_URL = 'https://checkin.vantagementalhealth.org';

const LOCATIONS = [
  { name: 'Stillwater',  dept: 1 },
  { name: 'St. Anthony', dept: 5 },
  { name: 'Edina',       dept: 8 },
];

export default function QRCodePage() {
  return (
    <div style={styles.page}>
      <div style={styles.toolbar} className="no-print">
        <h1 style={styles.heading}>Check-In QR Codes</h1>
        <button style={styles.printBtn} onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div style={styles.grid}>
        {LOCATIONS.map(({ name, dept }) => {
          const url = `${BASE_URL}/?dept=${dept}`;
          return (
            <div key={dept} style={styles.card}>
              <h2 style={styles.locationName}>{name}</h2>
              <div style={styles.qrWrap}>
                <QRCodeSVG value={url} size={220} level="M" />
              </div>
              <p style={styles.urlText}>{url}</p>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fa',
    padding: '32px 40px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    color: '#425853',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    color: '#425853',
  },
  printBtn: {
    background: '#425853',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 28px',
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 32,
    justifyContent: 'center',
  },
  card: {
    background: '#fff',
    border: '1.5px solid #d4dee8',
    borderRadius: 16,
    padding: '32px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    minWidth: 280,
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  locationName: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: '#425853',
  },
  qrWrap: {
    lineHeight: 0, // removes extra space below SVG
  },
  urlText: {
    fontSize: 12,
    color: '#6b7e8f',
    margin: 0,
    wordBreak: 'break-all',
    textAlign: 'center',
  },
};
