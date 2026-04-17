import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import {
    ShoppingCart, BarChart3, Package,
    Users, Settings, LogOut, Store,
} from 'lucide-react';

export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const initials = user?.name
        ?.split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '??';

    const links = [
        { to: '/billing', label: 'Billing', icon: ShoppingCart },
        ...(isAdmin ? [{ to: '/dashboard', label: 'Dashboard', icon: BarChart3 }] : []),
        { to: '/products', label: 'Products', icon: Package },
        ...(isAdmin ? [
            { to: '/cashiers', label: 'Cashiers', icon: Users },
            { to: '/settings', label: 'Settings', icon: Settings },
        ] : []),
    ];

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <ShoppingCart size={17} />
                </div>
                <span className="sidebar-brand-name">CamBill</span>
            </div>

            {/* Store context */}
            <div className="sidebar-store">
                <div className="sidebar-store-label">Store</div>
                <div className="sidebar-store-name">{user?.store?.name || '—'}</div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-label">Menu</div>
                {links.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={16} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name}</div>
                        <div className="sidebar-user-role">{user?.role}</div>
                    </div>
                </div>
                <button
                    id="logout-btn"
                    className="sidebar-logout"
                    onClick={() => { logout(); navigate('/login'); }}
                >
                    <LogOut size={14} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
