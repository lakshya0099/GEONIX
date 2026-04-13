import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAuth';
import { login } from '@/store/slices/auth';
import toast from 'react-hot-toast';

/* ─── design tokens ───────────────────────────────────────────────── */
const C = {
  bg0: '#060c18',
  bg1: '#0a1422',
  bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)',
  borderFaint: 'rgba(100,160,255,0.07)',
  teal: '#00c9a7',
  blue: '#4d9fff',
  amber: '#ffb347',
  purple: '#a78bfa',
  textPrimary: '#e8eef8',
  textSecondary: '#8aa8d0',
  textMuted: '#3d5a80',
  textDim: '#2d4060',
};

/* ─── star field canvas ───────────────────────────────────────────── */
function StarField({ width, height }: { width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = Math.random() * 1.2 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,210,255,${Math.random() * 0.35 + 0.05})`;
      ctx.fill();
    }
  }, [width, height]);
  return <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}

/* ─── shooting stars canvas ───────────────────────────────────────── */
function ShootingStars({ width, height }: { width: number; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface Meteor {
      x: number; y: number;
      vx: number; vy: number;
      len: number;
      life: number; maxLife: number;
      width: number;
    }

    const meteors: Meteor[] = [];
    let frame = 0;
    let raf: number;

    function spawnMeteor() {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.45;
      meteors.push({
        x: Math.random() * 1.4 - 0.1,
        y: -0.05,
        vx: Math.cos(angle) * 0.013,
        vy: Math.sin(angle) * 0.013,
        len: Math.random() * 0.13 + 0.06,
        life: 0,
        maxLife: Math.random() * 80 + 55,
        width: Math.random() * 1.4 + 0.5,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      if (frame % 58 === 0 && meteors.length < 6) spawnMeteor();

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const progress = m.life / m.maxLife;
        const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

        const x1 = m.x * width;
        const y1 = m.y * height;
        const ang = Math.atan2(m.vy, m.vx);
        const tailDX = -m.len * width * Math.cos(ang);
        const tailDY = -m.len * height * Math.sin(ang);

        const grad = ctx.createLinearGradient(x1 + tailDX, y1 + tailDY, x1, y1);
        grad.addColorStop(0, 'rgba(100,160,255,0)');
        grad.addColorStop(0.55, `rgba(160,210,255,${0.38 * alpha})`);
        grad.addColorStop(1, `rgba(240,248,255,${0.9 * alpha})`);

        ctx.beginPath();
        ctx.moveTo(x1 + tailDX, y1 + tailDY);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.width;
        ctx.lineCap = 'round';
        ctx.stroke();

        // bright head dot
        ctx.beginPath();
        ctx.arc(x1, y1, m.width * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,240,255,${0.85 * alpha})`;
        ctx.fill();

        m.x += m.vx;
        m.y += m.vy;
        m.life++;

        if (m.life >= m.maxLife || m.x > 1.2 || m.y > 1.2) {
          meteors.splice(i, 1);
        }
      }

      frame++;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
    />
  );
}

