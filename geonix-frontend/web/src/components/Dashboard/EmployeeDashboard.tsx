import { useEffect, useRef, useState } from 'react';
import { attendanceService } from '@/services/attendance';
import { geofencingService } from '@/services/geofencing';
import { AttendanceRecord } from '@/types/attendance';
import { LocationUpdate } from '@/types/geofencing';
import toast from 'react-hot-toast';

/* ─── design tokens ───────────────────────────────────────────────── */
const C = {
  bg0: '#080e1a',
  bg1: '#0b1220',
  bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)',
  borderFaint: 'rgba(100,160,255,0.06)',
  teal: '#00c9a7',
  blue: '#4d9fff',
  amber: '#ffb347',
  red: '#ff6b6b',
  textPrimary: '#e8eef8',
  textSecondary: '#8aa8d0',
  textMuted: '#3d5a80',
  textDim: '#2d4060',
};

/* ─── radar sweep canvas ──────────────────────────────────────────── */
function RadarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let angle = 0;
    let raf: number;
    function draw() {
      ctx.clearRect(0, 0, 120, 120);
      ctx.save();
      ctx.translate(60, 60);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 58, angle, angle + Math.PI * 0.6);
      ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 58);
      g.addColorStop(0, 'rgba(0,201,167,0.0)');
      g.addColorStop(0.7, 'rgba(0,201,167,0.06)');
      g.addColorStop(1, 'rgba(0,201,167,0.15)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      angle += 0.025;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      width={120}
      height={120}
      style={{ position: 'absolute', inset: 0, borderRadius: '50%' }}
    />
  );
}

/* ─── small helpers ───────────────────────────────────────────────── */
const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { month: 'short', day: '2-digit' });

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
      {children}
    </p>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '12px 14px' }}>
      <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 500, color: C.textPrimary, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: accent, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    checked_in: { color: C.teal, bg: 'rgba(0,201,167,0.10)', border: 'rgba(0,201,167,0.22)' },
    checked_out: { color: C.blue, bg: 'rgba(77,159,255,0.10)', border: 'rgba(77,159,255,0.22)' },
  };
  const s = map[status] ?? { color: C.textMuted, bg: 'rgba(61,90,128,0.15)', border: 'transparent' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, color: s.color, background: s.bg, border: `0.5px solid ${s.border}` }}>
      {status}
    </span>
  );
}

function Divider() {
  return <div style={{ height: 0.5, background: C.borderFaint }} />;
}

/* ─── parse total_hours "HH:MM:SS" → decimal ──────────────────────── */
function hoursDecimal(total?: string | null): number {
  if (!total) return 0;
  const [h, m] = total.split(':').map(Number);
  return Math.round(((h ?? 0) + (m ?? 0) / 60) * 10) / 10;
}

