import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import {
    ShoppingCart, BarChart3, Package, Users
} from 'lucide-react';

export default function MobileNav() {
    const user = useAuthStore((s) => s.user);
    const isAdmin = user?.role === 'admin';

    const links = [
        { to: '/billing', label: 'Billing', icon: ShoppingCart },
        ...(isAdmin ? [{ to: '/dashboard', label: 'Dash', icon: BarChart3 }] : []),
        { to: '/products', label: 'Items', icon: Package },
        ...(isAdmin ? [{ to: '/cashiers', label: 'Staff', icon: Users }] : []),
    ];

    return (
        <nav className="mobile-nav">
            {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                >
                    <Icon size={20} />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
