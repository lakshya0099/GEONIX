import { AttendanceRecord } from '@/types/attendance';

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

/* ─── helpers ─────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px 0' }}>
      {children}
    </p>
  );
}

function DisplayVal({ value, color }: { value: string; color?: string }) {
  return (
    <p style={{ fontSize: 14, fontWeight: 500, color: color ?? C.textPrimary, margin: 0, fontFamily: "'DM Sans','Inter',sans-serif" }}>
      {value}
    </p>
  );
}

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return '–'; }
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '–'; }
};

/* ─── status config ───────────────────────────────────────────────── */
const STATUS: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  checked_in: {
    color: C.teal, label: 'Checked in',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2.2" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  checked_out: {
    color: C.blue, label: 'Checked out',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  pending: {
    color: C.amber, label: 'Pending',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
};

const DEFAULT_STATUS = {
  color: C.textMuted, label: 'Unknown',
  icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

/* ─── main widget ─────────────────────────────────────────────────── */
interface AttendanceTodayWidgetProps {
  todayStatus: AttendanceRecord | null;
  isLoading?: boolean;
}

export function AttendanceTodayWidget({ todayStatus, isLoading = false }: AttendanceTodayWidgetProps) {
  const card: React.CSSProperties = {
    background: C.bg2, border: `0.5px solid ${C.border}`,
    borderRadius: 12, padding: '20px 22px',
    fontFamily: "'DM Sans','Inter',sans-serif",
  };

  /* loading */
  if (isLoading) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${C.bg1}`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
          <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Loading attendance…</p>
        </div>
      </div>
    );
  }

  /* empty */
  if (!todayStatus) {
    return (
      <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,179,71,0.10)', border: `0.5px solid rgba(255,179,71,0.22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>No attendance record for today</p>
      </div>
    );
  }

  const status = STATUS[todayStatus.status] ?? DEFAULT_STATUS;

  /* progress bar: fraction of work day elapsed since check-in */
  const progressPct = (() => {
    if (!todayStatus.clock_in_time) return 0;
    if (todayStatus.total_hours) {
      const [h = 0, m = 0] = todayStatus.total_hours.split(':').map(Number);
      return Math.min(100, Math.round(((h + m / 60) / 9) * 100));
    }
    const elapsed = (Date.now() - new Date(todayStatus.clock_in_time).getTime()) / 3_600_000;
    return Math.min(100, Math.round((elapsed / 9) * 100));
  })();

  return (
    <div style={card}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, boxShadow: `0 0 6px ${status.color}88` }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Today's attendance</p>
        </div>
        {/* status pill */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
          background: `${status.color}18`,
          color: status.color,
          border: `0.5px solid ${status.color}44`,
        }}>
          {status.icon}
          {status.label}
        </span>
      </div>

      <div style={{ height: 0.5, background: C.borderFaint, marginBottom: 14 }} />

      {/* ── data grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 16px', marginBottom: 14 }}>
        <div>
          <SectionLabel>Date</SectionLabel>
          <DisplayVal value={formatDate(todayStatus.date)} />
        </div>
        <div>
          <SectionLabel>Check in</SectionLabel>
          <DisplayVal value={formatTime(todayStatus.clock_in_time)} color={C.teal} />
        </div>
        <div>
          <SectionLabel>Check out</SectionLabel>
          <DisplayVal value={formatTime(todayStatus.clock_out_time)} color={todayStatus.clock_out_time ? C.blue : C.textMuted} />
        </div>
        <div>
          <SectionLabel>Total hours</SectionLabel>
          <DisplayVal value={todayStatus.total_hours || '–'} />
        </div>
        <div>
          <SectionLabel>Late arrival</SectionLabel>
          <DisplayVal value={todayStatus.is_late ? 'Yes' : 'No'} color={todayStatus.is_late ? C.red : C.teal} />
        </div>
        <div>
          <SectionLabel>Day progress</SectionLabel>
          <DisplayVal value={`${progressPct}%`} color={C.textSecondary} />
        </div>
      </div>

      {/* ── progress bar ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ height: 4, background: C.bg1, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progressPct}%`, borderRadius: 2,
            background: progressPct >= 100
              ? C.teal
              : `linear-gradient(90deg, #1e6fff, #00c9a7)`,
            transition: 'width .4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9, color: C.textDim }}>Start</span>
          <span style={{ fontSize: 9, color: C.textDim }}>9h work day</span>
        </div>
      </div>

      {/* ── presence indicator ── */}
      <div style={{
        padding: '10px 12px', background: C.bg1,
        border: `0.5px solid ${todayStatus.is_present ? 'rgba(0,201,167,0.15)' : C.borderFaint}`,
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: todayStatus.is_present ? C.teal : C.textMuted,
            boxShadow: todayStatus.is_present ? `0 0 6px rgba(0,201,167,0.5)` : 'none',
          }} />
          <span style={{ fontSize: 11, color: todayStatus.is_present ? C.textSecondary : C.textMuted }}>
            Currently present
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 500, padding: '2px 10px', borderRadius: 20,
          background: todayStatus.is_present ? 'rgba(0,201,167,0.10)' : 'rgba(45,64,96,0.2)',
          color: todayStatus.is_present ? C.teal : C.textMuted,
          border: `0.5px solid ${todayStatus.is_present ? 'rgba(0,201,167,0.22)' : 'transparent'}`,
        }}>
          {todayStatus.is_present ? 'In office' : 'Not present'}
        </span>
      </div>
    </div>
  );
}