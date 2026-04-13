import { useAuth } from '@/hooks/useAuth';
import AdminDashboardPremium from '@/components/Dashboard/AdminDashboardPremium';
import EmployeeDashboard from '@/components/Dashboard/EmployeeDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'orgadmin' || user?.role === 'superadmin';

  return (
    <>
      {/* Dashboard Content */}
      {isAdmin ? <AdminDashboardPremium /> : <EmployeeDashboard />}
    </>
  );
}
