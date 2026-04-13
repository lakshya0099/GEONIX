import { Geofence } from '@/types/geofencing';

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

/* ─── inline icons ────────────────────────────────────────────────── */
const IconPin = ({ color = C.teal }: { color?: string }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconRadius = ({ color = C.textMuted }: { color?: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="12" x2="16" y2="12" />
  </svg>
);

/* ─── props ───────────────────────────────────────────────────────── */
interface GeofenceListProps {
  geofences: Geofence[];
  isLoading?: boolean;
  onEdit?: (geofence: Geofence) => void;
  onDelete?: (geofenceId: string) => void;
  onAddNew?: () => void;
}

/* ─── component ───────────────────────────────────────────────────── */
export function GeofenceList({ geofences, isLoading = false, onEdit, onDelete, onAddNew }: GeofenceListProps) {
  const card: React.CSSProperties = {
    background: C.bg2, border: `0.5px solid ${C.border}`,
    borderRadius: 12, overflow: 'hidden',
    fontFamily: "'DM Sans','Inter',sans-serif",
  };

  /* loading */
  if (isLoading) {
    return (
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 26, height: 26, border: `2px solid ${C.bg1}`, borderTopColor: C.teal, borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 10px' }} />
          <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Loading geo-fences…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── header ── */}
      <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, boxShadow: `0 0 6px rgba(0,201,167,0.5)` }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>
            Geo-fence zones
            <span style={{ marginLeft: 6, fontSize: 11, color: C.textMuted, fontWeight: 400 }}>
              ({geofences.length})
            </span>
          </p>
        </div>
        {onAddNew && (
          <button
            onClick={onAddNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7,
              background: 'rgba(0,201,167,0.10)',
              border: `0.5px solid rgba(0,201,167,0.25)`,
              color: C.teal, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <IconPlus />
            New zone
          </button>
        )}
      </div>

      {/* ── list ── */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {geofences.length === 0 ? (
          <div style={{ padding: '44px 20px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(61,90,128,0.15)', border: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <IconPin color={C.textMuted} />
            </div>
            <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>No geo-fences created yet</p>
            {onAddNew && (
              <button
                onClick={onAddNew}
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, background: 'rgba(0,201,167,0.08)', border: `0.5px solid rgba(0,201,167,0.2)`, color: C.teal, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <IconPlus />
                Add first zone
              </button>
            )}
          </div>
        ) : (
          geofences.map((g, i) => (
            <GeofenceRow
              key={g.id}
              geofence={g}
              isLast={i === geofences.length - 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── single row ──────────────────────────────────────────────────── */
function GeofenceRow({
  geofence: g,
  isLast,
  onEdit,
  onDelete,
}: {
  geofence: Geofence;
  isLast: boolean;
  onEdit?: (g: Geofence) => void;
  onDelete?: (id: string) => void;
}) {
  const lat = parseFloat(String(g.latitude)).toFixed(4);
  const lon = parseFloat(String(g.longitude)).toFixed(4);

  return (
    <div
      style={{
        padding: '13px 20px',
        borderBottom: isLast ? 'none' : `0.5px solid ${C.borderFaint}`,
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'background .15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = C.bg1; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {/* pin icon container */}
      <div style={{ width: 32, height: 32, borderRadius: 8, background: g.is_active ? 'rgba(0,201,167,0.10)' : 'rgba(61,90,128,0.12)', border: `0.5px solid ${g.is_active ? 'rgba(0,201,167,0.2)' : C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconPin color={g.is_active ? C.teal : C.textMuted} />
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {g.name}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 500,
            background: g.is_active ? 'rgba(0,201,167,0.10)' : 'rgba(61,90,128,0.15)',
            color: g.is_active ? C.teal : C.textMuted,
            border: `0.5px solid ${g.is_active ? 'rgba(0,201,167,0.22)' : 'transparent'}`,
            flexShrink: 0,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', boxShadow: g.is_active ? `0 0 4px rgba(0,201,167,0.6)` : 'none' }} />
            {g.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconPin color={C.textDim} />
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "'DM Mono',monospace" }}>{lat}, {lon}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconRadius color={C.textDim} />
            <span style={{ fontSize: 11, color: C.textMuted }}>{g.radius_meters}m</span>
          </div>
        </div>
      </div>

      {/* action buttons */}
      {(onEdit || onDelete) && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {onEdit && (
            <button
              onClick={() => onEdit(g)}
              title="Edit"
              style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(77,159,255,0.08)', border: `0.5px solid rgba(77,159,255,0.20)`, color: C.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(77,159,255,0.18)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(77,159,255,0.08)'; }}
            >
              <IconEdit />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => { if (confirm(`Delete geo-fence "${g.name}"?`)) onDelete(g.id); }}
              title="Delete"
              style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,107,107,0.07)', border: `0.5px solid rgba(255,107,107,0.18)`, color: C.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.16)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.07)'; }}
            >
              <IconTrash />
            </button>
          )}
        </div>
      )}
    </div>
  );
}