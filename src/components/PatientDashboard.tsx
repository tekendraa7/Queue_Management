import React, { useState, useEffect, useMemo } from 'react';
import { Visit, Department, ClinicalOrder, VisitStatus } from '../types';
import { Language } from '../i18n';

interface PatientDashboardProps {
  visits: Visit[];
  departments: Department[];
  lang: Language;
  t: any;
  initialVisitId?: string | null;
  onPrintTicket: (visit: Visit) => void;
  speakAnnouncement: (token: string, roomName: string) => void;
  getWaitMinutes: (queuedAtStr: string) => number;
}

// Melodic hospital announcement chime using Web Audio API
function playHospitalChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // First tone (523Hz / C5) then second tone (659Hz / E5)
    playTone(523.25, now, 0.4);
    playTone(659.25, now + 0.25, 0.6);
  } catch {
    // Audio context may require user interaction
  }
}

export function PatientDashboard({
  visits,
  departments,
  lang,
  t,
  initialVisitId,
  onPrintTicket,
  speakAnnouncement,
  getWaitMinutes,
}: PatientDashboardProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Authenticated state stored in session / local storage for patient convenience
  const [authenticatedVisitId, setAuthenticatedVisitId] = useState<string | null>(() => {
    if (initialVisitId) return initialVisitId;
    const saved = localStorage.getItem('smartq_patient_auth_visit_id');
    return saved || null;
  });

  const [lastStatus, setLastStatus] = useState<VisitStatus | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-refresh pulse timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncTime(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update authenticated visit from prop if passed
  useEffect(() => {
    if (initialVisitId) {
      setAuthenticatedVisitId(initialVisitId);
      localStorage.setItem('smartq_patient_auth_visit_id', initialVisitId);
    }
  }, [initialVisitId]);

  // Find the currently tracked visit from real-time visits list
  const currentVisit = useMemo(() => {
    if (!authenticatedVisitId) return null;
    return visits.find((v) => v.id === authenticatedVisitId) || null;
  }, [visits, authenticatedVisitId]);

  // Sound chime and announcement if status transitions to 'called'
  useEffect(() => {
    if (currentVisit) {
      if (lastStatus && lastStatus !== 'called' && currentVisit.status === 'called') {
        playHospitalChime();
        speakAnnouncement(
          currentVisit.token,
          lang === 'ne' ? currentVisit.department.locationNe : currentVisit.department.location
        );
      }
      setLastStatus(currentVisit.status);
    }
  }, [currentVisit?.status]);

  // Calculate live queue stats for this visit
  const queueStats = useMemo(() => {
    if (!currentVisit) return { patientsAhead: 0, estimatedMinutes: 0 };
    const deptVisits = visits.filter(
      (v) => v.departmentId === currentVisit.departmentId && v.date === currentVisit.date
    );

    // Waiting visits in front of this visit
    const waitingList = deptVisits.filter((v) => v.status === 'waiting');
    const myIndex = waitingList.findIndex((v) => v.id === currentVisit.id);
    const ahead = myIndex >= 0 ? myIndex : 0;
    const estMin = Math.max(5, (ahead + 1) * 8);

    return {
      patientsAhead: ahead,
      estimatedMinutes: estMin,
    };
  }, [currentVisit, visits]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanToken = tokenInput.trim().toUpperCase();
    const cleanPin = pinInput.trim();

    if (!cleanToken || !cleanPin) {
      setAuthError(
        lang === 'ne'
          ? 'कृपया टोकन नम्बर र ४-अङ्कको पिन दुवै प्रविष्ट गर्नुहोस्।'
          : 'Please enter both Token Number and 4-digit PIN code.'
      );
      return;
    }

    let matched = visits.find(
      (v) => v.token.toUpperCase() === cleanToken && v.pinCode === cleanPin
    );

    if (!matched) {
      try {
        const res = await fetch('/api/auth/patient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: cleanToken, pinCode: cleanPin }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.visit) {
            matched = data.visit;
          }
        }
      } catch {
        // Fallback to local check
      }
    }

    if (matched) {
      setAuthenticatedVisitId(matched.id);
      localStorage.setItem('smartq_patient_auth_visit_id', matched.id);
      setAuthError(null);
      // Play brief welcoming chime
      playHospitalChime();
    } else {
      // Check if token exists with different PIN
      const tokenOnlyMatch = visits.find((v) => v.token.toUpperCase() === cleanToken);
      if (tokenOnlyMatch) {
        setAuthError(
          lang === 'ne'
            ? 'पिन कोड मिलेन। कृपया टिकट पर्चामा छापिएको ४-अङ्कको पिन हेर्नुहोस्।'
            : 'Incorrect PIN code for this token. Please check the 4-digit PIN on your slip.'
        );
      } else {
        setAuthError(
          lang === 'ne'
            ? 'यो टोकन नम्बर भेटिएन। कृपया सही टोकन नम्बर प्रविष्ट गर्नुहोस् (जस्तै MED-041)।'
            : 'Token not found or invalid PIN. Please verify the slip details.'
        );
      }
    }
  };

  const handleQuickDemoSelect = (visit: Visit) => {
    setTokenInput(visit.token);
    setPinInput(visit.pinCode);
    setAuthenticatedVisitId(visit.id);
    localStorage.setItem('smartq_patient_auth_visit_id', visit.id);
    setAuthError(null);
    playHospitalChime();
  };

  const handleLogout = () => {
    setAuthenticatedVisitId(null);
    localStorage.removeItem('smartq_patient_auth_visit_id');
    setTokenInput('');
    setPinInput('');
    setAuthError(null);
  };

  const handleShareOrCopy = () => {
    if (!currentVisit) return;
    const text = `SmartQ Nepal Live Tracker: Token ${currentVisit.token} (PIN: ${currentVisit.pinCode}) - Status: ${currentVisit.status.toUpperCase()} at ${currentVisit.department.name}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // If not logged in, render the Secure Token & PIN Verification screen
  if (!currentVisit) {
    return (
      <div style={{ maxWidth: '840px', margin: '0 auto', padding: '10px 0' }}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{lang === 'ne' ? 'मेरो पालो / बिरामी प्रत्यक्ष ट्र्याकर' : 'PATIENT REAL-TIME PORTAL'}</p>
            <h1>{lang === 'ne' ? 'मेरो पालो प्रत्यक्ष ड्यासबोर्ड (Mero Palo)' : 'Live Patient Status Dashboard'}</h1>
            <p className="muted">
              {lang === 'ne'
                ? 'अस्पतालको पर्चामा रहेको टोकन नम्बर र ४-अङ्कको सुरक्षा पिन हालेर आफ्नो पालो हेर्नुहोस्।'
                : 'Track your real-time position, room directions, test reports, and wait times using your slip token and PIN.'}
            </p>
          </div>
        </div>

        <div className="two-col" style={{ alignItems: 'start' }}>
          {/* LOGIN CARD */}
          <section className="panel padded" style={{ borderTop: '4px solid var(--teal)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e6f3ee', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                📱
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px' }}>
                  {lang === 'ne' ? 'टोकन तथा पिन प्रमाणीकरण' : 'Verify Token & PIN Code'}
                </h2>
                <small className="muted">
                  {lang === 'ne' ? 'सुरक्षित तथा व्यक्तिगत बिरामी विवरण' : 'Confidential patient access verification'}
                </small>
              </div>
            </div>

            {authError && (
              <div className="notice error" style={{ marginBottom: '16px', fontSize: '13px' }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>
                  {lang === 'ne' ? 'टोकन नम्बर (Token Number) *' : 'Visit Token Number *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MED-041, SUR-004, ORT-022"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}
                />
                <small className="muted" style={{ display: 'block', marginTop: '3px', fontSize: '11px' }}>
                  {lang === 'ne' ? 'कागजी पर्चाको माथिल्लो भागमा रहेको ठूलो अक्षरको टोकन।' : 'Printed boldly at the top of your 80mm hospital ticket.'}
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>
                  {lang === 'ne' ? '४-अङ्कको सुरक्षा पिन कोड (4-Digit PIN Code) *' : '4-Digit Confidential PIN Code *'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '20px', letterSpacing: '4px', textAlign: 'center', fontWeight: 800 }}
                />
                <small className="muted" style={{ display: 'block', marginTop: '3px', fontSize: '11px' }}>
                  {lang === 'ne' ? 'पर्चामा "PIN: XXXX" भनी लेखिएको ४-अङ्कको कोड।' : 'Found below QR code on your slip: "PIN: XXXX".'}
                </small>
              </div>

              <button type="submit" className="button wide" style={{ minHeight: '44px', fontSize: '15px' }}>
                {lang === 'ne' ? 'पालो स्थिति हेर्नुहोस् (Track Status) →' : 'Track Real-Time Status →'}
              </button>
            </form>

            <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <b style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                ℹ️ {lang === 'ne' ? 'पिन कोड कहाँ हुन्छ?' : 'Where do I find my PIN code?'}
              </b>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                {lang === 'ne'
                  ? 'दर्ता काउन्टरबाट प्राप्त भएको ८० एमएम पर्चामा क्युआर कोडको ठीक मुनि ४-अङ्कको गोप्य पिन कोड छापिएको हुन्छ।'
                  : 'On your thermal printed paper slip, look directly below the QR code box where it prints "PIN: [4 digits]".'}
              </p>
            </div>
          </section>

          {/* QUICK DEMO ACCESS PANEL */}
          <section className="panel padded">
            <span className="step-number" style={{ background: '#f0fdf4', color: '#166534' }}>DEMO</span>
            <h2>{lang === 'ne' ? 'द्रुत परीक्षण डेमो टोकनहरू (1-Click Test)' : 'Quick Demo Tokens (One-Click)'}</h2>
            <p className="muted" style={{ fontSize: '12px', marginBottom: '14px' }}>
              {lang === 'ne'
                ? 'परीक्षण गर्न तल दिइएको कुनै पनि सक्रिय बिरामी टोकन छान्नुहोस्:'
                : 'Click any active demo patient below to instantly simulate their live mobile portal:'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visits.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleQuickDemoSelect(v)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="token-chip" style={{ fontSize: '13px', padding: '3px 8px' }}>{v.token}</span>
                      <b style={{ fontSize: '14px' }}>{v.patient.name}</b>
                    </div>
                    <small style={{ color: '#64748b', display: 'block', marginTop: '2px', fontSize: '11.5px' }}>
                      {lang === 'ne' ? v.department.nameNe : v.department.name} · {lang === 'ne' ? v.department.locationNe : v.department.location}
                    </small>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      {v.isClinicalEmergency && <span className="badge urgent" style={{ fontSize: '10px', padding: '1px 6px' }}>🚨 Emergency</span>}
                      {v.patient.hasDisability && <span className="badge" style={{ fontSize: '10px', padding: '1px 6px', background: '#dbeafe', color: '#1e40af' }}>♿ Disabled</span>}
                      {v.subQueue === 'review' && <span className="badge review" style={{ fontSize: '10px', padding: '1px 6px' }}>📋 Report Ready</span>}
                      <span className={`badge ${v.status}`} style={{ fontSize: '10px', padding: '1px 6px' }}>{v.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f766e', background: '#ccfbf1', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                      PIN: {v.pinCode}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--teal)', fontWeight: 600 }}>
                      {lang === 'ne' ? 'खोल्नुहोस् →' : 'Open →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED REAL-TIME DASHBOARD VIEW
  // --------------------------------------------------------------------------
  const dept = currentVisit.department;
  const patient = currentVisit.patient;
  const isCalled = currentVisit.status === 'called';
  const isInService = currentVisit.status === 'in_service';
  const isWaiting = currentVisit.status === 'waiting';
  const isCompleted = currentVisit.status === 'completed';
  const isAbsent = currentVisit.status === 'absent';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0' }}>
      {/* TOP USER & REALTIME STATUS HEADER */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: isCalled ? '#dcfce7' : '#e6f3ee',
            color: isCalled ? '#15803d' : 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            border: isCalled ? '2px solid #22c55e' : 'none',
          }}>
            {isCalled ? '🔔' : isInService ? '🩺' : isWaiting ? '⏳' : isCompleted ? '✅' : '👤'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'ne' ? 'बिरामी प्रत्यक्ष ड्यासबोर्ड' : 'VERIFIED PATIENT SESSION'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                {lang === 'ne' ? 'प्रत्यक्ष (Live Sync)' : 'Live Synced'}
              </span>
            </div>
            <h2 style={{ margin: '2px 0', fontSize: '20px' }}>
              {patient.name} <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>({patient.hospitalId})</span>
            </h2>
            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#475569', flexWrap: 'wrap', marginTop: '2px' }}>
              <span>{patient.age ? `${patient.age} yrs` : 'Age: —'}</span> ·
              <span>{patient.gender}</span> ·
              {patient.bimaNumber && <span style={{ color: '#047857', fontWeight: 600 }}>बीमा: {patient.bimaNumber}</span>}
              <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                PIN: {currentVisit.pinCode}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="button secondary"
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12px' }}
            onClick={() => speakAnnouncement(currentVisit.token, lang === 'ne' ? dept.locationNe : dept.location)}
          >
            🔊 {lang === 'ne' ? 'अडियो सुन्नुहोस्' : 'Audio Announcement'}
          </button>
          <button
            className="button secondary"
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12px' }}
            onClick={() => onPrintTicket(currentVisit)}
          >
            🖨️ {lang === 'ne' ? 'पर्चा हेर्नुहोस्' : 'View Slip'}
          </button>
          <button
            className="button secondary"
            style={{ minHeight: '34px', padding: '4px 12px', fontSize: '12px', color: '#b91c1c' }}
            onClick={handleLogout}
          >
            🚪 {lang === 'ne' ? 'टोकन परिवर्तन / बाहिरिनुहोस्' : 'Switch Token'}
          </button>
        </div>
      </div>

      {/* HERO STATUS BANNER */}
      {isCalled && (
        <div style={{
          background: '#dcfce7',
          border: '3px solid #16a34a',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
          color: '#14532d',
          textAlign: 'center',
          boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.2)',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '4px' }}>🔔</div>
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#15803d' }}>
            {lang === 'ne' ? 'तपाईंको पालो आयो! कोठामा जानुहोस्' : 'YOUR TOKEN HAS BEEN CALLED!'}
          </span>
          <div className="call-token" style={{ fontSize: '56px', fontWeight: 900, color: '#166534', margin: '8px 0' }}>
            {currentVisit.token}
          </div>
          <p style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0' }}>
            📍 {lang === 'ne' ? dept.nameNe : dept.name} — {lang === 'ne' ? dept.locationNe : dept.location}
          </p>
          <p style={{ fontSize: '14px', color: '#166534', maxWidth: '600px', margin: '0 auto' }}>
            {lang === 'ne'
              ? 'कृपया ढिला नगरी सिधै तोकिएको कोठाभित्र प्रवेश गर्नुहोस्। डाक्टर वा स्वास्थ्यकर्मी तपाईंको प्रतीक्षामा हुनुहुन्छ।'
              : 'Please proceed directly into the room now. The healthcare staff is ready to see you.'}
          </p>
          <div style={{ marginTop: '16px' }}>
            <button
              className="button"
              style={{ background: '#16a34a', borderColor: '#15803d', fontSize: '15px', padding: '10px 24px' }}
              onClick={() => speakAnnouncement(currentVisit.token, lang === 'ne' ? dept.locationNe : dept.location)}
            >
              🔊 {lang === 'ne' ? 'आवाजमा फेरि सुन्नुहोस् (Play Voice Call)' : 'Repeat Voice Announcement'}
            </button>
          </div>
        </div>
      )}

      {isInService && (
        <div style={{
          background: '#eff6ff',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#1e3a8a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#2563eb' }}>
              {lang === 'ne' ? 'परामर्श / सेवा जारी' : 'SERVICE IN PROGRESS'}
            </span>
            <h3 style={{ margin: '4px 0', fontSize: '20px' }}>
              🔵 {lang === 'ne' ? 'तपाईंको जाँच कार्यकक्षमा भइरहेको छ।' : 'Consultation / Investigation in progress.'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>
              📍 {lang === 'ne' ? dept.nameNe : dept.name} · {lang === 'ne' ? dept.locationNe : dept.location}
            </p>
          </div>
          <div className="call-token" style={{ fontSize: '32px', color: '#1d4ed8' }}>
            {currentVisit.token}
          </div>
        </div>
      )}

      {isWaiting && (
        <div style={{
          background: '#fffbeb',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#92400e',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#b45309' }}>
                {lang === 'ne' ? 'पालो पर्खँदै (QUEUE WAITING)' : 'QUEUE WAITING STATUS'}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
                <span className="call-token" style={{ fontSize: '38px', color: '#b45309' }}>{currentVisit.token}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>
                    {lang === 'ne' ? dept.nameNe : dept.name}
                  </h3>
                  <small style={{ color: '#78350f', fontSize: '13px' }}>
                    📍 {lang === 'ne' ? dept.locationNe : dept.location} ({dept.colorZone})
                  </small>
                </div>
              </div>
            </div>

            {/* LIVE QUEUE COUNTERS */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 16px', textAlign: 'center', minWidth: '110px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#78350f', fontWeight: 600 }}>
                  {lang === 'ne' ? 'अगाडि बिरामी' : 'Ahead of You'}
                </span>
                <strong style={{ fontSize: '26px', color: '#b45309', display: 'block', lineHeight: 1.2 }}>
                  {queueStats.patientsAhead}
                </strong>
                <small style={{ fontSize: '10.5px', color: '#92400e' }}>
                  {lang === 'ne' ? 'जना बाँकी' : 'patients'}
                </small>
              </div>

              <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 16px', textAlign: 'center', minWidth: '110px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#78350f', fontWeight: 600 }}>
                  {lang === 'ne' ? 'अनुमानित समय' : 'Est. Wait'}
                </span>
                <strong style={{ fontSize: '26px', color: '#b45309', display: 'block', lineHeight: 1.2 }}>
                  ~{queueStats.estimatedMinutes}
                </strong>
                <small style={{ fontSize: '10.5px', color: '#92400e' }}>
                  {lang === 'ne' ? 'मिनेट' : 'minutes'}
                </small>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
            <span>
              🕒 {lang === 'ne' ? 'दर्ता भएको करिब' : 'Elapsed wait:'} <b>{getWaitMinutes(currentVisit.queuedAt)} {lang === 'ne' ? 'मिनेट' : 'mins'}</b>
            </span>
            <span style={{ color: '#78350f' }}>
              ℹ️ {lang === 'ne' ? 'प्रतीक्षालयमा बस्नुहोस् र टिभी स्क्रिनमा नजर राख्नुहोस्।' : 'Please take a seat in the waiting lounge nearby.'}
            </span>
          </div>
        </div>
      )}

      {isAbsent && (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#991b1b',
        }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
            ⚠️ {lang === 'ne' ? 'तपाईंलाई बोलाउँदा अनुपस्थित देखियो' : 'Marked Temporarily Absent'}
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '13.5px' }}>
            {lang === 'ne'
              ? 'डाक्टर वा कर्मचारीले बोलाउँदा कोठामा उपस्थित नहुनुभएकोले पालो रोकिएको छ। कृपया सोधपुछ वा दर्ता काउन्टरमा गई आफ्नो टोकन पुनः सक्रिय गर्नुहोस्।'
              : 'You were called to the room but did not respond. Please report to the reception desk to have your token reactivated into the queue.'}
          </p>
        </div>
      )}

      {isCompleted && (
        <div style={{
          background: '#f0fdf4',
          border: '2px solid #22c55e',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          color: '#166534',
        }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '20px' }}>
            ✅ {lang === 'ne' ? 'आजको स्वास्थ्य सेवा सम्पन्न भयो!' : 'Hospital Visit Completed Successfully!'}
          </h3>
          <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
            {lang === 'ne'
              ? 'तपाईंको आजको सम्पूर्ण परामर्श, जाँच तथा औषधि वितरण प्रक्रिया सकिएको छ। स्वास्थ्य लाभको कामना गर्दछौं!'
              : 'Your consultation, diagnostic tests, and prescription fulfillment have all been completed for today.'}
          </p>
        </div>
      )}

      {/* PRIORITY & ACCOMMODATION BADGES */}
      {(currentVisit.isClinicalEmergency || patient.hasDisability || patient.isSenior || patient.isPregnant) && (
        <div style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
            {lang === 'ne' ? 'तपाईंको विशेष सुविधा:' : 'Active Accommodations:'}
          </span>
          {currentVisit.isClinicalEmergency && (
            <span className="badge urgent" style={{ fontSize: '12px', padding: '3px 10px' }}>
              🚨 {lang === 'ne' ? 'आकस्मिक प्राथमिकता (Immediate Triage)' : 'Emergency Clinical Priority'}
            </span>
          )}
          {patient.hasDisability && (
            <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', fontSize: '12px', padding: '3px 10px' }}>
              ♿ {lang === 'ne' ? 'अपाङ्गता पहुँच सुविधा (Wheelchair / Priority)' : 'Physically Disabled (Accessibility)'}
            </span>
          )}
          {patient.isSenior && (
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', padding: '3px 10px' }}>
              👴 {lang === 'ne' ? 'ज्येष्ठ नागरिक (६५+)' : 'Senior Citizen (65+)'}
            </span>
          )}
          {patient.isPregnant && (
            <span className="badge" style={{ background: '#fce7f3', color: '#9d174d', fontSize: '12px', padding: '3px 10px' }}>
              🤰 {lang === 'ne' ? 'गर्भवती महिला प्राथमिकता' : 'Maternal Care Priority'}
            </span>
          )}
        </div>
      )}

      {/* TWO-COLUMN DETAILS: DESTINATION & JOURNEY STEPS */}
      <div className="two-col" style={{ alignItems: 'start' }}>
        <div>
          {/* WHERE TO GO / DESTINATION CARD */}
          <div className="panel padded" style={{ marginBottom: '20px' }}>
            <span className="step-number" style={{ background: '#e0f2fe', color: '#0369a1' }}>01</span>
            <h2>{lang === 'ne' ? 'कहाँ जाने? (Your Exact Destination)' : 'Where Should You Go?'}</h2>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="token-chip" style={{ background: '#0284c7', color: '#fff', fontSize: '14px' }}>
                  {dept.prefix}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: '#e2e8f0' }}>
                  {dept.colorZone}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', margin: '8px 0 4px 0', color: '#0f172a' }}>
                {lang === 'ne' ? dept.nameNe : dept.name}
              </h3>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--teal)', margin: '0 0 8px 0' }}>
                📍 {lang === 'ne' ? dept.locationNe : dept.location}
              </p>

              {dept.description && (
                <p style={{ fontSize: '12.5px', color: '#475569', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  {lang === 'ne' ? dept.descriptionNe : dept.description}
                </p>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                <span>{lang === 'ne' ? 'तल्ला / क्षेत्र:' : 'Building Floor:'} <b>{dept.location.split('·')[0]}</b></span>
                <span>{lang === 'ne' ? 'स्थिति:' : 'Department Status:'} <b style={{ color: dept.isOpen ? '#16a34a' : '#dc2626' }}>{dept.isOpen ? 'OPEN' : 'CLOSED'}</b></span>
              </div>
            </div>
          </div>

          {/* DIAGNOSTIC ORDERS & TEST REPORTS TRACKER */}
          {currentVisit.orders.length > 0 && (
            <div className="panel padded" style={{ marginBottom: '20px' }}>
              <span className="step-number" style={{ background: '#fef3c7', color: '#b45309' }}>02</span>
              <h2>{lang === 'ne' ? 'जाँच तथा रिपोर्ट स्थिति (Orders & Lab Reports)' : 'Diagnostic Tests & Reports'}</h2>
              <p className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
                {lang === 'ne'
                  ? 'डाक्टरले सिफारिस गर्नुभएका प्रयोगशाला तथा एक्स-रे जाँचहरूको प्रत्यक्ष प्रगति:'
                  : 'Real-time status of blood investigations, urine tests, and radiology imaging:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentVisit.orders.map((order: ClinicalOrder) => (
                  <div
                    key={order.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: order.category === 'lab' ? '#7c3aed' : '#0284c7' }}>
                          {order.category === 'lab' ? '🧪 Pathology Lab' : '🩻 Radiology Imaging'}
                        </span>
                        <b style={{ display: 'block', fontSize: '14px', marginTop: '2px' }}>
                          {lang === 'ne' ? order.testNameNe : order.testNameEn}
                        </b>
                      </div>
                      <span className={`badge ${order.isReportReady ? 'waiting' : 'absent'}`} style={{ fontSize: '11px' }}>
                        {order.isReportReady
                          ? (lang === 'ne' ? '✓ रिपोर्ट तयार भयो' : '✓ Report Ready')
                          : (lang === 'ne' ? 'प्रतीक्षारत (In Progress)' : 'In Progress')}
                      </span>
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: order.isPaid ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                        {order.isPaid
                          ? (order.paymentStatus === 'bima_verified' ? '✓ बीमा कभरेज स्वीकृत' : '✓ बिल भुक्तानी सम्पन्न')
                          : '⚠️ काउन्टरमा भुक्तानी बाँकी'}
                      </span>
                      {order.specimenStatus && (
                        <span style={{ color: '#475569' }}>
                          · {lang === 'ne' ? 'नमुना:' : 'Sample:'} <b>{order.specimenStatus.toUpperCase()}</b>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {currentVisit.subQueue === 'review' && (
                <div className="notice" style={{ background: '#e0e7ff', color: '#1e1b4b', marginTop: '14px' }}>
                  <b>📋 {lang === 'ne' ? 'सबै रिपोर्टहरू तयार भए!' : 'All test reports are signed and ready!'}</b>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12.5px' }}>
                    {lang === 'ne'
                      ? 'तपाईंको पालो डाक्टरको प्राथमिकता रिभ्यु सूचीमा राखिएको छ। कृपया डाक्टरको कोठा अगाडि बस्नुहोस्।'
                      : 'Your token is now in the doctor return review queue. Proceed back to the OPD room.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTION PREVIEW */}
          {currentVisit.prescriptionNotes && (
            <div className="panel padded">
              <span className="step-number" style={{ background: '#fdf2f8', color: '#be185d' }}>03</span>
              <h2>{lang === 'ne' ? 'डाक्टरको औषधि सिफारिस (Prescription)' : 'Doctor Prescription'}</h2>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '8px', fontSize: '13.5px', whiteSpace: 'pre-wrap' }}>
                💊 {currentVisit.prescriptionNotes}
              </div>
              <small className="muted" style={{ display: 'block', marginTop: '6px' }}>
                {lang === 'ne' ? 'औषधि लिन भुइँ तल्लाको फार्मेसी झ्याल ०१ मा जानुहोस्।' : 'Proceed to Pharmacy Window 1 (Ground Floor) to collect medications.'}
              </small>
            </div>
          )}
        </div>

        <div>
          {/* COMPLETE 6-STEP HOSPITAL JOURNEY ROADMAP */}
          <div className="panel padded" style={{ marginBottom: '20px' }}>
            <h2>{lang === 'ne' ? 'अस्पताल यात्रा प्रगति (Journey Roadmap)' : 'Hospital Journey Progress'}</h2>
            <p className="muted" style={{ fontSize: '12px', marginBottom: '14px' }}>
              {lang === 'ne' ? 'आजको अस्पताल बसाइको ६ निश्चित पाइलाहरू:' : '6 coordinated hospital care checkpoints:'}
            </p>

            <div className="journey-progress">
              <div className="journey-step-item current">
                <span>1. {lang === 'ne' ? 'दर्ता तथा टोकन पर्चा' : 'Registration & Ticket'}</span>
                <span>✓ {lang === 'ne' ? 'सम्पन्न' : 'Done'}</span>
              </div>
              <div className={`journey-step-item ${dept.type === 'opd' ? 'current' : ''}`}>
                <span>2. {lang === 'ne' ? dept.nameNe : dept.name}</span>
                <span>{dept.type === 'opd' ? (isCompleted ? '✓ Done' : '● ' + currentVisit.status.toUpperCase()) : '✓'}</span>
              </div>
              <div className={`journey-step-item ${dept.type === 'billing' ? 'current' : ''}`}>
                <span>3. {lang === 'ne' ? 'बिलिङ / बीमा प्रमाणीकरण (काउन्टर ०२)' : 'Billing & Bima Clearance (Counter 02)'}</span>
                <span>{dept.type === 'billing' ? '● Active' : (currentVisit.orders.some((o) => o.isPaid) ? '✓ Paid' : '○ Pending')}</span>
              </div>
              <div className={`journey-step-item ${dept.type === 'lab' || dept.type === 'radiology' ? 'current' : ''}`}>
                <span>4. {lang === 'ne' ? 'ल्याब नमुना तथा एक्स-रे (कोठा १२/०४)' : 'Lab Sample & X-Ray (Room 12/04)'}</span>
                <span>{dept.type === 'lab' || dept.type === 'radiology' ? '● Active' : (currentVisit.orders.length > 0 ? (currentVisit.orders.every((o) => o.isReportReady) ? '✓ Ready' : '○ In Progress') : '—')}</span>
              </div>
              <div className={`journey-step-item ${currentVisit.subQueue === 'review' ? 'current' : ''}`}>
                <span>5. {lang === 'ne' ? 'डाक्टर रिभ्यु (रिपोर्ट देखाउने)' : 'Doctor Review (Report Return)'}</span>
                <span>{currentVisit.subQueue === 'review' ? '★ Ready' : '○'}</span>
              </div>
              <div className={`journey-step-item ${dept.type === 'pharmacy' ? 'current' : ''}`}>
                <span>6. {lang === 'ne' ? 'फार्मेसी औषधि वितरण (झ्याल ०१)' : 'Pharmacy Dispensing (Window 01)'}</span>
                <span>{dept.type === 'pharmacy' ? '● Active' : (isCompleted ? '✓ Done' : '○')}</span>
              </div>
            </div>
          </div>

          {/* HELP & ASSISTANCE */}
          <div className="panel padded">
            <h3>{lang === 'ne' ? 'सहयोग चाहिन्छ? (Need Help?)' : 'Need Assistance?'}</h3>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0' }}>
              {lang === 'ne'
                ? 'यदि तपाईंलाई कोठा पत्ता लगाउन गाह्रो भएमा वा ह्विलचेयर चाहिएमा मुख्य प्रवेशद्वार नजिकको सोधपुछ कक्षमा सम्पर्क गर्नुहोस् वा निलो एप्रोन लगाएका सहयोगीलाई आफ्नो पर्चा देखाउनुहोस्।'
                : 'If you have trouble finding your room, need a wheelchair, or have questions about tests, visit the Help Desk near the entrance or ask any staff in a blue apron.'}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="button secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={handleShareOrCopy}
              >
                {copiedLink ? (lang === 'ne' ? '✓ लिङ्क कपी भयो!' : '✓ Details Copied!') : (lang === 'ne' ? '📋 विवरण कपी गर्नुहोस्' : '📋 Copy Token Details')}
              </button>
              <button
                className="button secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => onPrintTicket(currentVisit)}
              >
                🖨️ {lang === 'ne' ? 'पर्चा छाप्नुहोस्' : 'Print Paper Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
