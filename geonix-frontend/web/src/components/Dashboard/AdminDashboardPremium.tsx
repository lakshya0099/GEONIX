import { useEffect, useRef, useState } from 'react';
import { attendanceService } from '@/services/attendance';
import { geofencingService } from '@/services/geofencing';
import { AttendanceRecord, AttendanceSettings } from '@/types/attendance';
import { Geofence } from '@/types/geofencing';
import toast from 'react-hot-toast';
import { AttendanceTodayWidget } from './AttendanceTodayWidget';
import { GeofenceList } from './GeofenceList';
import { AttendanceSettingsEditor } from './AttendanceSettingsEditor';
import { GeofenceCRUDModal } from './GeofenceCRUDModal';
import { useAuth } from '@/hooks/useAuth';

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

/* ─── spinning globe ──────────────────────────────────────────────── */
function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 220, H = 220, R = 100, cx = W / 2, cy = H / 2;
    let angle = 0;
    let raf: number;

    const landPaths = [
      { lat: 51, lon: -1, w: 18, h: 6 }, { lat: 54, lon: -4, w: 8, h: 10 },
      { lat: 48, lon: 2, w: 12, h: 8 }, { lat: 52, lon: 13, w: 8, h: 6 },
      { lat: 44, lon: 12, w: 6, h: 14 }, { lat: 56, lon: 24, w: 14, h: 10 },
      { lat: 40, lon: -4, w: 10, h: 8 }, { lat: 60, lon: 18, w: 6, h: 18 },
      { lat: 65, lon: 26, w: 10, h: 12 }, { lat: 28, lon: 78, w: 24, h: 22 },
      { lat: 35, lon: 105, w: 30, h: 28 }, { lat: 36, lon: 138, w: 12, h: 16 },
      { lat: 22, lon: 113, w: 8, h: 10 }, { lat: 15, lon: 100, w: 8, h: 18 },
      { lat: 2, lon: 107, w: 12, h: 24 }, { lat: -5, lon: 120, w: 18, h: 12 },
      { lat: 38, lon: 35, w: 18, h: 16 }, { lat: 25, lon: 45, w: 20, h: 18 },
      { lat: 10, lon: 20, w: 50, h: 40 }, { lat: -5, lon: 25, w: 40, h: 36 },
      { lat: -25, lon: 25, w: 30, h: 30 }, { lat: 30, lon: 15, w: 8, h: 20 },
      { lat: 45, lon: 58, w: 20, h: 14 }, { lat: 55, lon: 70, w: 30, h: 20 },
      { lat: 62, lon: 100, w: 60, h: 16 }, { lat: 40, lon: -98, w: 50, h: 28 },
      { lat: 50, lon: -95, w: 40, h: 14 }, { lat: 30, lon: -88, w: 36, h: 18 },
      { lat: 20, lon: -100, w: 20, h: 18 }, { lat: -10, lon: -55, w: 40, h: 40 },
      { lat: -30, lon: -60, w: 28, h: 30 }, { lat: -40, lon: -65, w: 16, h: 14 },
      { lat: -30, lon: 135, w: 40, h: 30 }, { lat: -42, lon: 172, w: 8, h: 12 },
    ];

    function project(lat: number, lon: number, rot: number) {
      const latR = (lat * Math.PI) / 180;
      const lonR = ((lon + rot) * Math.PI) / 180;
      return {
        x: cx + R * Math.cos(latR) * Math.sin(lonR),
        y: cy - R * Math.sin(latR),
        z: R * Math.cos(latR) * Math.cos(lonR),
      };
    }

    function draw(rot: number) {
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(cx - 28, cy - 28, 10, cx, cy, R);
      grad.addColorStop(0, '#0e2040');
      grad.addColorStop(0.5, '#081628');
      grad.addColorStop(1, '#050e1a');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        let first = true;
        for (let lon = -180; lon <= 180; lon += 3) {
          const p = project(lat, lon, rot);
          if (p.z < 0) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.strokeStyle = 'rgba(30,80,160,0.18)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 20) {
        ctx.beginPath();
        let first = true;
        for (let lat2 = -80; lat2 <= 80; lat2 += 2) {
          const p = project(lat2, lon, rot);
          if (p.z < 0) { first = true; continue; }
          first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
          first = false;
        }
        ctx.strokeStyle = 'rgba(30,80,160,0.18)';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }

      for (const land of landPaths) {
        const corners = [
          project(land.lat + land.h / 2, land.lon - land.w / 2, rot),
          project(land.lat + land.h / 2, land.lon + land.w / 2, rot),
          project(land.lat - land.h / 2, land.lon + land.w / 2, rot),
          project(land.lat - land.h / 2, land.lon - land.w / 2, rot),
        ];
        const avgZ = corners.reduce((s, c) => s + c.z, 0) / 4;
        if (avgZ < 5) continue;
        const alpha = Math.min(1, (avgZ - 5) / 30);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(16,68,140,${0.55 * alpha})`;
        ctx.strokeStyle = `rgba(30,111,255,${0.25 * alpha})`;
        ctx.lineWidth = 0.6;
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      const rimGrad = ctx.createRadialGradient(cx, cy, R - 4, cx, cy, R + 2);
      rimGrad.addColorStop(0, 'rgba(30,111,255,0.0)');
      rimGrad.addColorStop(0.7, 'rgba(30,111,255,0.12)');
      rimGrad.addColorStop(1, 'rgba(0,201,167,0.25)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = rimGrad;
      ctx.lineWidth = 3;
      ctx.stroke();

      const shineGrad = ctx.createRadialGradient(cx - 32, cy - 32, 0, cx - 20, cy - 20, 70);
      shineGrad.addColorStop(0, 'rgba(100,160,255,0.08)');
      shineGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = shineGrad;
      ctx.fill();
    }

    function loop() {
      angle += 0.25;
      draw(angle);
      raf = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={220} height={220} style={{ borderRadius: '50%', display: 'block' }} />;
}

/* ─── org attendance summary (admin only) ─────────────────────────── */
function OrgAttendanceSummary({ geofences }: { geofences: Geofence[] }) {
  const activeCount = geofences.filter(g => g.is_active).length;
  return (
    <div style={{
      background: C.bg2, border: `0.5px solid ${C.border}`,
      borderRadius: 12, padding: '20px 22px',
      fontFamily: "'DM Sans','Inter',sans-serif",
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, boxShadow: `0 0 6px ${C.teal}88` }} />
        <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Organisation overview</p>
      </div>
      <div style={{ height: 0.5, background: C.borderFaint, marginBottom: 14 }} />

      {/* stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {[
          { label: 'Active geofences', value: String(activeCount), color: C.teal },
          { label: 'Total geofences', value: String(geofences.length), color: C.blue },
        ].map(s => (
          <div key={s.label} style={{
            padding: '12px 14px', background: C.bg1,
            border: `0.5px solid ${C.borderFaint}`, borderRadius: 8,
          }}>
            <p style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 500, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* info note */}
      <div style={{
        padding: '10px 12px', background: C.bg1,
        border: `0.5px solid rgba(77,159,255,0.12)`, borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
          Per-employee records are available in the{' '}
          <span style={{ color: C.blue }}>Reports</span> tab
        </p>
      </div>
    </div>
  );
}

/* ─── stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent: string;
}) {
  return (
    <div style={{
      background: C.bg2, border: `0.5px solid ${C.border}`,
      borderRadius: 10, padding: '12px 14px',
      borderLeft: `3px solid ${accent}`,
    }}>
      <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 500, color: C.textPrimary, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: C.teal, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
      {children}
    </p>
  );
}

/* ─── main dashboard ──────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'orgadmin' || user?.role === 'superadmin';

  const [todayStatus, setTodayStatus] = useState<AttendanceRecord | null>(null);
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [today, settingsData, geofencesData] = await Promise.all([
        // only fetch today's status for non-admin users
        isAdmin
          ? Promise.resolve(null)
          : attendanceService.getTodayStatus().catch(err => {
              if (err.response?.status === 404) return null;
              throw err;
            }),
        attendanceService.getSettings().catch(() => null),
        geofencingService.getGeofences().catch(() => []),
      ]);

      setTodayStatus(today);
      setSettings(settingsData);
      setGeofences(geofencesData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeofenceEdit = (geofence: Geofence) => {
    setSelectedGeofence(geofence);
    setShowGeofenceModal(true);
  };

  const handleGeofenceDelete = async (geofenceId: number) => {
    try {
      await geofencingService.deleteGeofence(String(geofenceId));
      toast.success('Geofence deleted successfully!');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to delete geofence');
    }
  };

  const handleGeofenceAddNew = () => {
    setSelectedGeofence(null);
    setShowGeofenceModal(true);
  };

  const handleGeofenceSave = () => {
    loadDashboardData();
    setShowGeofenceModal(false);
    setSelectedGeofence(null);
  };

  const handleSettingsUpdate = (updated: AttendanceSettings) => {
    setSettings(updated);
  };

  const fmt = (iso: string | undefined | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '–';

  /* ── loading screen ── */
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg0 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: `2px solid ${C.bg2}`, borderTopColor: C.teal,
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: C.textMuted, fontSize: 13 }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg0, flex: 1, color: C.textPrimary, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes ringpulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.02)} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 'calc(100vh - 56px)' }}>

        {/* ── left panel ── */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, borderRight: `0.5px solid ${C.borderFaint}` }}>

          {/* stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <StatCard
              label="Today's status"
              value={isAdmin ? 'Admin' : (todayStatus?.status ?? 'Pending')}
              sub={isAdmin ? 'Org-wide view' : (todayStatus?.clock_in_time ? `In: ${fmt(todayStatus.clock_in_time)}` : 'Not checked in')}
              accent={C.teal}
            />
            <StatCard
              label="Active geofences"
              value={String(geofences.filter(g => g.is_active).length)}
              sub={geofences.length > 0 ? `${geofences.length} total configured` : 'None configured'}
              accent={C.blue}
            />
            <StatCard
              label="Work hours"
              value={settings ? `${settings.working_hours_start}–${settings.working_hours_end}` : '– –'}
              sub={settings ? `Late after ${settings.late_threshold_minutes} min` : undefined}
              accent={C.amber}
            />
            <StatCard
              label="Auto checkout"
              value={settings?.auto_checkout_enabled ? 'Enabled' : 'Disabled'}
              sub={settings?.auto_checkout_enabled ? `After ${settings.auto_checkout_minutes} min` : undefined}
              accent={C.red}
            />
          </div>

          {/* globe */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
            <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
              Real-time location mesh
            </p>
            <div style={{ position: 'relative', width: 220, height: 220 }}>
              <div style={{
                position: 'absolute', inset: -12, borderRadius: '50%',
                border: '0.5px solid rgba(30,111,255,0.15)',
                animation: 'ringpulse 3s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: -26, borderRadius: '50%',
                border: '0.5px solid rgba(0,201,167,0.08)',
                animation: 'ringpulse 3s ease-in-out infinite 1s',
              }} />
              <GlobeCanvas />
              {[
                { top: 42, left: 155, color: C.teal },
                { top: 95, left: 30, color: C.blue },
                { top: 150, left: 128, color: C.teal },
                { top: 68, left: 90, color: C.amber },
              ].map((dot, i) => (
                <div key={i} style={{
                  position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                  background: dot.color, border: `1.5px solid ${C.bg0}`,
                  top: dot.top, left: dot.left,
                  animation: `pulse 2s ease-in-out infinite ${i * 0.4}s`,
                  boxShadow: `0 0 8px ${dot.color}88`,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[
                { color: C.teal, label: 'Active zones' },
                { color: C.blue, label: 'Office HQ' },
                { color: C.amber, label: 'Remote site' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── attendance widget — role-aware ── */}
          {isAdmin
            ? <OrgAttendanceSummary geofences={geofences} />
            : <AttendanceTodayWidget todayStatus={todayStatus} isLoading={isLoading} />
          }
        </div>

        {/* ── right panel ── */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

          <GeofenceList
            geofences={geofences}
            isLoading={false}
            onEdit={handleGeofenceEdit}
            onDelete={handleGeofenceDelete}
            onAddNew={handleGeofenceAddNew}
          />

          {settings && (
            <AttendanceSettingsEditor settings={settings} onSave={handleSettingsUpdate} />
          )}

          {/* workspace presence */}
          <div>
            <SectionTitle>Workspace presence</SectionTitle>
            <div style={{
              background: C.bg2, border: `0.5px solid ${C.border}`,
              borderRadius: 10, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 12, color: C.textSecondary }}>Current session</p>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: todayStatus?.is_present ? 'rgba(0,201,167,0.12)' : 'rgba(61,90,128,0.18)',
                  color: todayStatus?.is_present ? C.teal : C.textMuted,
                  border: `0.5px solid ${todayStatus?.is_present ? 'rgba(0,201,167,0.25)' : 'transparent'}`,
                }}>
                  {todayStatus?.is_present ? '● Present' : '○ Not present'}
                </span>
              </div>
              <div style={{ height: 0.5, background: C.borderFaint }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: C.textMuted }}>Check-in</p>
                <p style={{ fontSize: 11, color: C.textSecondary }}>{fmt(todayStatus?.clock_in_time)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: C.textMuted }}>Check-out</p>
                <p style={{ fontSize: 11, color: C.textSecondary }}>{fmt(todayStatus?.clock_out_time)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 11, color: C.textMuted }}>Total hours</p>
                <p style={{ fontSize: 11, color: C.teal, fontWeight: 500 }}>
                  {todayStatus?.total_hours ?? '–'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* geofence modal — outside grid so it overlays correctly */}
      <GeofenceCRUDModal
        isOpen={showGeofenceModal}
        geofence={selectedGeofence}
        onClose={() => {
          setShowGeofenceModal(false);
          setSelectedGeofence(null);
        }}
        onSuccess={handleGeofenceSave}
      />
    </div>
  );
}