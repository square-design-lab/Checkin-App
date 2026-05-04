import { useState, useEffect } from 'react';

export default function HelpRequestModal({ isOpen, onClose, prefillMessage = '' }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(prefillMessage);
  // 'idle' | 'sending' | 'success' | 'error'
  const [phase, setPhase] = useState('idle');

  // Reset form whenever the modal opens, and re-apply prefill
  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setMessage(prefillMessage);
      setPhase('idle');
    }
  }, [isOpen, prefillMessage]);

  // Auto-close 3 s after success
  useEffect(() => {
    if (phase !== 'success') return;
    const t = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(t);
  }, [phase, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setPhase('sending');

    try {
      const res = await fetch('/api/checkin/help-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: name.trim(),
          phoneNumber: phone.trim(),
          message: message.trim(),
        }),
      });

      const data = res.ok ? await res.json() : { success: false };

      if (data.success) {
        setPhase('success');
      } else {
        setPhase('error');
      }
    } catch {
      setPhase('error');
    }
  }

  const canSubmit = name.trim().length > 0 && phase === 'idle';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        // Close on backdrop click, not on card click
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        {/* Close icon — always visible in top-right corner */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 24,
            lineHeight: 1,
            padding: 4,
            touchAction: 'manipulation',
          }}
        >
          ✕
        </button>

        {phase === 'success' ? (
          <div className="modal-success">
            ✓ Message sent!<br />
            <span style={{ fontWeight: 400, fontSize: 16, color: 'var(--text-muted)' }}>
              A team member will be with you shortly.
            </span>
          </div>
        ) : (
          <>
            <h2 className="modal-title">Request Help</h2>
            <p className="modal-subtitle">
              Fill in your details and we'll have someone assist you right away.
            </p>

            <form
              className="form"
              onSubmit={handleSubmit}
              style={{ gap: 16 }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="help-name">Name</label>
                <input
                  id="help-name"
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoCapitalize="words"
                  autoComplete="name"
                  disabled={phase === 'sending'}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="help-phone">Phone Number</label>
                <input
                  id="help-phone"
                  className="form-input"
                  type="tel"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={phase === 'sending'}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="help-message">Message</label>
                <textarea
                  id="help-message"
                  className="form-input"
                  rows={3}
                  placeholder="How can we help you?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={phase === 'sending'}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {phase === 'error' && (
                <p className="msg-error">
                  Unable to send message. Please ask a staff member for help.
                </p>
              )}

              {phase === 'sending' ? (
                <div className="spinner-wrap" style={{ marginTop: 4 }}>
                  <div className="spinner" />
                  <span className="spinner-label">Sending…</span>
                </div>
              ) : (
                <div className="btn-stack" style={{ marginTop: 4 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canSubmit}
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
