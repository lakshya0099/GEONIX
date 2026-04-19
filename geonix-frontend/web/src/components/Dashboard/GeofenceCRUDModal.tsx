/**
 * GeofenceCRUDModal
 * – Leaflet map (no API key) for picking the geofence centre
 * – Nominatim search bar for finding locations by name
 * – Radius slider with live circle preview
 * – Drop-in replacement; props / onSuccess / onClose unchanged
 */

import { useEffect, useRef, useState } from 'react';
import { geofencingService } from '@/services/geofencing';
import { Geofence } from '@/types/geofencing';
import toast from 'react-hot-toast';

/* ── design tokens (match dashboard) ─────────────────────────────── */
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

/* ── Leaflet types (minimal) ──────────────────────────────────────── */
declare const L: any;

/* ── props ────────────────────────────────────────────────────────── */
interface GeofenceCRUDModalProps {
  isOpen: boolean;
  geofence: Geofence | null;
  onClose: () => void;
  onSuccess: () => void;
}

/* ── helpers ─────────────────────────────────────────────────────── */
const DEFAULT_LAT = 28.6139;  // New Delhi fallback
const DEFAULT_LNG = 77.2090;
const DEFAULT_RADIUS = 200;

function injectLeaflet(): Promise<void> {
  return new Promise(resolve => {
    if ((window as any).L) { resolve(); return; }

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

/* ── search result type ───────────────────────────────────────────── */
interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

/* ── input component ──────────────────────────────────────────────── */
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: C.bg1, border: `0.5px solid ${C.border}`,
          borderRadius: 8, padding: '9px 12px',
          color: C.textPrimary, fontSize: 13,
          outline: 'none', fontFamily: "'DM Sans','Inter',sans-serif",
          width: '100%',
        }}
      />
    </div>
  );
}

