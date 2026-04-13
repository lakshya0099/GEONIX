import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const C = {
  bg1: '#0b1220',
  bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)',
  borderFaint: 'rgba(100,160,255,0.06)',
  teal: '#00c9a7',
  blue: '#4d9fff',
  red: '#ff6b6b',
  textPrimary: '#e8eef8',
  textSecondary: '#8aa8d0',
  textMuted: '#3d5a80',
  textDim: '#2d4060',
};

type NavItem = { label: string; href: string; icon: React.ReactNode };

function NavIcon({ path }: { path: string }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    geofences: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    employees: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    reports: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  };
  return <>{icons[path] ?? null}</>;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === 'orgadmin' || user?.role === 'superadmin';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const adminLinks: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <NavIcon path="dashboard" /> },
    { label: 'Geofences', href: '/geofences', icon: <NavIcon path="geofences" /> },
    { label: 'Employees', href: '/employees', icon: <NavIcon path="employees" /> },
    { label: 'Reports', href: '/reports', icon: <NavIcon path="reports" /> },
  ];

  const employeeLinks: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <NavIcon path="dashboard" /> },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;
  const initial = user?.full_name?.charAt(0).toUpperCase() ?? '?';
  const W = collapsed ? 64 : 220;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Orbitron:wght@900&display=swap');
        .gx-nav * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes gx-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes gx-spin { to { transform: rotate(360deg); } }
        .gx-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: 8px;
          border: 0.5px solid transparent;
          text-decoration: none; cursor: pointer;
          transition: background 0.15s;
          overflow: hidden; white-space: nowrap;
        }
        .gx-nav-link:hover { background: rgba(100,160,255,0.05); }
        .gx-nav-link.active { background: rgba(30,111,255,0.12); border-color: rgba(77,159,255,0.20); }
        .gx-nav-link.active span { color: ${C.blue}; }
        .gx-icon-btn:hover { background: rgba(100,160,255,0.08) !important; }
        .gx-logout:hover { background: rgba(255,107,107,0.12) !important; }
        .gx-collapse-btn:hover { background: rgba(100,160,255,0.08) !important; }
        .gx-refresh-spin { animation: gx-spin 0.7s linear infinite; }
      `}</style>

      <aside
        className="gx-nav"
        style={{
          width: W,
          minWidth: W,
          background: C.bg1,
          borderRight: `0.5px solid ${C.borderFaint}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          fontFamily: "'DM Sans', 'Inter', sans-serif",
          flexShrink: 0,
          transition: 'width 0.22s ease, min-width 0.22s ease',
          overflow: 'hidden',
        }}
      >
        {/* ── Logo row ── */}
        <div style={{
          padding: '14px 10px',
          borderBottom: `0.5px solid ${C.borderFaint}`,
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 8,
        }}>
          {/* Logo mark + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>

            {/* NEW icon with lightning bolt */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <rect width="32" height="32" rx="8" fill="#111c30"/>
              <circle cx="16" cy="16" r="11" stroke="#1e6fff" strokeWidth="1" strokeOpacity="0.45"/>
              <circle cx="16" cy="16" r="6" stroke="#00c9a7" strokeWidth="0.7" strokeOpacity="0.35"/>
              <polygon points="19,4 13,17 16,17 13,28 20,14 16,14" fill="#FFD700" opacity="0.95"/>
            </svg>

            {/* NEW wordmark — Orbitron GEO + gold NIX */}
            {!collapsed && (
              <div>
                <svg width="118" height="20" viewBox="0 0 118 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gnx-grad" x1="0" y1="0" x2="118" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#e8eef8"/>
                      <stop offset="55%" stopColor="#c8d8f0"/>
                      <stop offset="100%" stopColor="#4d9fff"/>
                    </linearGradient>
                  </defs>
                  <text x="0" y="16" fontFamily="'Orbitron', monospace" fontWeight="900" fontSize="15" fill="url(#gnx-grad)" letterSpacing="2">GEO</text>
                  <text x="58" y="16" fontFamily="'Orbitron', monospace" fontWeight="900" fontSize="15" fill="#FFD700" letterSpacing="2">NIX</text>
                </svg>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.teal, animation: 'gx-blink 1.5s ease-in-out infinite' }} />
                  <p style={{ fontSize: 10, color: C.textDim }}>Live system</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Collapse toggle */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="gx-collapse-btn"
              title="Collapse sidebar"
              style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: 'transparent', border: `0.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Expand button (collapsed state) ── */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', borderBottom: `0.5px solid ${C.borderFaint}` }}>
            <button
              onClick={() => setCollapsed(false)}
              className="gx-collapse-btn"
              title="Expand sidebar"
              style={{
                width: 36, height: 26, borderRadius: 6,
                background: 'transparent', border: `0.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* ── User card ── */}
        <div style={{ padding: '10px', borderBottom: `0.5px solid ${C.borderFaint}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9,
            background: C.bg2, border: `0.5px solid ${C.border}`,
            borderRadius: 9, padding: collapsed ? '8px' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(30,111,255,0.15)', border: '1px solid rgba(77,159,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>{initial}</span>
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name ?? 'User'}
                </p>
                <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'capitalize' }}>{user?.role}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {!collapsed && (
            <p style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 8px 6px' }}>
              Navigation
            </p>
          )}
          {links.map((link) => {
            const active = location.pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`gx-nav-link${active ? ' active' : ''}`}
                title={collapsed ? link.label : undefined}
                style={{
                  color: active ? C.blue : C.textSecondary,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '8px' : '8px 10px',
                }}
              >
                <span style={{ color: active ? C.blue : C.textMuted, display: 'flex', flexShrink: 0 }}>
                  {link.icon}
                </span>
                {!collapsed && (
                  <span style={{ fontSize: 12, fontWeight: active ? 500 : 400 }}>
                    {link.label}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* ── Refresh + Logout ── */}
        <div style={{ padding: 8, borderTop: `0.5px solid ${C.borderFaint}`, display: 'flex', flexDirection: 'column', gap: 6 }}>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh"
            className="gx-icon-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 9,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px' : '8px 10px',
              borderRadius: 8,
              background: 'rgba(77,159,255,0.07)',
              border: `0.5px solid rgba(77,159,255,0.15)`,
              cursor: refreshing ? 'not-allowed' : 'pointer',
            }}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={C.blue} strokeWidth="1.8" strokeLinecap="round"
              className={refreshing ? 'gx-refresh-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {!collapsed && (
              <span style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="gx-logout"
            title="Logout"
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 9,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '8px' : '8px 10px',
              borderRadius: 8,
              background: 'rgba(255,107,107,0.07)',
              border: `0.5px solid rgba(255,107,107,0.15)`,
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.8" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && (
              <span style={{ fontSize: 12, fontWeight: 500, color: C.red }}>Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}