/* ─── main component ──────────────────────────────────────────────── */
export default function EmployeeDashboard() {
  const [todayStatus, setTodayStatus] = useState<AttendanceRecord | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);

  useEffect(() => { loadEmployeeDashboard(); }, []);

  const loadEmployeeDashboard = async () => {
    try {
      setIsLoading(true);
      const [today, records, location] = await Promise.all([
        attendanceService.getTodayStatus().catch((error) => {
          if (error.response?.status === 404) return null;
          throw error;
        }),
        attendanceService.getMyRecords(7).catch(() => []),
        geofencingService.getCurrentStatus().catch(() => null),
      ]);
      setTodayStatus(today);
      setMyRecords(records || []);
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLocation = async () => {
    try {
      setIsSubmittingLocation(true);
      if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            let { latitude, longitude, accuracy } = position.coords;
            latitude = Math.round(latitude * 1_000_000) / 1_000_000;
            longitude = Math.round(longitude * 1_000_000) / 1_000_000;
            const accuracyInt = accuracy ? Math.round(accuracy) : 0;
            await geofencingService.submitLocation(latitude, longitude, accuracyInt);
            toast.success('Location submitted successfully!');
            await loadEmployeeDashboard();
          } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to submit location';
            toast.error(msg);
          } finally {
            setIsSubmittingLocation(false);
          }
        },
        () => {
          toast.error('Please enable location access in browser settings');
          setIsSubmittingLocation(false);
        }
      );
    } catch {
      toast.error('An error occurred');
      setIsSubmittingLocation(false);
    }
  };

  const handleManualCheckIn = async () => {
    try {
      setIsSubmittingLocation(true);
      await attendanceService.manualCheckIn(new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[1].slice(0, 5));
      toast.success('Checked in successfully!');
      await loadEmployeeDashboard();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to check in';
      toast.error(msg);
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleManualCheckOut = async () => {
    try {
      setIsSubmittingLocation(true);
      await attendanceService.manualCheckOut(new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[1].slice(0, 5));
      toast.success('Checked out successfully!');
      await loadEmployeeDashboard();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to check out';
      toast.error(msg);
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  /* derived stats */
  const presentDays = myRecords.filter((r) => r.is_present).length;
  const lateDays = myRecords.filter((r) => r.is_late).length;
  const totalHours = myRecords.reduce((s, r) => s + hoursDecimal(r.total_hours), 0);

  /* loading */
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${C.bg2}`, borderTopColor: C.teal, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: C.textMuted, fontSize: 13 }}>Loading your dashboard…</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg0, flex: 1, color: C.textPrimary, fontFamily: "'DM Sans','Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.4)}}
      `}</style>



      {/* ── body grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', minHeight: 'calc(100vh - 54px)' }}>

        {/* left panel */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, borderRight: `0.5px solid ${C.borderFaint}` }}>

          {/* stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <StatCard label="Present days" value={String(presentDays)} sub="Last 7 days" accent={C.teal} />
            <StatCard label="Total hours" value={totalHours.toFixed(1)} sub="This week" accent={C.teal} />
            <StatCard label="Late arrivals" value={String(lateDays)} sub={lateDays > 0 ? `${lateDays} day${lateDays > 1 ? 's' : ''}` : 'All on time'} accent={lateDays > 0 ? C.amber : C.teal} />
          </div>

          {/* check-in zone + radar */}
          <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 20, alignItems: 'center' }}>
            {/* radar */}
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
              {[0, 20, 40].map((inset) => (
                <div key={inset} style={{ position: 'absolute', inset, borderRadius: '50%', border: `0.5px solid rgba(0,201,167,${0.25 - inset * 0.003})` }} />
              ))}
              <RadarCanvas />
              <div style={{ position: 'absolute', inset: 50, borderRadius: '50%', background: 'rgba(0,201,167,0.18)', border: `1px solid ${C.teal}` }} />
            </div>
            {/* info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: 'rgba(0,201,167,0.10)', border: `0.5px solid rgba(0,201,167,0.30)`, color: C.teal, fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, animation: 'blink 1.5s ease-in-out infinite' }} />
                {todayStatus?.is_present ? 'Inside geo-fence' : 'Outside geo-fence'}
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#c8d8f0', marginBottom: 3 }}>Today's session</p>
              <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
                {todayStatus ? `Status: ${todayStatus.status}` : 'No record yet today'}
              </p>
              <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                {[
                  { label: 'Check in', val: fmt(todayStatus?.clock_in_time) },
                  { label: 'Check out', val: fmt(todayStatus?.clock_out_time) },
                  { label: 'Hours', val: todayStatus?.total_hours ? hoursDecimal(todayStatus.total_hours) + 'h' : '–' },
                ].map(f => (
                  <div key={f.label}>
                    <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 3 }}>{f.label}</p>
                    <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary }}>{f.val}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitLocation}
                disabled={isSubmittingLocation}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: isSubmittingLocation ? 'rgba(61,90,128,0.2)' : 'rgba(30,111,255,0.15)', border: `0.5px solid ${isSubmittingLocation ? 'transparent' : 'rgba(77,159,255,0.3)'}`, color: isSubmittingLocation ? C.textMuted : C.blue, fontSize: 12, fontWeight: 500, cursor: isSubmittingLocation ? 'not-allowed' : 'pointer' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {isSubmittingLocation ? 'Submitting…' : 'Share location'}
              </button>

              {/* Manual Check-In/Check-Out Buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleManualCheckIn}
                  disabled={isSubmittingLocation || todayStatus?.status === 'checked_in'}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: todayStatus?.status === 'checked_in' ? 'rgba(0,201,167,0.15)' : 'rgba(0,201,167,0.15)',
                    border: `0.5px solid ${todayStatus?.status === 'checked_in' ? 'rgba(0,201,167,0.3)' : 'rgba(0,201,167,0.3)'}`,
                    color: todayStatus?.status === 'checked_in' ? C.textMuted : C.teal,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: todayStatus?.status === 'checked_in' || isSubmittingLocation ? 'not-allowed' : 'pointer',
                    opacity: todayStatus?.status === 'checked_in' ? 0.5 : 1
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14m-7-7h14" />
                  </svg>
                  {todayStatus?.status === 'checked_in' ? 'Checked in' : 'Check In'}
                </button>

                <button
                  onClick={handleManualCheckOut}
                  disabled={isSubmittingLocation || !todayStatus?.clock_in_time || todayStatus?.status === 'checked_out'}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: todayStatus?.status === 'checked_out' ? 'rgba(77,159,255,0.15)' : 'rgba(77,159,255,0.15)',
                    border: `0.5px solid ${todayStatus?.status === 'checked_out' ? 'rgba(77,159,255,0.3)' : 'rgba(77,159,255,0.3)'}`,
                    color: todayStatus?.status === 'checked_out' ? C.textMuted : C.blue,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: !todayStatus?.clock_in_time || todayStatus?.status === 'checked_out' || isSubmittingLocation ? 'not-allowed' : 'pointer',
                    opacity: !todayStatus?.clock_in_time || todayStatus?.status === 'checked_out' ? 0.5 : 1
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6l-12 12M6 6l12 12" />
                  </svg>
                  {todayStatus?.status === 'checked_out' ? 'Checked out' : 'Check Out'}
                </button>
              </div>
            </div>
          </div>

          {/* bar chart */}
          {myRecords.length > 0 && (() => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const maxH = Math.max(...myRecords.map(r => hoursDecimal(r.total_hours)), 1);
            return (
              <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <SectionTitle>Hours — last 7 days</SectionTitle>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {[...myRecords].reverse().map((r, i) => {
                    const h = hoursDecimal(r.total_hours);
                    const pct = Math.max((h / maxH) * 100, 4);
                    const color = r.is_late ? 'linear-gradient(180deg,#ffb347,#ff6b6b)' : 'linear-gradient(180deg,#1e6fff,#00c9a7)';
                    return (
                      <div key={r.id ?? i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                        <span style={{ fontSize: 9, color: C.textSecondary }}>{h > 0 ? h : '–'}</span>
                        <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: h > 0 ? color : C.bg0, border: h > 0 ? 'none' : `0.5px solid ${C.border}`, height: `${pct}%` }} />
                        <span style={{ fontSize: 9, color: C.textMuted }}>{days[new Date(r.date).getDay()]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* history table */}
          <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 0' }}><SectionTitle>Attendance history — last 7 days</SectionTitle></div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Status', 'In', 'Out', 'Hours', 'Late'].map(h => (
                      <th key={h} style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 12px', textAlign: 'left', borderBottom: `0.5px solid ${C.borderFaint}`, fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myRecords.length > 0 ? myRecords.map((r, i) => (
                    <tr key={r.id ?? i}>
                      <td style={{ fontSize: 11, color: C.textSecondary, padding: '7px 12px', borderBottom: `0.5px solid ${C.borderFaint}` }}>{fmtDate(r.date)}</td>
                      <td style={{ padding: '7px 12px', borderBottom: `0.5px solid ${C.borderFaint}` }}><StatusPill status={r.status} /></td>
                      <td style={{ fontSize: 11, color: C.textSecondary, padding: '7px 12px', borderBottom: `0.5px solid ${C.borderFaint}` }}>{fmt(r.clock_in_time)}</td>
                      <td style={{ fontSize: 11, color: C.textSecondary, padding: '7px 12px', borderBottom: `0.5px solid ${C.borderFaint}` }}>{fmt(r.clock_out_time)}</td>
                      <td style={{ fontSize: 11, color: C.textPrimary, fontWeight: 500, padding: '7px 12px', borderBottom: `0.5px solid ${C.borderFaint}` }}>{hoursDecimal(r.total_hours) || '–'}</td>
                      <td style={{ fontSize: 11, color: r.is_late ? C.amber : C.teal, padding: '7px 12px', borderBottom: `0.5px solid ${C.borderFaint}` }}>{r.is_late ? 'Yes' : 'No'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} style={{ fontSize: 12, color: C.textMuted, padding: '20px 12px', textAlign: 'center' }}>No records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* right panel */}
        <div style={{ padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', background: C.bg0 }}>

          {/* current location */}
          <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
            <SectionTitle>Current location</SectionTitle>
            {/* mini map */}
            <div style={{ height: 60, borderRadius: 7, background: '#081020', border: `0.5px solid ${C.borderFaint}`, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              {[25, 50, 75].map(p => (<>
                <div key={`h${p}`} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 0.5, background: 'rgba(30,80,160,0.2)' }} />
                <div key={`v${p}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 0.5, background: 'rgba(30,80,160,0.2)' }} />
              </>))}
              <div style={{ position: 'absolute', width: 36, height: 36, borderRadius: '50%', border: `1px dashed rgba(0,201,167,0.4)` }} />
              <div style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: C.teal, boxShadow: `0 0 8px ${C.teal}88`, animation: 'pulse 2s ease-in-out infinite' }} />
            </div>
            {currentLocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: 'Latitude', val: parseFloat(currentLocation.latitude as any).toFixed(6) },
                  { label: 'Longitude', val: parseFloat(currentLocation.longitude as any).toFixed(6) },
                  { label: 'Accuracy', val: `±${Math.round(parseFloat(currentLocation.accuracy as any))}m`, color: C.teal },
                  { label: 'Updated', val: fmt(currentLocation.timestamp) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{r.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: r.color ?? C.textSecondary }}>{r.val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: C.textMuted }}>No location data yet.</p>
            )}
          </div>

          <Divider />

          {/* weekly streak */}
          <div>
            <SectionTitle>Weekly streak</SectionTitle>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
                const today = new Date().getDay();
                const dayIndex = [1, 2, 3, 4, 5, 6, 0][i];
                const rec = myRecords.find(r => new Date(r.date).getDay() === dayIndex);
                const isToday = dayIndex === today;
                const color = isToday ? { bg: 'rgba(77,159,255,0.1)', border: C.blue, text: C.blue }
                  : rec?.is_late ? { bg: 'rgba(255,179,71,0.12)', border: 'rgba(255,179,71,0.25)', text: C.amber }
                  : rec?.is_present ? { bg: 'rgba(0,201,167,0.12)', border: 'rgba(0,201,167,0.25)', text: C.teal }
                  : { bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.15)', text: '#ff6b6b' };
                return (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: color.bg, border: `0.5px solid ${color.border}`, color: color.text }}>
                    {d}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ color: C.teal, label: 'Present' }, { color: C.amber, label: 'Late' }, { color: C.red, label: 'Absent' }].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.textMuted }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: m.color, opacity: 0.6 }} />{m.label}
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* month progress bars */}
          <div>
            <SectionTitle>Month overview</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Attendance rate', val: `${Math.round((presentDays / Math.max(myRecords.length, 1)) * 100)}%`, pct: (presentDays / Math.max(myRecords.length, 1)) * 100, color: `linear-gradient(90deg,#1e6fff,#00c9a7)` },
                { label: 'Avg. daily hours', val: `${(totalHours / Math.max(presentDays, 1)).toFixed(1)}h`, pct: Math.min((totalHours / Math.max(presentDays, 1)) / 10 * 100, 100), color: `linear-gradient(90deg,#4d9fff,#00c9a7)` },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.textSecondary }}>{row.val}</span>
                  </div>
                  <div style={{ height: 5, background: C.bg2, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* notifications */}
          <div>
            <SectionTitle>Notifications</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 7, padding: '8px 10px' }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#c8d8f0', marginBottom: 2 }}>Geo-fence check-in enabled</p>
                <p style={{ fontSize: 10, color: C.textMuted }}>Location is validated on each ping</p>
              </div>
              {lateDays > 0 && (
                <div style={{ background: C.bg2, border: `0.5px solid rgba(255,179,71,0.2)`, borderRadius: 7, padding: '8px 10px' }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: C.amber, marginBottom: 2 }}>{lateDays} late arrival{lateDays > 1 ? 's' : ''} this week</p>
                  <p style={{ fontSize: 10, color: C.textMuted }}>Check your threshold settings with admin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}