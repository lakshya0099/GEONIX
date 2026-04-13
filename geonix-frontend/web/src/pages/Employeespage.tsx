// src/pages/EmployeesPage.tsx
import { useEffect, useState } from 'react';
import { employeeService, Employee, CreateEmployeePayload } from '@/services/employee';
import toast from 'react-hot-toast';

const C = {
  bg0: '#080e1a', bg1: '#0b1220', bg2: '#0d1728',
  border: 'rgba(100,160,255,0.10)', borderFaint: 'rgba(100,160,255,0.06)',
  teal: '#00c9a7', blue: '#4d9fff', amber: '#ffb347', red: '#ff6b6b', purple: '#a78bfa',
  textPrimary: '#e8eef8', textSecondary: '#8aa8d0', textMuted: '#3d5a80', textDim: '#2d4060',
};

/* ─── add employee modal ──────────────────────────────────────────── */
function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<CreateEmployeePayload>({ full_name: '', email: '', password: '', role: 'employee' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateEmployeePayload, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.full_name.trim()) e.full_name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await employeeService.createEmployee(form);
      toast.success(`Employee ${form.full_name} added`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.email?.[0] || 'Failed to create employee';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const field = (key: keyof CreateEmployeePayload, label: string, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label style={{ fontSize: 11, color: '#4a6a8a', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => { setForm(prev => ({ ...prev, [key]: e.target.value })); setErrors(prev => ({ ...prev, [key]: undefined })); }}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 7, background: C.bg0, border: `0.5px solid ${errors[key] ? 'rgba(255,107,107,0.45)' : C.border}`, color: C.textPrimary, fontSize: 12, outline: 'none' }}
        {...extra}
      />
      {errors[key] && <p style={{ fontSize: 10, color: C.red, marginTop: 3 }}>{errors[key]}</p>}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: C.bg1, border: `0.5px solid ${C.border}`, borderRadius: 14, width: '100%', maxWidth: 420, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary }}>Add employee</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ height: 0.5, background: C.borderFaint }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {field('full_name', 'Full name')}
          {field('email', 'Email address', 'email')}
          {field('password', 'Password', 'password', { placeholder: 'Min 8 characters' })}
          <div>
            <label style={{ fontSize: 11, color: '#4a6a8a', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Role</label>
            <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value as 'employee' | 'orgadmin' }))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 7, background: C.bg0, border: `0.5px solid ${C.border}`, color: C.textPrimary, fontSize: 12, outline: 'none' }}>
              <option value="employee">Employee</option>
              <option value="orgadmin">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', border: `0.5px solid ${C.border}`, color: C.textMuted, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} style={{ flex: 2, padding: '9px', borderRadius: 8, background: 'linear-gradient(135deg,#1e6fff,#0e9e82)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? 'Creating…' : 'Create employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── employee row ────────────────────────────────────────────────── */
function EmployeeRow({
  emp, onToggle, onDelete,
}: { emp: Employee; onToggle: (emp: Employee) => void; onDelete: (id: number) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initial = emp.full_name.charAt(0).toUpperCase();
  const roleColor = emp.role === 'orgadmin' || emp.role === 'superadmin' ? C.amber : C.blue;

  return (
    <tr style={{ borderBottom: `0.5px solid ${C.borderFaint}` }}>
      <td style={{ padding: '11px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(30,111,255,0.12)', border: `1px solid rgba(77,159,255,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>{initial}</span>
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{emp.full_name}</p>
            <p style={{ fontSize: 10, color: C.textMuted }}>{emp.email}</p>
          </div>
        </div>
      </td>
      <td style={{ padding: '11px 16px' }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `rgba(${emp.role === 'orgadmin' ? '255,179,71' : '77,159,255'},0.10)`, color: roleColor, border: `0.5px solid ${roleColor}44`, textTransform: 'capitalize' }}>
          {emp.role === 'orgadmin' ? 'Admin' : 'Employee'}
        </span>
      </td>
      <td style={{ padding: '11px 16px' }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: emp.is_active ? 'rgba(0,201,167,0.10)' : 'rgba(61,90,128,0.18)', color: emp.is_active ? C.teal : C.textMuted, border: `0.5px solid ${emp.is_active ? 'rgba(0,201,167,0.25)' : 'transparent'}` }}>
          {emp.is_active ? '● Active' : '○ Inactive'}
        </span>
      </td>
      <td style={{ padding: '11px 16px', fontSize: 11, color: C.textMuted }}>
        {emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : '–'}
      </td>
      <td style={{ padding: '11px 16px', fontSize: 11, color: C.textMuted }}>
        {emp.last_login ? new Date(emp.last_login).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
      </td>
      <td style={{ padding: '11px 16px' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => onToggle(emp)} title={emp.is_active ? 'Deactivate' : 'Activate'} style={{ width: 26, height: 26, borderRadius: 6, background: emp.is_active ? 'rgba(255,107,107,0.08)' : 'rgba(0,201,167,0.08)', border: `0.5px solid ${emp.is_active ? 'rgba(255,107,107,0.2)' : 'rgba(0,201,167,0.2)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {emp.is_active
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            }
          </button>
          {confirmDelete ? (
            <>
              <button onClick={() => onDelete(emp.id)} style={{ padding: '0 8px', height: 26, borderRadius: 6, background: 'rgba(255,107,107,0.12)', border: `0.5px solid rgba(255,107,107,0.3)`, cursor: 'pointer', fontSize: 10, color: C.red }}>Confirm</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '0 8px', height: 26, borderRadius: 6, background: C.bg2, border: `0.5px solid ${C.border}`, cursor: 'pointer', fontSize: 10, color: C.textMuted }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Delete" style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,107,107,0.06)', border: `0.5px solid rgba(255,107,107,0.15)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.8" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── main page ───────────────────────────────────────────────────── */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'employee' | 'orgadmin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { loadEmployees(); }, []);

  async function loadEmployees() {
    try {
      setIsLoading(true);
      const data = await employeeService.getEmployees();
      setEmployees(data || []);
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggle(emp: Employee) {
    try {
      await employeeService.updateEmployee(emp.id, { is_active: !emp.is_active });
      toast.success(`${emp.full_name} ${emp.is_active ? 'deactivated' : 'activated'}`);
      loadEmployees();
    } catch {
      toast.error('Failed to update employee');
    }
  }

  async function handleDelete(id: number) {
    try {
      await employeeService.deleteEmployee(id);
      toast.success('Employee removed');
      loadEmployees();
    } catch {
      toast.error('Failed to delete employee');
    }
  }

  const filtered = employees.filter(e => {
    const matchSearch = e.full_name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || e.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? e.is_active : !e.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount = employees.filter(e => e.is_active).length;
  const adminCount = employees.filter(e => e.role === 'orgadmin' || e.role === 'superadmin').length;

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
        input:focus,select:focus{outline:none;border-color:rgba(77,159,255,0.35) !important;}
        tbody tr:hover{background:rgba(100,160,255,0.03);}
      `}</style>

      {/* header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h1 style={{ fontSize: 16, fontWeight: 500, color: C.textPrimary }}>Employees</h1>
          </div>
          <p style={{ fontSize: 11, color: C.textMuted }}>{activeCount} active · {adminCount} admin · {employees.length} total</p>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#1e6fff,#0e9e82)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add employee
        </button>
      </div>

      {/* stat chips */}
      <div style={{ padding: '12px 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', gap: 20 }}>
        {[
          { label: 'Total', value: employees.length, color: C.blue },
          { label: 'Active', value: activeCount, color: C.teal },
          { label: 'Admins', value: adminCount, color: C.amber },
          { label: 'Inactive', value: employees.length - activeCount, color: C.textMuted },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 500, color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 11, color: C.textDim }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* filters */}
      <div style={{ padding: '12px 24px', borderBottom: `0.5px solid ${C.borderFaint}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 32, borderRadius: 7, background: C.bg2, border: `0.5px solid ${C.border}`, color: C.textPrimary, fontSize: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'employee', 'orgadmin'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: roleFilter === r ? 'rgba(255,179,71,0.12)' : 'transparent', border: `0.5px solid ${roleFilter === r ? 'rgba(255,179,71,0.3)' : C.border}`, color: roleFilter === r ? C.amber : C.textMuted, textTransform: 'capitalize', fontWeight: roleFilter === r ? 500 : 400 }}>
              {r === 'orgadmin' ? 'Admin' : r === 'all' ? 'All roles' : 'Employee'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: statusFilter === s ? 'rgba(0,201,167,0.10)' : 'transparent', border: `0.5px solid ${statusFilter === s ? 'rgba(0,201,167,0.25)' : C.border}`, color: statusFilter === s ? C.teal : C.textMuted, fontWeight: statusFilter === s ? 500 : 400, textTransform: 'capitalize' }}>
              {s === 'all' ? 'All status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div style={{ flex: 1, overflowX: 'auto', padding: '0 24px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, gap: 10 }}>
            <p style={{ fontSize: 14, color: C.textMuted }}>No employees found</p>
            <p style={{ fontSize: 12, color: C.textDim }}>Try adjusting your filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${C.border}` }}>
                {['Employee', 'Role', 'Status', 'Joined', 'Last login', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <EmployeeRow key={emp.id} emp={emp} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddEmployeeModal onClose={() => setShowAddModal(false)} onSuccess={loadEmployees} />
      )}
    </div>
  );
}