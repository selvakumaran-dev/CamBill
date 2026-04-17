import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function ProtectedLayout() {
    const user = useAuthStore((s) => s.user);
    if (!user) return <Navigate to="/login" replace />;
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="app-main">
                <Outlet />
            </div>
            <MobileNav />
        </div>
    );
}
