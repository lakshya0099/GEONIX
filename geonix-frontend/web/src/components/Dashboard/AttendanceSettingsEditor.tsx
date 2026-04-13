import { useState } from 'react';
import { AttendanceSettings } from '@/types/attendance';
import { attendanceService } from '@/services/attendance';
import toast from 'react-hot-toast';

/* ─── design tokens ───────────────────────────────────────────────── */
const C = {
  bg0: '#080e1a',
  bg1: '#0b1220',
  bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)',
  borderFaint: 'rgba(100,160,255,0.06)',
  borderHover: 'rgba(100,160,255,0.22)',
  teal: '#00c9a7',
  blue: '#4d9fff',
  amber: '#ffb347',
  red: '#ff6b6b',
  textPrimary: '#e8eef8',
  textSecondary: '#8aa8d0',
  textMuted: '#3d5a80',
  textDim: '#2d4060',
};

/* ─── sub-components ──────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px 0' }}>
      {children}
    </p>
  );
}

function FieldInput({
  label, type = 'text', value, onChange, disabled = false,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        min={type === 'number' ? 0 : undefined}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 8,
          background: disabled ? 'rgba(13,23,40,0.4)' : C.bg1,
          border: `0.5px solid ${disabled ? C.borderFaint : C.border}`,
          color: disabled ? C.textMuted : C.textPrimary,
          fontSize: 13, fontFamily: "'DM Sans','Inter',sans-serif",
          outline: 'none', opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          colorScheme: 'dark',
        }}
      />
    </div>
  );
}

function ToggleSwitch({
  checked, onChange, label, sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
        background: C.bg1, border: `0.5px solid ${checked ? 'rgba(0,201,167,0.2)' : C.borderFaint}`,
        borderRadius: 8, cursor: 'pointer', userSelect: 'none',
        transition: 'border-color .2s',
      }}
    >
      {/* track */}
      <div style={{
        width: 34, height: 18, borderRadius: 9, flexShrink: 0, position: 'relative',
        background: checked ? 'rgba(0,201,167,0.25)' : 'rgba(45,64,96,0.5)',
        border: `0.5px solid ${checked ? 'rgba(0,201,167,0.4)' : C.border}`,
        transition: 'all .2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: checked ? C.teal : C.textMuted,
          transition: 'left .2s, background .2s',
          boxShadow: checked ? `0 0 6px rgba(0,201,167,0.6)` : 'none',
        }} />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: checked ? C.textSecondary : C.textMuted, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: C.textDim, margin: '2px 0 0' }}>{sub}</p>}
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500,
          background: checked ? 'rgba(0,201,167,0.10)' : 'rgba(45,64,96,0.3)',
          color: checked ? C.teal : C.textMuted,
          border: `0.5px solid ${checked ? 'rgba(0,201,167,0.22)' : 'transparent'}`,
        }}>
          {checked ? 'On' : 'Off'}
        </span>
      </div>
    </div>
  );
}

function DisplayRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '9px 0', borderBottom: `0.5px solid ${C.borderFaint}` }}>
      <span style={{ fontSize: 11, color: C.textMuted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: accent ?? C.textSecondary, fontFamily: value.includes(':') ? "'DM Mono',monospace" : 'inherit' }}>
        {value}
      </span>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────── */
interface AttendanceSettingsEditorProps {
  settings: AttendanceSettings | null;
  onSave?: (updatedSettings: AttendanceSettings) => void;
}

