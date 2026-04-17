import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        storeName: '', storeAddress: '', storePhone: '',
    });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const register = useAuthStore((s) => s.register);
    const navigate = useNavigate();
    const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
        setLoading(true);
        try {
            const user = await register({
                name: form.name, email: form.email, password: form.password,
                storeName: form.storeName, storeAddress: form.storeAddress, storePhone: form.storePhone,
            });
            toast.success(`Store "${user.store.name}" created successfully`);
            navigate('/billing');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="auth-left-brand">
                    <div className="auth-left-brand-icon"><ShoppingCart size={18} color="#fff" /></div>
                    <span className="auth-left-brand-name">CamBill</span>
                </div>
                <div className="auth-left-tagline">
                    <h2>Set up your supermarket in minutes</h2>
                    <p>Create your store account, add products with barcodes, and start billing customers — zero configuration needed.</p>
                    <div className="auth-left-features">
                        {['One account per store', 'Add unlimited products', 'Create cashier accounts', 'Full sales history'].map((f) => (
                            <div key={f} className="auth-feature">
                                <div className="auth-feature-dot" />
                                <span className="auth-feature-text">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-form-wrap" style={{ maxWidth: 440 }}>
                    <h1>Create your store</h1>
                    <p className="subtitle">Set up your supermarket and admin account</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="auth-section-title">Store information</div>

                        <div className="field">
                            <label htmlFor="storeName">Store name <span style={{ color: 'var(--red)' }}>*</span></label>
                            <input id="storeName" type="text" placeholder="e.g. FreshMart Supermarket"
                                value={form.storeName} onChange={f('storeName')} required />
                        </div>

                        <div className="form-grid-2">
                            <div className="field">
                                <label htmlFor="storeAddr">Address</label>
                                <input id="storeAddr" type="text" placeholder="Street, City"
                                    value={form.storeAddress} onChange={f('storeAddress')} />
                            </div>
                            <div className="field">
                                <label htmlFor="storePhone">Phone</label>
                                <input id="storePhone" type="tel" placeholder="+91-XXXXXXXXXX"
                                    value={form.storePhone} onChange={f('storePhone')} />
                            </div>
                        </div>

                        <div className="auth-section-title">Admin account</div>

                        <div className="field">
                            <label htmlFor="reg-name">Full name <span style={{ color: 'var(--red)' }}>*</span></label>
                            <input id="reg-name" type="text" placeholder="Your full name"
                                value={form.name} onChange={f('name')} required />
                        </div>

                        <div className="field">
                            <label htmlFor="reg-email">Email <span style={{ color: 'var(--red)' }}>*</span></label>
                            <input id="reg-email" type="email" placeholder="admin@yourstore.com"
                                value={form.email} onChange={f('email')} required autoComplete="email" />
                        </div>

                        <div className="form-grid-2">
                            <div className="field">
                                <label htmlFor="reg-pw">Password <span style={{ color: 'var(--red)' }}>*</span></label>
                                <div className="input-with-icon">
                                    <input id="reg-pw" type={showPw ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={form.password} onChange={f('password')} required minLength={6} />
                                    <button type="button" className="pw-toggle-btn icon-right" onClick={() => setShowPw(!showPw)}>
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div className="field">
                                <label htmlFor="reg-pw2">Confirm password <span style={{ color: 'var(--red)' }}>*</span></label>
                                <input id="reg-pw2" type={showPw ? 'text' : 'password'}
                                    placeholder="Repeat password"
                                    value={form.confirmPassword} onChange={f('confirmPassword')} required />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? <><span className="spinner" /> Creating store…</> : 'Create store & account'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already registered? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
