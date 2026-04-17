import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { ShoppingCart, BarChart3, Package, LogOut, User, Users, Settings, Store } from 'lucide-react';

export default function Navbar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const isAdmin = user?.role === 'admin';

    const links = [
        { to: '/billing', label: 'Billing', icon: <ShoppingCart size={16} /> },
        ...(isAdmin ? [
            { to: '/dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
            { to: '/cashiers', label: 'Cashiers', icon: <Users size={16} /> },
        ] : []),
        { to: '/products', label: 'Products', icon: <Package size={16} /> },
        ...(isAdmin ? [{ to: '/settings', label: 'Settings', icon: <Settings size={16} /> }] : []),
    ];

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <ShoppingCart size={22} />
                <span>CamBill</span>
            </div>

            <div className="nav-links">
                {links.map((l) => (
                    <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        {l.icon} {l.label}
                    </NavLink>
                ))}
            </div>

            <div className="nav-user">
                <div className="user-badge" title={`Store: ${user?.store?.name}`}>
                    <Store size={13} />
                    <span className="nav-store-name">{user?.store?.name}</span>
                    <span className="nav-sep">·</span>
                    <User size={13} />
                    <span>{user?.name}</span>
                    <span className={`role-pill role-${user?.role}`}>{user?.role}</span>
                </div>
                <button id="logout-btn" className="btn-icon danger-ghost" onClick={handleLogout} title="Logout">
                    <LogOut size={16} />
                </button>
            </div>
        </nav>
    );
}
