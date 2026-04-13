// src/pages/GeofencesPage.tsx
import { useEffect, useState } from 'react';
import { geofencingService } from '@/services/geofencing';
import { Geofence } from '@/types/geofencing';
import { GeofenceCRUDModal } from '@/components/Dashboard/GeofenceCRUDModal';
import toast from 'react-hot-toast';

/* ─── design tokens (matches rest of app) ─────────────────────────── */
const C = {
  bg0: '#080e1a', bg1: '#0b1220', bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)', borderFaint: 'rgba(100,160,255,0.06)',
  teal: '#00c9a7', blue: '#4d9fff', amber: '#ffb347', red: '#ff6b6b',
  purple: '#a78bfa',
  textPrimary: '#e8eef8', textSecondary: '#8aa8d0',
  textMuted: '#3d5a80', textDim: '#2d4060',
};

/* ─── helpers ─────────────────────────────────────────────────────── */
function Badge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 20,
      background: active ? 'rgba(0,201,167,0.12)' : 'rgba(61,90,128,0.18)',
      color: active ? C.teal : C.textMuted,
      border: `0.5px solid ${active ? 'rgba(0,201,167,0.25)' : 'transparent'}`,
    }}>
      {active ? '● Active' : '○ Inactive'}
    </span>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 48, gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(30,111,255,0.08)', border: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.6" strokeLinecap="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, marginBottom: 4 }}>No geofences yet</p>
        <p style={{ fontSize: 12, color: C.textMuted }}>Create your first geofence to start tracking attendance</p>
      </div>
      <button onClick={onAdd} style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#1e6fff,#0e9e82)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
        Add first geofence
      </button>
    </div>
  );
}

/* ─── geofence card ───────────────────────────────────────────────── */
function GeofenceCard({
  fence, onEdit, onDelete, onToggle,
}: {
  fence: Geofence;
  onEdit: (g: Geofence) => void;
  onDelete: (id: number) => void;
  onToggle: (g: Geofence) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{
      background: C.bg2, border: `0.5px solid ${C.border}`,
      borderRadius: 12, padding: '14px 16px',
      borderLeft: `3px solid ${fence.is_active ? C.teal : C.textDim}`,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Badge active={fence.is_active} />
            <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fence.name}
            </p>
          </div>
          {fence.description && (
            <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 0 }}>{fence.description}</p>
          )}
        </div>
        {/* action buttons */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => onEdit(fence)} title="Edit" style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(77,159,255,0.08)', border: `0.5px solid rgba(77,159,255,0.18)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => onDelete(fence.id)} style={{ padding: '0 8px', height: 28, borderRadius: 7, background: 'rgba(255,107,107,0.15)', border: `0.5px solid rgba(255,107,107,0.3)`, cursor: 'pointer', fontSize: 10, color: C.red, fontWeight: 500 }}>Delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '0 8px', height: 28, borderRadius: 7, background: C.bg1, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontSize: 10, color: C.textMuted }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,107,107,0.08)', border: `0.5px solid rgba(255,107,107,0.15)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          { label: 'Latitude',  value: fence.latitude  != null ? Number(fence.latitude).toFixed(5)  : '–' },
          { label: 'Longitude', value: fence.longitude != null ? Number(fence.longitude).toFixed(5) : '–' },
          { label: 'Radius', value: fence.radius ? `${fence.radius} m` : '–' },
          { label: 'Created', value: fence.created_at ? new Date(fence.created_at).toLocaleDateString() : '–' },
        ].map(m => (
          <div key={m.label} style={{ background: C.bg1, borderRadius: 6, padding: '6px 10px' }}>
            <p style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{m.label}</p>
            <p style={{ fontSize: 12, color: C.textSecondary, fontFamily: 'monospace' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* toggle strip */}
      <button onClick={() => onToggle(fence)} style={{ width: '100%', padding: '7px 0', borderRadius: 7, background: fence.is_active ? 'rgba(255,107,107,0.06)' : 'rgba(0,201,167,0.06)', border: `0.5px solid ${fence.is_active ? 'rgba(255,107,107,0.18)' : 'rgba(0,201,167,0.18)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: fence.is_active ? C.red : C.teal }}>
        {fence.is_active ? 'Deactivate zone' : 'Activate zone'}
      </button>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────── */
export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Geofence | null>(null);

  useEffect(() => { loadGeofences(); }, []);

  async function loadGeofences() {
    try {
      setIsLoading(true);
      const data = await geofencingService.getGeofences();
      setGeofences(data || []);
    } catch {
      toast.error('Failed to load geofences');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(fence: Geofence) {
    try {
      await geofencingService.updateGeofence(String(fence.id), { is_active: !fence.is_active });
      toast.success(`Geofence ${fence.is_active ? 'deactivated' : 'activated'}`);
      loadGeofences();
    } catch {
      toast.error('Failed to update geofence');
    }
  }

  async function handleDelete(id: number) {
    try {
      await geofencingService.deleteGeofence(String(id));
      toast.success('Geofence deleted');
      loadGeofences();
    } catch {
      toast.error('Failed to delete geofence');
    }
  }

  const filtered = geofences.filter(g => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' ? g.is_active : !g.is_active);
    return matchSearch && matchFilter;
  });

  const activeCount = geofences.filter(g => g.is_active).length;

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, background: C.bg0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${C.bg2}`, borderTopColor: C.teal, animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ background: C.bg0, flex: 1, color: C.textPrimary, fontFamily: "'DM Sans','Inter',sans-serif", display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
        input::placeholder{color:${C.textDim};}
        input:focus{outline:none;border-color:rgba(77,159,255,0.35) !important;}
      `}</style>

      {/* page header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>Geofences</h1>
          </div>
          <p style={{ fontSize: 11, color: C.textMuted }}>
            {activeCount} active · {geofences.length} total configured zones
          </p>
        </div>
        <button onClick={() => { setSelected(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#1e6fff,#0e9e82)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New geofence
        </button>
      </div>

      {/* stat strip */}
      <div style={{ padding: '12px 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', gap: 16 }}>
        {[
          { label: 'Total', value: geofences.length, color: C.blue },
          { label: 'Active', value: activeCount, color: C.teal },
          { label: 'Inactive', value: geofences.length - activeCount, color: C.textMuted },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textDim }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* search + filter bar */}
      <div style={{ padding: '12px 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search geofences…" style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 32, borderRadius: 7, background: C.bg2, border: `0.5px solid ${C.border}`, color: C.textPrimary, fontSize: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: filter === f ? 500 : 400, cursor: 'pointer', background: filter === f ? 'rgba(77,159,255,0.12)' : 'transparent', border: `0.5px solid ${filter === f ? 'rgba(77,159,255,0.25)' : C.border}`, color: filter === f ? C.blue : C.textMuted, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      <div style={{ padding: 24, flex: 1 }}>
        {filtered.length === 0 ? (
          <EmptyState onAdd={() => { setSelected(null); setShowModal(true); }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {filtered.map(fence => (
              <GeofenceCard key={fence.id} fence={fence}
                onEdit={g => { setSelected(g); setShowModal(true); }}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      <GeofenceCRUDModal
        isOpen={showModal}
        geofence={selected}
        onClose={() => { setShowModal(false); setSelected(null); }}
        onSuccess={() => { loadGeofences(); setShowModal(false); setSelected(null); }}
      />
    </div>
  );
}