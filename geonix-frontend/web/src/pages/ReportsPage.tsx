// src/pages/ReportsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { attendanceService } from '@/services/attendance';
import { employeeService, EmployeeAttendanceSummary } from '@/services/employee';
import { AttendanceRecord } from '@/types/attendance';
import toast from 'react-hot-toast';

const C = {
  bg0: '#080e1a', bg1: '#0b1220', bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)', borderFaint: 'rgba(100,160,255,0.06)',
  teal: '#00c9a7', blue: '#4d9fff', amber: '#ffb347', red: '#ff6b6b', purple: '#a78bfa',
  textPrimary: '#e8eef8', textSecondary: '#8aa8d0', textMuted: '#3d5a80', textDim: '#2d4060',
};

/* ─── helpers ─────────────────────────────────────────────────────── */
function fmt(iso: string | null | undefined) {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/* status badge */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    present:  { color: C.teal,  bg: 'rgba(0,201,167,0.10)',   border: 'rgba(0,201,167,0.25)' },
    absent:   { color: C.red,   bg: 'rgba(255,107,107,0.10)', border: 'rgba(255,107,107,0.22)' },
    late:     { color: C.amber, bg: 'rgba(255,179,71,0.10)',  border: 'rgba(255,179,71,0.22)' },
    'on-leave':{ color: C.purple,bg: 'rgba(167,139,250,0.10)',border: 'rgba(167,139,250,0.22)' },
  };
  const s = map[status?.toLowerCase()] ?? { color: C.textMuted, bg: 'rgba(61,90,128,0.18)', border: 'transparent' };
  return (
    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color, border: `0.5px solid ${s.border}`, textTransform: 'capitalize' }}>
      {status ?? 'Unknown'}
    </span>
  );
}

/* mini bar chart for hours */
function HoursBar({ hours, max = 10 }: { hours: number; max?: number }) {
  const pct = Math.min(100, (hours / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.bg1, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: hours >= 8 ? C.teal : hours >= 5 ? C.amber : C.red }} />
      </div>
      <span style={{ fontSize: 11, color: C.textSecondary, minWidth: 32, textAlign: 'right' }}>
        {hours.toFixed(1)}h
      </span>
    </div>
  );
}

