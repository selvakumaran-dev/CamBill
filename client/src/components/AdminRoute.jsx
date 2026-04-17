import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/store';

/**
 * Restricts child routes to admin role only.
 * Cashiers are redirected to /billing.
 */
export default function AdminRoute() {
    const user = useAuthStore((s) => s.user);
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/billing" replace />;
    return <Outlet />;
}