/* ── main modal ───────────────────────────────────────────────────── */
export function GeofenceCRUDModal({ isOpen, geofence, onClose, onSuccess }: GeofenceCRUDModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const leafletReady = useRef(false);

  const [name, setName] = useState('');
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<any>(null);

  /* populate form when editing */
  useEffect(() => {
    if (geofence) {
      setName(geofence.name || '');
      setLat(geofence.latitude ?? DEFAULT_LAT);
      setLng(geofence.longitude ?? DEFAULT_LNG);
      setRadius(geofence.radius ?? DEFAULT_RADIUS);
      setIsActive(geofence.is_active ?? true);
    } else {
      setName('');
      setLat(DEFAULT_LAT);
      setLng(DEFAULT_LNG);
      setRadius(DEFAULT_RADIUS);
      setIsActive(true);
    }
    setSearchQuery('');
    setSearchResults([]);
  }, [geofence, isOpen]);

  /* init / destroy map */
  useEffect(() => {
    if (!isOpen) {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        leafletReady.current = false;
      }
      return;
    }

    let cancelled = false;
    injectLeaflet().then(() => {
      if (cancelled || !mapRef.current || leafletMap.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OSM © CARTO',
        maxZoom: 19,
      }).addTo(map);

      // custom marker icon
      const icon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:${C.teal};border:3px solid #fff;box-shadow:0 0 10px ${C.teal}88;"></div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      const circle = L.circle([lat, lng], {
        radius,
        color: C.teal,
        fillColor: C.teal,
        fillOpacity: 0.08,
        weight: 1.5,
      }).addTo(map);

      marker.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setLat(parseFloat(pos.lat.toFixed(6)));
        setLng(parseFloat(pos.lng.toFixed(6)));
        circle.setLatLng(pos);
      });

      map.on('click', (e: any) => {
        const { lat: la, lng: lo } = e.latlng;
        marker.setLatLng([la, lo]);
        circle.setLatLng([la, lo]);
        setLat(parseFloat(la.toFixed(6)));
        setLng(parseFloat(lo.toFixed(6)));
      });

      leafletMap.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
      leafletReady.current = true;
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* sync marker + circle when lat/lng/radius change programmatically */
  useEffect(() => {
    if (!leafletReady.current) return;
    markerRef.current?.setLatLng([lat, lng]);
    circleRef.current?.setLatLng([lat, lng]);
    leafletMap.current?.setView([lat, lng], leafletMap.current.getZoom());
  }, [lat, lng]);

  useEffect(() => {
    if (!leafletReady.current) return;
    circleRef.current?.setRadius(radius);
  }, [radius]);

  /* nominatim search */
  const handleSearchInput = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch {
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectResult = (r: SearchResult) => {
    const la = parseFloat(parseFloat(r.lat).toFixed(6));
    const lo = parseFloat(parseFloat(r.lon).toFixed(6));
    setLat(la);
    setLng(lo);
    setSearchQuery(r.display_name.split(',').slice(0, 2).join(','));
    setShowDropdown(false);
  };

  /* save */
  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (radius < 50) { toast.error('Radius must be at least 50 m'); return; }

    setIsSaving(true);
    try {
      const payload = { name: name.trim(), latitude: lat, longitude: lng, radius, is_active: isActive };
      if (geofence) {
        await geofencingService.updateGeofence(String(geofence.id), payload);
        toast.success('Geofence updated!');
      } else {
        await geofencingService.createGeofence(payload);
        toast.success('Geofence created!');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(5,10,20,0.75)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* modal */}
      <div style={{
        position: 'fixed', zIndex: 1000,
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(780px, 95vw)', maxHeight: '90vh',
        background: C.bg1, border: `0.5px solid ${C.border}`,
        borderRadius: 16, display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans','Inter',sans-serif", overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>

        {/* header */}
        <div style={{
          padding: '16px 20px', borderBottom: `0.5px solid ${C.borderFaint}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, boxShadow: `0 0 8px ${C.teal}88` }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary, margin: 0 }}>
              {geofence ? 'Edit geofence' : 'New geofence'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.textMuted, lineHeight: 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* left: form */}
          <div style={{
            width: 260, flexShrink: 0, padding: '18px 16px',
            borderRight: `0.5px solid ${C.borderFaint}`,
            display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto',
          }}>

            <Field label="Geofence name" value={name} onChange={setName} placeholder="e.g. Head office" />

            {/* location search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Search location
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <svg
                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={C.textDim} strokeWidth="2" strokeLinecap="round"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  >
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={e => handleSearchInput(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="Search for a place…"
                    style={{
                      background: C.bg0, border: `0.5px solid ${C.border}`,
                      borderRadius: 8, padding: '9px 12px 9px 30px',
                      color: C.textPrimary, fontSize: 13, width: '100%',
                      outline: 'none', fontFamily: "'DM Sans','Inter',sans-serif",
                    }}
                  />
                  {isSearching && (
                    <div style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      width: 12, height: 12, borderRadius: '50%',
                      border: `1.5px solid ${C.bg0}`, borderTopColor: C.teal,
                      animation: 'spin .7s linear infinite',
                    }} />
                  )}
                </div>

                {/* dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    background: C.bg0, border: `0.5px solid ${C.border}`,
                    borderRadius: 8, marginTop: 4, overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectResult(r)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '9px 12px', background: 'none',
                          border: 'none', borderBottom: i < searchResults.length - 1 ? `0.5px solid ${C.borderFaint}` : 'none',
                          color: C.textSecondary, fontSize: 12, cursor: 'pointer',
                          fontFamily: "'DM Sans','Inter',sans-serif",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.bg2)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                          </svg>
                          <span style={{ lineHeight: 1.35 }}>
                            {r.display_name.length > 60 ? r.display_name.slice(0, 60) + '…' : r.display_name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p style={{ fontSize: 10, color: C.textDim, margin: 0 }}>
                Or click anywhere on the map / drag the pin
              </p>
            </div>

            {/* coordinates display (read-only, derived from map) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Latitude', value: lat },
                { label: 'Longitude', value: lng },
              ].map(f => (
                <div key={f.label} style={{
                  padding: '9px 11px', background: C.bg0,
                  border: `0.5px solid ${C.borderFaint}`, borderRadius: 8,
                }}>
                  <p style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>{f.label}</p>
                  <p style={{ fontSize: 12, color: C.textSecondary, fontVariantNumeric: 'tabular-nums', margin: 0 }}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* radius */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Radius
                </label>
                <span style={{ fontSize: 12, color: C.teal, fontWeight: 500 }}>{radius} m</span>
              </div>
              <input
                type="range" min={50} max={5000} step={50} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                style={{ width: '100%', accentColor: C.teal, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, color: C.textDim }}>50 m</span>
                <span style={{ fontSize: 9, color: C.textDim }}>5 km</span>
              </div>
            </div>

            {/* active toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>Active</p>
                <p style={{ fontSize: 10, color: C.textDim, margin: '2px 0 0' }}>Enable attendance tracking</p>
              </div>
              <button
                onClick={() => setIsActive(v => !v)}
                style={{
                  width: 38, height: 21, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: isActive ? C.teal : C.textDim,
                  position: 'relative', transition: 'background .2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: isActive ? 19 : 3,
                  width: 15, height: 15, borderRadius: '50%', background: '#fff',
                  transition: 'left .2s',
                }} />
              </button>
            </div>

            {/* spacer */}
            <div style={{ flex: 1 }} />

            {/* actions */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: `0.5px solid ${C.borderFaint}` }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: `0.5px solid ${C.border}`,
                  background: 'none', color: C.textSecondary, fontSize: 13, cursor: 'pointer',
                  fontFamily: "'DM Sans','Inter',sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                  background: isSaving ? C.textDim : C.teal, color: '#080e1a',
                  fontSize: 13, fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans','Inter',sans-serif", transition: 'background .2s',
                }}
              >
                {isSaving ? 'Saving…' : geofence ? 'Update' : 'Create'}
              </button>
            </div>
          </div>

          {/* right: map */}
          <div style={{ flex: 1, position: 'relative' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} .leaflet-container{background:#080e1a!important}`}</style>
            <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />

            {/* hint overlay */}
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(8,14,26,0.82)', backdropFilter: 'blur(8px)',
              border: `0.5px solid ${C.borderFaint}`, borderRadius: 20,
              padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6,
              pointerEvents: 'none',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>Click map or drag pin to set centre</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}