/* ─── attendance record table (detail view) ───────────────────────── */
function RecordTable({ records }: { records: AttendanceRecord[] }) {
  if (records.length === 0) return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: C.textMuted }}>No records for this period</p>
    </div>
  );
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
          {['Date', 'Status', 'Clock in', 'Clock out', 'Total hours', 'Location'].map(h => (
            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((r, i) => (
          <tr key={i} style={{ borderBottom: `0.5px solid ${C.borderFaint}` }}>
            <td style={{ padding: '10px 12px', fontSize: 12, color: C.textSecondary }}>{fmtDate(r.date)}</td>
            <td style={{ padding: '10px 12px' }}><StatusBadge status={r.status} /></td>
            <td style={{ padding: '10px 12px', fontSize: 11, color: C.textSecondary, fontFamily: 'monospace' }}>{fmt(r.clock_in_time)}</td>
            <td style={{ padding: '10px 12px', fontSize: 11, color: C.textSecondary, fontFamily: 'monospace' }}>{fmt(r.clock_out_time)}</td>
            <td style={{ padding: '10px 12px', minWidth: 140 }}>
              <HoursBar hours={Number(r.total_hours) || 0} />
            </td>
            <td style={{ padding: '10px 12px', fontSize: 11, color: C.textMuted }}>
              {r.geofence_name ?? '–'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── summary card row ────────────────────────────────────────────── */
function SummaryCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
      <p style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, color, lineHeight: 1, marginBottom: sub ? 4 : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: C.textMuted }}>{sub}</p>}
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────────────── */
export default function ReportsPage() {
  /* date range */
  const [dateFrom, setDateFrom] = useState(daysAgoStr(30));
  const [dateTo, setDateTo] = useState(todayStr());
  const [quickRange, setQuickRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  /* data */
  const [summaries, setSummaries] = useState<EmployeeAttendanceSummary[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* view */
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'present' | 'absent' | 'hours'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { loadData(); }, [dateFrom, dateTo]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [sumData, recData] = await Promise.all([
        employeeService.getAttendanceSummaries({ date_from: dateFrom, date_to: dateTo }),
        attendanceService.getAttendanceRecords({ dateFrom, dateTo }).catch(() => []),
      ]);
      setSummaries(sumData || []);
      setRecords(recData || []);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }

  function setQuick(range: '7d' | '30d' | '90d') {
    setQuickRange(range);
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    setDateFrom(daysAgoStr(days));
    setDateTo(todayStr());
  }

  /* export CSV */
  function exportCSV() {
    const headers = ['Employee', 'Email', 'Present Days', 'Absent Days', 'Late Days', 'Total Hours'];
    const rows = filteredSummaries.map(s => [s.full_name, s.email, s.present_days, s.absent_days, s.late_days, s.total_hours.toFixed(1)]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `geonix-report-${dateFrom}-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  }

  /* totals */
  const totalPresent = summaries.reduce((s, e) => s + e.present_days, 0);
  const totalAbsent = summaries.reduce((s, e) => s + e.absent_days, 0);
  const totalLate = summaries.reduce((s, e) => s + e.late_days, 0);
  const totalHours = summaries.reduce((s, e) => s + e.total_hours, 0);
  const presentToday = summaries.filter(e => e.is_present_today).length;

  /* sort + filter summaries */
  const filteredSummaries = summaries
    .filter(e => e.full_name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let diff = 0;
      if (sortBy === 'name') diff = a.full_name.localeCompare(b.full_name);
      else if (sortBy === 'present') diff = a.present_days - b.present_days;
      else if (sortBy === 'absent') diff = a.absent_days - b.absent_days;
      else if (sortBy === 'hours') diff = a.total_hours - b.total_hours;
      return sortDir === 'asc' ? diff : -diff;
    });

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  }
  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 5 19 12"/></svg>;
    return sortDir === 'asc'
      ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round"><polyline points="5 15 12 8 19 15"/></svg>
      : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round"><polyline points="5 9 12 16 19 9"/></svg>;
  }

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
        input[type="date"]{color-scheme:dark;}
        input:focus{outline:none;border-color:rgba(77,159,255,0.35) !important;}
        tbody tr:hover{background:rgba(100,160,255,0.025);}
        th{user-select:none;}
      `}</style>

      {/* header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>Reports</h1>
          </div>
          <p style={{ fontSize: 11, color: C.textMuted }}>{summaries.length} employees · {dateFrom} to {dateTo}</p>
        </div>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(0,201,167,0.08)', border: `0.5px solid rgba(0,201,167,0.22)`, color: C.teal, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* date range controls */}
      <div style={{ padding: '12px 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['7d', '30d', '90d'] as const).map(r => (
            <button key={r} onClick={() => setQuick(r)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: quickRange === r ? 'rgba(77,159,255,0.12)' : 'transparent', border: `0.5px solid ${quickRange === r ? 'rgba(77,159,255,0.3)' : C.border}`, color: quickRange === r ? C.blue : C.textMuted, fontWeight: quickRange === r ? 500 : 400 }}>
              {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setQuickRange('custom'); }}
            style={{ height: 30, padding: '0 10px', borderRadius: 7, background: C.bg2, border: `0.5px solid ${C.border}`, color: C.textPrimary, fontSize: 11 }} />
          <span style={{ fontSize: 11, color: C.textDim }}>to</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setQuickRange('custom'); }}
            style={{ height: 30, padding: '0 10px', borderRadius: 7, background: C.bg2, border: `0.5px solid ${C.border}`, color: C.textPrimary, fontSize: 11 }} />
        </div>
      </div>

      {/* kpi cards */}
      <div style={{ padding: '16px 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        <SummaryCard label="Present today" value={presentToday} color={C.teal} sub={`of ${summaries.length} employees`} />
        <SummaryCard label="Total present days" value={totalPresent} color={C.blue} />
        <SummaryCard label="Total absent days" value={totalAbsent} color={C.red} />
        <SummaryCard label="Total late days" value={totalLate} color={C.amber} />
        <SummaryCard label="Total hours logged" value={`${totalHours.toFixed(0)}h`} color={C.purple} />
      </div>

      {/* tabs */}
      <div style={{ padding: '0 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', gap: 0 }}>
        {(['overview', 'detail'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 16px', fontSize: 12, fontWeight: activeTab === tab ? 500 : 400, cursor: 'pointer', background: 'transparent', border: 'none', color: activeTab === tab ? C.blue : C.textMuted, borderBottom: `2px solid ${activeTab === tab ? C.blue : 'transparent'}`, textTransform: 'capitalize' }}>
            {tab === 'overview' ? 'Employee summary' : 'Attendance records'}
          </button>
        ))}
      </div>

      {/* search */}
      {activeTab === 'overview' && (
        <div style={{ padding: '12px 24px', borderBottom: `0.5px solid ${C.borderFaint}` }}>
          <div style={{ position: 'relative', maxWidth: 300 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees…" style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 32, borderRadius: 7, background: C.bg2, border: `0.5px solid ${C.border}`, color: C.textPrimary, fontSize: 12 }} />
          </div>
        </div>
      )}

      {/* content */}
      <div style={{ flex: 1, overflowX: 'auto', padding: '0 24px 24px' }}>
        {activeTab === 'overview' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                {[
                  { label: 'Employee', col: 'name' as const },
                  { label: 'Today', col: null },
                  { label: 'Present days', col: 'present' as const },
                  { label: 'Absent days', col: 'absent' as const },
                  { label: 'Late days', col: null },
                  { label: 'Total hours', col: 'hours' as const },
                  { label: 'Last seen', col: null },
                ].map(({ label, col }) => (
                  <th key={label} onClick={col ? () => toggleSort(col) : undefined}
                    style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, color: col ? (sortBy === col ? C.blue : C.textDim) : C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, cursor: col ? 'pointer' : 'default' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {label}{col && <SortIcon col={col} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map(e => (
                <tr key={e.employee_id} style={{ borderBottom: `0.5px solid ${C.borderFaint}` }}>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(30,111,255,0.12)', border: `1px solid rgba(77,159,255,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: C.blue }}>{e.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{e.full_name}</p>
                        <p style={{ fontSize: 10, color: C.textMuted }}>{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: e.is_present_today ? 'rgba(0,201,167,0.10)' : 'rgba(61,90,128,0.18)', color: e.is_present_today ? C.teal : C.textMuted, border: `0.5px solid ${e.is_present_today ? 'rgba(0,201,167,0.25)' : 'transparent'}` }}>
                      {e.is_present_today ? '● In' : '○ Out'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 500, color: C.teal }}>{e.present_days}</td>
                  <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 500, color: e.absent_days > 3 ? C.red : C.textSecondary }}>{e.absent_days}</td>
                  <td style={{ padding: '11px 12px', fontSize: 13, color: e.late_days > 0 ? C.amber : C.textMuted }}>{e.late_days}</td>
                  <td style={{ padding: '11px 12px', minWidth: 160 }}><HoursBar hours={e.total_hours} max={summaries.length > 0 ? Math.max(...summaries.map(s => s.total_hours), 1) : 200} /></td>
                  <td style={{ padding: '11px 12px', fontSize: 11, color: C.textMuted }}>{e.last_seen ? fmtDate(e.last_seen) : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ marginTop: 12 }}>
            <RecordTable records={records} />
          </div>
        )}
      </div>
    </div>
  );
}