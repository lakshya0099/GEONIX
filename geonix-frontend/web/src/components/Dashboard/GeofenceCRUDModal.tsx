import { useState, useEffect } from 'react';
import { Geofence } from '@/types/geofencing';
import { geofencingService } from '@/services/geofencing';
import toast from 'react-hot-toast';

const C = {
  bg0: '#060c18',
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

interface GeofenceCRUDModalProps {
  isOpen: boolean;
  geofence?: Geofence | null;
  onClose: () => void;
  onSuccess?: (geofence: Geofence) => void;
}

const inputStyle = (hasError = false): React.CSSProperties => ({
  width: '100%', padding: '10px 12px', borderRadius: 8,
  background: C.bg1, border: `0.5px solid ${hasError ? 'rgba(255,107,107,0.55)' : C.border}`,
  color: C.textPrimary, fontSize: 13, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color 0.15s',
});

const monoStyle = (hasError = false): React.CSSProperties => ({
  ...inputStyle(hasError), fontFamily: "'DM Mono', monospace",
});

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: C.textDim, letterSpacing: '0.07em',
  display: 'block', marginBottom: 6, textTransform: 'uppercase',
};

export function GeofenceCRUDModal({ isOpen, geofence, onClose, onSuccess }: GeofenceCRUDModalProps) {
  const [formData, setFormData] = useState<Partial<Geofence>>({
    name: '', latitude: '28.6139', longitude: '77.2090',
    radius_meters: 100, is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (geofence) {
      setFormData({
        name: geofence.name,
        latitude: String(geofence.latitude),
        longitude: String(geofence.longitude),
        radius_meters: geofence.radius_meters,
        is_active: geofence.is_active,
      });
    } else {
      setFormData({ name: '', latitude: '28.6139', longitude: '77.2090', radius_meters: 100, is_active: true });
    }
    setErrors({});
  }, [geofence, isOpen]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.name?.trim()) e.name = 'Name is required';
    const lat = parseFloat(String(formData.latitude));
    if (isNaN(lat) || lat < -90 || lat > 90) e.latitude = 'Valid latitude required (-90 to 90)';
    const lon = parseFloat(String(formData.longitude));
    if (isNaN(lon) || lon < -180 || lon > 180) e.longitude = 'Valid longitude required (-180 to 180)';
    if (!formData.radius_meters || formData.radius_meters <= 0) e.radius_meters = 'Radius must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      let result: Geofence;
      if (geofence) {
        result = await geofencingService.updateGeofence(String(geofence.id), formData);
        toast.success('Geofence updated successfully!');
      } else {
        result = await geofencingService.createGeofence(formData);
        toast.success('Geofence created successfully!');
      }
      onSuccess?.(result);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to save geofence');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!geofence) return;
    if (!confirm(`Delete geofence "${geofence.name}"? This cannot be undone.`)) return;
    try {
      setIsDeleting(true);
      await geofencingService.deleteGeofence(String(geofence.id));
      toast.success('Geofence deleted');
      onSuccess?.(null as any);
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to delete geofence');
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;
  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .gx-modal-input:focus { border-color: rgba(77,159,255,0.45) !important; }
        .gx-btn-cancel:hover { background: rgba(100,160,255,0.06) !important; }
        .gx-btn-delete:hover { background: rgba(255,107,107,0.14) !important; }
        .gx-btn-save:hover { opacity: 0.88; }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)', zIndex: 999,
        backdropFilter: 'blur(3px)',
      }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: C.bg2, border: `0.5px solid ${C.border}`,
        borderRadius: 14, width: '90%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        zIndex: 1000,
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `0.5px solid ${C.borderFaint}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(0,201,167,0.10)', border: `0.5px solid rgba(0,201,167,0.22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary }}>
                {geofence ? 'Edit geofence' : 'Create geofence'}
              </p>
              {geofence && (
                <p style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>
                  {geofence.name} · ID #{geofence.id}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose} disabled={busy}
            style={{
              width: 26, height: 26, borderRadius: 6, background: 'transparent',
              border: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.4 : 1,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Geofence name</label>
            <input
              className="gx-modal-input"
              type="text" value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Office HQ, Remote Site"
              disabled={busy}
              style={inputStyle(!!errors.name)}
            />
            {errors.name && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{errors.name}</p>}
          </div>

          {/* Lat + Lon */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Latitude</label>
              <input
                className="gx-modal-input"
                type="number" step="0.0001" min="-90" max="90"
                value={formData.latitude || ''} disabled={busy}
                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                style={monoStyle(!!errors.latitude)}
              />
              {errors.latitude && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{errors.latitude}</p>}
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input
                className="gx-modal-input"
                type="number" step="0.0001" min="-180" max="180"
                value={formData.longitude || ''} disabled={busy}
                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                style={monoStyle(!!errors.longitude)}
              />
              {errors.longitude && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{errors.longitude}</p>}
            </div>
          </div>

          {/* Radius slider */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Radius</label>
              <span style={{ fontSize: 12, fontWeight: 500, color: C.teal, fontFamily: "'DM Mono', monospace" }}>
                {formData.radius_meters ?? 100} m
              </span>
            </div>
            <input
              type="range" min="10" max="2000" step="10"
              value={formData.radius_meters ?? 100}
              onChange={e => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
              disabled={busy}
              style={{ width: '100%', accentColor: C.teal }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: C.textDim }}>10 m</span>
              <span style={{ fontSize: 10, color: C.textDim }}>2 km</span>
            </div>
            {errors.radius_meters && <p style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{errors.radius_meters}</p>}
          </div>

          {/* Active toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', background: C.bg1,
            border: `0.5px solid ${C.borderFaint}`, borderRadius: 8,
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.textSecondary }}>Active</p>
              <p style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>Geofence is live and enforced</p>
            </div>
            <div
              onClick={() => !busy && setFormData(p => ({ ...p, is_active: !p.is_active }))}
              style={{
                width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                background: formData.is_active ? 'rgba(0,201,167,0.20)' : 'rgba(30,50,80,0.5)',
                border: `0.5px solid ${formData.is_active ? 'rgba(0,201,167,0.4)' : C.borderFaint}`,
                position: 'relative', cursor: busy ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3,
                left: formData.is_active ? 19 : 3,
                width: 14, height: 14, borderRadius: '50%',
                background: formData.is_active ? C.teal : C.textMuted,
                transition: 'all 0.2s',
              }} />
            </div>
          </div>

          {/* Coordinates summary */}
          <div style={{
            padding: '10px 12px', background: C.bg1,
            border: `0.5px solid ${C.borderFaint}`, borderRadius: 8,
          }}>
            <p style={{ fontSize: 10, color: C.textDim, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Preview</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>Coordinates</p>
                <p style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: C.textSecondary }}>
                  {parseFloat(String(formData.latitude || 0)).toFixed(4)}, {parseFloat(String(formData.longitude || 0)).toFixed(4)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: C.textMuted, marginBottom: 2 }}>Radius</p>
                <p style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: C.teal }}>
                  {formData.radius_meters ?? 100} m
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: `0.5px solid ${C.borderFaint}`,
          display: 'grid',
          gridTemplateColumns: geofence ? 'auto 1fr 1fr' : '1fr 1fr',
          gap: 10,
        }}>
          {geofence && (
            <button
              className="gx-btn-delete"
              onClick={handleDelete} disabled={busy}
              style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'rgba(255,107,107,0.08)', border: `0.5px solid rgba(255,107,107,0.22)`,
                color: C.red, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'inherit',
              }}
            >
              {isDeleting
                ? <div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${C.red}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>}
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}

          <button
            className="gx-btn-cancel"
            onClick={onClose} disabled={busy}
            style={{
              padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: 'transparent', border: `0.5px solid ${C.border}`,
              color: C.textMuted, cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.5 : 1, fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>

          <button
            className="gx-btn-save"
            onClick={handleSave} disabled={busy}
            style={{
              padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: C.teal, border: 'none', color: C.bg0,
              cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              fontFamily: 'inherit',
            }}
          >
            {isSaving
              ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${C.bg0}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />Saving…</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{geofence ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </div>
    </>
  );
}