/* ─── globe canvas ────────────────────────────────────────────────── */
function GlobeCanvas({ size = 280 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const R = size / 2 - 8, cx = size / 2, cy = size / 2;
    let angle = 0, raf: number;

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
      return { x: cx + R * Math.cos(latR) * Math.sin(lonR), y: cy - R * Math.sin(latR), z: R * Math.cos(latR) * Math.cos(lonR) };
    }

    function draw(rot: number) {
      ctx.clearRect(0, 0, size, size);
      const g = ctx.createRadialGradient(cx - 36, cy - 36, 12, cx, cy, R);
      g.addColorStop(0, '#0e2040'); g.addColorStop(0.5, '#081628'); g.addColorStop(1, '#050e1a');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();

      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath(); let f = true;
        for (let lon = -180; lon <= 180; lon += 3) {
          const p = project(lat, lon, rot);
          if (p.z < 0) { f = true; continue; }
          f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false;
        }
        ctx.strokeStyle = 'rgba(30,80,160,0.16)'; ctx.lineWidth = 0.4; ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 20) {
        ctx.beginPath(); let f = true;
        for (let lat2 = -80; lat2 <= 80; lat2 += 2) {
          const p = project(lat2, lon, rot);
          if (p.z < 0) { f = true; continue; }
          f ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); f = false;
        }
        ctx.strokeStyle = 'rgba(30,80,160,0.16)'; ctx.lineWidth = 0.4; ctx.stroke();
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
        const alpha = Math.min(1, (avgZ - 5) / 40);
        ctx.beginPath(); ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(16,68,140,${0.55 * alpha})`;
        ctx.strokeStyle = `rgba(30,111,255,${0.22 * alpha})`;
        ctx.lineWidth = 0.6; ctx.fill(); ctx.stroke();
      }
      ctx.restore();

      const rim = ctx.createRadialGradient(cx, cy, R - 5, cx, cy, R + 3);
      rim.addColorStop(0, 'rgba(30,111,255,0.0)'); rim.addColorStop(0.7, 'rgba(30,111,255,0.10)'); rim.addColorStop(1, 'rgba(0,201,167,0.30)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.strokeStyle = rim; ctx.lineWidth = 4; ctx.stroke();

      const shine = ctx.createRadialGradient(cx - 42, cy - 42, 0, cx - 28, cy - 28, 90);
      shine.addColorStop(0, 'rgba(100,160,255,0.07)'); shine.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = shine; ctx.fill();
    }

    function loop() { angle += 0.2; draw(angle); raf = requestAnimationFrame(loop); }
    loop();
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={ref} width={size} height={size} style={{ borderRadius: '50%', display: 'block' }} />;
}

/* ─── shared logo icon (matches navbar exactly) ───────────────────── */
function GeonixIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="8" fill="#111c30" />
      <circle cx="16" cy="16" r="11" stroke="#1e6fff" strokeWidth="1" strokeOpacity="0.45" />
      <circle cx="16" cy="16" r="6" stroke="#00c9a7" strokeWidth="0.7" strokeOpacity="0.35" />
      <polygon points="19,4 13,17 16,17 13,28 20,14 16,14" fill="#FFD700" opacity="0.95" />
    </svg>
  );
}

/* ─── shared wordmark SVG (matches navbar exactly) ────────────────── */
function GeonixWordmark({ id, width = 118 }: { id: string; width?: number }) {
  return (
    <svg width={width} height="20" viewBox="0 0 118 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="118" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8eef8" />
          <stop offset="55%" stopColor="#c8d8f0" />
          <stop offset="100%" stopColor="#4d9fff" />
        </linearGradient>
      </defs>
      <text x="0" y="16" fontFamily="'Orbitron', monospace" fontWeight="900" fontSize="15" fill={`url(#${id})`} letterSpacing="2">GEO</text>
      <text x="58" y="16" fontFamily="'Orbitron', monospace" fontWeight="900" fontSize="15" fill="#FFD700" letterSpacing="2">NIX</text>
    </svg>
  );
}

