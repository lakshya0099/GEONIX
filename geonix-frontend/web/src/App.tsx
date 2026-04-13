import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import Navbar from '@/components/Navbar';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import GeofencesPage from '@/components/Geofencing/Geofencespage';
import EmployeesPage from '@/pages/Employeespage';
import ReportsPage from '@/pages/ReportsPage';
import '@/styles/globals.css';

/* ─── Layout wrapper — Navbar + page content side by side ─────────── */
function AppLayout() {
  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080e1a' }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: 'auto', background: '#080e1a' }}>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .react-hot-toast { animation: toast-slide-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important; }
        .react-hot-toast button:hover { opacity: 0.8 !important; }
      `}</style>

      <Router>
        <Routes>
          {/* Public — no navbar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — all share AppLayout (Navbar + Outlet) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard"  element={<DashboardPage />} />
            <Route path="/geofences"  element={<GeofencesPage />} />
            <Route path="/employees"  element={<EmployeesPage />} />
            <Route path="/reports"    element={<ReportsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        containerStyle={{ top: 20, right: 20 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(10,20,34,0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#e8eef8',
            border: '0.5px solid rgba(100,160,255,0.18)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(77,159,255,0.08)',
            padding: '12px 16px',
            fontFamily: "'DM Sans','Inter',sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          },
          success: {
            style: {
              background: 'rgba(0,201,167,0.10)',
              border: '0.5px solid rgba(0,201,167,0.30)',
              color: '#00c9a7',
              boxShadow: '0 0 18px rgba(0,201,167,0.25), 0 6px 18px rgba(0,0,0,0.4)',
            },
            iconTheme: { primary: '#00c9a7', secondary: '#081628' },
          },
          error: {
            style: {
              background: 'rgba(255,107,107,0.10)',
              border: '0.5px solid rgba(255,107,107,0.30)',
              color: '#ff6b6b',
              boxShadow: '0 0 18px rgba(255,107,107,0.25), 0 6px 18px rgba(0,0,0,0.4)',
            },
            iconTheme: { primary: '#ff6b6b', secondary: '#081628' },
          },
          loading: {
            style: {
              background: 'rgba(77,159,255,0.10)',
              border: '0.5px solid rgba(77,159,255,0.30)',
              color: '#4d9fff',
              boxShadow: '0 0 18px rgba(77,159,255,0.25), 0 6px 18px rgba(0,0,0,0.4)',
            },
            iconTheme: { primary: '#4d9fff', secondary: '#081628' },
          },
        }}
      />
    </>
  );
}

export default App;