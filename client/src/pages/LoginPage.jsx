import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success(`Welcome back, ${user.name}`);
            navigate('/billing');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-layout">
            {/* Left panel */}
            <div className="auth-left">
                <div className="auth-left-brand">
                    <div className="auth-left-brand-icon">
                        <ShoppingCart size={18} color="#fff" />
                    </div>
                    <span className="auth-left-brand-name">CamBill</span>
                </div>
                <div className="auth-left-tagline">
                    <h2>The billing platform built for modern retail</h2>
                    <p>Scan barcodes, process payments, and manage your store inventory — all from one place.</p>
                    <div className="auth-left-features">
                        {['Real-time barcode scanning', 'Multi-store support', 'Thermal receipt printing', 'Sales analytics'].map((f) => (
                            <div key={f} className="auth-feature">
                                <div className="auth-feature-dot" />
                                <span className="auth-feature-text">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="auth-right">
                <div className="auth-form-wrap">
                    <h1>Sign in to your account</h1>
                    <p className="subtitle">Enter your credentials to continue</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="email">Email address</label>
                            <div className="input-with-icon">
                                <Mail size={15} className="icon" />
                                <input id="email" type="email" placeholder="you@yourstore.com"
                                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required autoComplete="email" />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <Lock size={15} className="icon" />
                                <input id="password" type={showPw ? 'text' : 'password'}
                                    placeholder="Your password"
                                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required autoComplete="current-password" />
                                <button type="button" className="pw-toggle-btn icon-right" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}
                            style={{ marginTop: 4 }}>
                            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        New supermarket? <Link to="/register">Register your store →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