/* ─── icon helpers ────────────────────────────────────────────────── */
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/* ─── main login page ─────────────────────────────────────────────── */
export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setDetailedError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setDetailedError(null);
    try {
      const result = await dispatch(login(formData));
      if (login.fulfilled.match(result)) {
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      } else {
        const errorMsg = (result.payload as string) || 'Login failed';
        setDetailedError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail
        || error.response?.data?.non_field_errors?.join(', ')
        || error.message
        || 'An unexpected error occurred';
      setDetailedError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoAdmin = () => {
    setFormData({ email: 'admin@test.com', password: 'testpass123' });
    setDetailedError(null);
    toast('Admin demo credentials loaded', { icon: '📋' });
  };

  const loadDemoEmployee = () => {
    setFormData({ email: 'emp@test.com', password: 'testpass123' });
    setDetailedError(null);
    toast('Employee demo credentials loaded', { icon: '📋' });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    background: C.bg2, border: `0.5px solid ${C.border}`,
    color: C.textPrimary, fontSize: 13, outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Inter',sans-serif", padding: 16 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Orbitron:wght@900&display=swap');
        *{box-sizing:border-box;}
        input::placeholder{color:#2d4060;}
        input:focus{border-color:rgba(77,159,255,0.4) !important;}
        @keyframes rp{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.015)}}
        @keyframes dp{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.5)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gx-blink{0%,100%{opacity:1}50%{opacity:0.3}}
      `}</style>

      <div style={{ width: '100%', maxWidth: 940, display: 'grid', gridTemplateColumns: '1fr 400px', minHeight: 680, borderRadius: 18, overflow: 'hidden', border: `0.5px solid ${C.borderFaint}` }}>

        {/* ── left — globe + branding ── */}
        <div style={{ background: C.bg0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'hidden' }}>
          {/* static star field — painted once */}
          <StarField width={540} height={680} />
          {/* animated shooting stars — runs on rAF loop */}
          <ShootingStars width={540} height={680} />

          {/* globe */}
          <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 32, zIndex: 2 }}>
            {[18, 36, 54].map((inset, i) => (
              <div key={inset} style={{ position: 'absolute', inset: -inset, borderRadius: '50%', border: `0.5px solid rgba(30,111,255,${0.12 - i * 0.03})`, animation: `rp 4s ease-in-out infinite ${i * 1.3}s` }} />
            ))}
            <GlobeCanvas size={280} />
            {[
              { top: 56, left: 196, color: C.teal, shadow: 'rgba(0,201,167,.7)', size: 9, delay: '0s' },
              { top: 118, left: 38, color: C.blue, shadow: 'rgba(77,159,255,.6)', size: 8, delay: '.6s' },
              { top: 186, left: 162, color: C.teal, shadow: 'rgba(0,201,167,.6)', size: 8, delay: '1.2s' },
              { top: 84, left: 118, color: C.amber, shadow: 'rgba(255,179,71,.5)', size: 7, delay: '1.8s' },
            ].map((d, i) => (
              <div key={i} style={{
                position: 'absolute', width: d.size, height: d.size, borderRadius: '50%',
                background: d.color, border: `2px solid ${C.bg0}`, top: d.top, left: d.left,
                boxShadow: `0 0 10px ${d.shadow}`, animation: `dp 2s ease-in-out infinite ${d.delay}`,
              }} />
            ))}
            {[{ top: 34, left: 170, size: 56, color: 'rgba(0,201,167,0.35)' }, { top: 100, left: 20, size: 40, color: 'rgba(77,159,255,0.3)' }].map((f, i) => (
              <div key={i} style={{ position: 'absolute', width: f.size, height: f.size, borderRadius: '50%', border: `1px dashed ${f.color}`, top: f.top, left: f.left, pointerEvents: 'none' }} />
            ))}
          </div>

          {/* ── brand — now matches navbar exactly ── */}
          <div style={{ textAlign: 'center', marginBottom: 20, zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <GeonixIcon size={36} />
              <div>
                <GeonixWordmark id="gnx-grad-left" width={118} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.teal, animation: 'gx-blink 1.5s ease-in-out infinite' }} />
                  <span style={{ fontSize: 10, color: C.textDim }}>Live system</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 11, color: C.textMuted, letterSpacing: '0.06em' }}>Workforce Management · Geo-fencing · Attendance</p>
          </div>

          {/* feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 380, zIndex: 2 }}>
            {[
              { label: 'Real-time geo-fencing', color: C.teal },
              { label: 'Auto check-in / out', color: C.blue },
              { label: 'Multi-tenant SaaS', color: C.amber },
              { label: 'JWT secured', color: C.purple },
              { label: 'Attendance reports', color: C.teal },
              { label: 'Role-based access', color: C.blue },
            ].map(f => (
              <div key={f.label} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, border: `0.5px solid rgba(100,160,255,0.14)`, color: '#4a6a90', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: f.color }} />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── right — login form ── */}
        <div style={{ background: C.bg1, borderLeft: `0.5px solid ${C.borderFaint}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 36px' }}>

          {/* ── logo mark + title — matches navbar exactly ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <GeonixIcon size={32} />
              <GeonixWordmark id="gnx-grad-right" width={100} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: C.textPrimary, marginBottom: 4 }}>Welcome back</h1>
            <p style={{ fontSize: 12, color: C.textMuted }}>Sign in to your workspace</p>
          </div>

          {/* error banner */}
          {detailedError && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,107,107,0.07)', border: `0.5px solid rgba(255,107,107,0.25)`, display: 'flex', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#ff6b6b', marginBottom: 2 }}>Login error</p>
                <p style={{ fontSize: 11, color: '#c05050' }}>{detailedError}</p>
                <details style={{ marginTop: 4 }}>
                  <summary style={{ fontSize: 10, color: C.textDim, cursor: 'pointer' }}>Debug info</summary>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', background: 'rgba(255,107,107,0.08)', padding: '4px 8px', borderRadius: 4, marginTop: 4, color: '#c05050' }}>
                    API: {(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}
                  </p>
                </details>
              </div>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#4a6a8a', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email address</label>
              <input
                type="email" name="email" id="email"
                value={formData.email} onChange={handleChange}
                required disabled={isLoading}
                placeholder="you@company.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#4a6a8a', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" id="password"
                  value={formData.password} onChange={handleChange}
                  required disabled={isLoading}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%', padding: '11px', borderRadius: 9, border: 'none',
                background: isLoading ? C.bg2 : 'linear-gradient(135deg,#1e6fff,#0e9e82)',
                color: isLoading ? C.textMuted : '#fff', fontSize: 13, fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              {isLoading && <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.textMuted}`, borderTopColor: C.blue, animation: 'spin 0.8s linear infinite' }} />}
              {isLoading ? 'Signing in…' : 'Sign in to workspace'}
            </button>
          </form>

          {/* divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
            <div style={{ flex: 1, height: 0.5, background: C.borderFaint }} />
            <span style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.07em' }}>DEMO ACCESS</span>
            <div style={{ flex: 1, height: 0.5, background: C.borderFaint }} />
          </div>

          {/* demo buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                label: 'Admin workspace', sub: 'Full dashboard · manage all employees',
                color: C.blue, bg: 'rgba(30,111,255,0.08)', border: 'rgba(77,159,255,0.20)',
                iconBg: 'rgba(30,111,255,0.18)', onClick: loadDemoAdmin,
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
              },
              {
                label: 'Employee view', sub: 'Check-in · attendance · location',
                color: C.teal, bg: 'rgba(0,201,167,0.07)', border: 'rgba(0,201,167,0.18)',
                iconBg: 'rgba(0,201,167,0.14)', onClick: loadDemoEmployee,
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
              },
            ].map(btn => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.onClick}
                style={{ padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: btn.bg, border: `0.5px solid ${btn.border}`, color: btn.color, fontFamily: 'inherit', textAlign: 'left' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 6, background: btn.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {btn.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div>{btn.label}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{btn.sub}</div>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            ))}
          </div>

          {/* creds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 10 }}>
            {['admin@test.com · testpass123', 'emp@test.com · testpass123'].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: C.textDim }}>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.textDim, flexShrink: 0 }} />
                {c}
              </div>
            ))}
          </div>

          {/* footer */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `0.5px solid ${C.borderFaint}` }}>
            <p style={{ fontSize: 10, color: C.textDim, textAlign: 'center', lineHeight: 1.6 }}>
              Secured with JWT · Multi-tenant isolation · Role-based access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}