export function AttendanceSettingsEditor({ settings, onSave }: AttendanceSettingsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AttendanceSettings | null>(settings);

  const shared: React.CSSProperties = {
    background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '20px 22px',
    fontFamily: "'DM Sans','Inter',sans-serif",
  };

  /* empty state */
  if (!settings) {
    return (
      <div style={{ ...shared, textAlign: 'center', padding: '32px' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,179,71,0.10)', border: `0.5px solid rgba(255,179,71,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>Settings not available</p>
      </div>
    );
  }

  const handleEdit = () => { setFormData(settings); setIsEditing(true); };
  const handleCancel = () => { setFormData(settings); setIsEditing(false); };

  const set = (field: keyof AttendanceSettings, value: any) => {
    if (formData) setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!formData) return;
    try {
      setIsSaving(true);
      const updated = await attendanceService.updateSettings(formData);
      setFormData(updated);
      setIsEditing(false);
      toast.success('Settings updated successfully!');
      onSave?.(updated);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  /* ── edit mode ── */
  if (isEditing && formData) {
    return (
      <div style={shared}>
        <style>{`
          @keyframes spin{to{transform:rotate(360deg)}}
          input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        `}</style>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue, boxShadow: `0 0 6px ${C.blue}88` }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Edit settings</p>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'transparent', border: `0.5px solid ${C.border}`, color: C.textMuted, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.4 : 1 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ height: 0.5, background: C.borderFaint, marginBottom: 18 }} />

        {/* time fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <FieldInput
            label="Work start time"
            type="time"
            value={formData.working_hours_start || '09:00'}
            onChange={(v) => set('working_hours_start', v)}
          />
          <FieldInput
            label="Work end time"
            type="time"
            value={formData.working_hours_end || '17:00'}
            onChange={(v) => set('working_hours_end', v)}
          />
        </div>

        {/* number fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <FieldInput
            label="Late threshold (min)"
            type="number"
            value={formData.late_threshold_minutes ?? 15}
            onChange={(v) => set('late_threshold_minutes', parseInt(v))}
          />
          <FieldInput
            label="Auto checkout (min)"
            type="number"
            value={formData.auto_checkout_minutes ?? 600}
            onChange={(v) => set('auto_checkout_minutes', parseInt(v))}
            disabled={!formData.auto_checkout_enabled}
          />
        </div>

        {/* toggle */}
        <div style={{ marginBottom: 18 }}>
          <ToggleSwitch
            checked={formData.auto_checkout_enabled ?? false}
            onChange={(v) => set('auto_checkout_enabled', v)}
            label="Enable auto checkout"
            sub={formData.auto_checkout_enabled ? `Employees checked out after ${formData.auto_checkout_minutes ?? 600} min` : 'Employees must manually check out'}
          />
        </div>

        {/* actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            style={{ padding: '10px', borderRadius: 8, background: 'transparent', border: `0.5px solid ${C.border}`, color: C.textMuted, fontSize: 12, fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isSaving ? 0.4 : 1 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '10px', borderRadius: 8, background: isSaving ? C.bg1 : `linear-gradient(135deg,#1e6fff,#0e9e82)`, border: 'none', color: isSaving ? C.textMuted : '#fff', fontSize: 12, fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' }}
          >
            {isSaving ? (
              <>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${C.textMuted}`, borderTopColor: C.blue, animation: 'spin .8s linear infinite' }} />
                Saving…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                Save settings
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ── display mode ── */
  return (
    <div style={shared}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, boxShadow: `0 0 6px ${C.teal}88` }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: C.textPrimary, margin: 0 }}>Attendance settings</p>
        </div>
        <button
          onClick={handleEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: 'rgba(77,159,255,0.10)', border: `0.5px solid rgba(77,159,255,0.22)`, color: C.blue, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
      </div>

      <div style={{ height: 0.5, background: C.borderFaint, marginBottom: 4 }} />

      {/* rows */}
      <DisplayRow label="Work hours start" value={settings.working_hours_start || '–'} />
      <DisplayRow label="Work hours end" value={settings.working_hours_end || '–'} />
      <DisplayRow label="Late threshold" value={`${settings.late_threshold_minutes} min`} accent={C.amber} />
      <DisplayRow
        label="Auto checkout"
        value={settings.auto_checkout_enabled ? `Enabled · ${settings.auto_checkout_minutes} min` : 'Disabled'}
        accent={settings.auto_checkout_enabled ? C.teal : C.textMuted}
      />

      {/* auto checkout status bar */}
      <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: C.bg1, border: `0.5px solid ${settings.auto_checkout_enabled ? 'rgba(0,201,167,0.15)' : C.borderFaint}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: settings.auto_checkout_enabled ? C.teal : C.textMuted, boxShadow: settings.auto_checkout_enabled ? `0 0 6px rgba(0,201,167,0.5)` : 'none', flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: settings.auto_checkout_enabled ? C.textSecondary : C.textMuted, margin: 0 }}>
          {settings.auto_checkout_enabled
            ? `Employees are automatically checked out after ${settings.auto_checkout_minutes} minutes`
            : 'Auto checkout is disabled — employees must check out manually'}
        </p>
      </div>
    </div>
  );
}