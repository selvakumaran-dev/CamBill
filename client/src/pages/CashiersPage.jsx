import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { UserPlus, Users, Eye, EyeOff } from 'lucide-react';

export default function CashiersPage() {
    const [cashiers, setCashiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try { const { data } = await api.get('/auth/cashiers'); setCashiers(data.data); }
        catch { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await api.post('/auth/cashiers', form);
            toast.success(`Cashier "${form.name}" created`);
            setForm({ name: '', email: '', password: '' }); setShowForm(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (id, active) => {
        try {
            await api.patch(`/auth/cashiers/${id}/toggle`);
            toast.success(active ? 'Cashier deactivated' : 'Cashier activated'); load();
        } catch { toast.error('Failed'); }
    };

    const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    return (
        <div>
            <div className="page-header">
                <h1>Cashiers</h1>
                <button id="new-cashier-btn" className="btn btn-primary btn-sm"
                    onClick={() => setShowForm(!showForm)}>
                    <UserPlus size={13} /> {showForm ? 'Cancel' : 'Add cashier'}
                </button>
            </div>

            <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {showForm && (
                    <div className="card">
                        <div className="card-header"><h2>New Cashier</h2></div>
                        <form onSubmit={handleCreate}>
                            <div className="card-body">
                                <div className="form-grid-3">
                                    <div className="field">
                                        <label htmlFor="c-name">Full name <span style={{ color: 'var(--red)' }}>*</span></label>
                                        <input id="c-name" type="text" placeholder="Cashier name"
                                            value={form.name} onChange={f('name')} required />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="c-email">Email <span style={{ color: 'var(--red)' }}>*</span></label>
                                        <input id="c-email" type="email" placeholder="cashier@store.com"
                                            value={form.email} onChange={f('email')} required />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="c-pw">Password <span style={{ color: 'var(--red)' }}>*</span></label>
                                        <div className="input-with-icon">
                                            <input id="c-pw" type={showPw ? 'text' : 'password'}
                                                placeholder="Min 6 characters"
                                                value={form.password} onChange={f('password')} required minLength={6} />
                                            <button type="button" className="pw-toggle-btn icon-right" onClick={() => setShowPw(!showPw)}>
                                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer" style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                    {saving ? <><span className="spinner" /> Creating…</> : <><UserPlus size={13} /> Create cashier</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card">
                    <div className="card-header"><h2><Users size={15} /> Your Cashiers</h2></div>
                    {loading ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>
                    ) : cashiers.length === 0 ? (
                        <div className="empty-state"><Users size={36} /><p>No cashiers yet. Add your first cashier above.</p></div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead><tr>
                                    <th>Name</th><th>Email</th><th>Joined</th><th>Status</th><th></th>
                                </tr></thead>
                                <tbody>
                                    {cashiers.map((c) => (
                                        <tr key={c._id}>
                                            <td style={{ fontWeight: 500 }}>{c.name}</td>
                                            <td className="col-mono">{c.email}</td>
                                            <td className="col-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                                            <td><span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>
                                                {c.isActive ? 'Active' : 'Inactive'}
                                            </span></td>
                                            <td>
                                                <button id={`toggle-cashier-${c._id}`}
                                                    className={`btn btn-sm ${c.isActive ? 'btn-danger' : 'btn-secondary'}`}
                                                    onClick={() => handleToggle(c._id, c.isActive)}>
                                                    {c.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
