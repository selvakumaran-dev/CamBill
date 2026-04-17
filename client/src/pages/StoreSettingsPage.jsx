import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';
import { Save, Settings } from 'lucide-react';

export default function StoreSettingsPage() {
    const user = useAuthStore((s) => s.user);
    const [form, setForm] = useState({ name: '', address: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/auth/store')
            .then(({ data }) => setForm({ name: data.data.name, address: data.data.address || '', phone: data.data.phone || '' }))
            .catch(() => toast.error('Failed to load store'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try { await api.put('/auth/store', form); toast.success('Store updated'); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    return (
        <div>
            <div className="page-header">
                <h1>Store Settings</h1>
            </div>
            <div className="page-body">
                <div className="card" style={{ maxWidth: 520 }}>
                    <div className="card-header">
                        <h2><Settings size={15} /> Store Information</h2>
                    </div>
                    {loading ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>
                    ) : (
                        <form onSubmit={handleSave}>
                            <div className="card-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div className="field">
                                        <label htmlFor="ss-name">Store name <span style={{ color: 'var(--red)' }}>*</span></label>
                                        <input id="ss-name" type="text" value={form.name} onChange={f('name')} required />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="ss-addr">Address</label>
                                        <input id="ss-addr" type="text" placeholder="Street, City" value={form.address} onChange={f('address')} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="ss-phone">Phone</label>
                                        <input id="ss-phone" type="tel" placeholder="+91-XXXXXXXXXX" value={form.phone} onChange={f('phone')} />
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer">
                                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                                    {saving ? <><span className="spinner" /> Saving…</> : <><Save size={13} /> Save changes</>}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="card" style={{ maxWidth: 520, marginTop: 16, padding: '16px 20px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Account Info</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.855rem', color: 'var(--text-2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Admin Name</span><span style={{ fontWeight: 500, color: 'var(--text-1)' }}>{user?.name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Email</span><span style={{ fontWeight: 500, color: 'var(--text-1)' }}>{user?.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Role</span><span className="badge badge-blue" style={{ fontSize: '0.73rem' }}>{user?.role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
