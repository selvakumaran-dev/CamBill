import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/store';
import toast from 'react-hot-toast';
import { Plus, Edit2, Check, X, Search, RefreshCw, Package } from 'lucide-react';

const CATS = ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Produce', 'Meat', 'Frozen', 'Household', 'Personal Care', 'Other'];
const EMPTY = { barcode: '', name: '', price: '', stock: '', category: 'Other', unit: 'pcs', taxRate: 0, imageUrl: '' };

export default function ProductsPage() {
    const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [draft, setDraft] = useState(EMPTY);
    const [showForm, setShowForm] = useState(false);
    const [catFilter, setCatFilter] = useState('');
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const q = catFilter ? `?category=${catFilter}` : '';
            const { data } = await api.get(`/products${q}`);
            setProducts(data.data);
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [catFilter]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', draft);
            toast.success('Product created');
            setDraft(EMPTY); setShowForm(false); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleSave = async (id) => {
        try {
            await api.put(`/products/${id}`, draft);
            toast.success('Updated'); setEditId(null); load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const d = (k) => (e) => setDraft((p) => ({ ...p, [k]: e.target.value }));
    const fmt = (n) => `₹${Number(n).toFixed(2)}`;

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
    );

    return (
        <div>
            <div className="page-header">
                <h1>Products</h1>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /></button>
                    {isAdmin && (
                        <button id="new-product-btn" className="btn btn-primary btn-sm"
                            onClick={() => { setShowForm(!showForm); setEditId(null); setDraft(EMPTY); }}>
                            <Plus size={13} /> {showForm ? 'Cancel' : 'Add product'}
                        </button>
                    )}
                </div>
            </div>

            <div className="page-body products-layout">
                {/* Inline create form */}
                {showForm && isAdmin && (
                    <div className="card">
                        <div className="card-header"><h2>New Product</h2></div>
                        <form onSubmit={handleCreate}>
                            <div className="card-body">
                                <div className="form-grid-3" style={{ marginBottom: 12 }}>
                                    {[['Barcode', 'barcode', 'text', true], ['Product Name', 'name', 'text', true], ['Price (₹)', 'price', 'number', true],
                                    ['Stock', 'stock', 'number', true], ['Unit', 'unit', 'text', false]].map(([lbl, key, type, req]) => (
                                        <div key={key} className="field">
                                            <label>{lbl}{req && <span style={{ color: 'var(--red)' }}> *</span>}</label>
                                            <input type={type} value={draft[key]} onChange={d(key)} required={req}
                                                placeholder={lbl} />
                                        </div>
                                    ))}
                                    <div className="field">
                                        <label>Category</label>
                                        <select value={draft.category} onChange={d('category')}>
                                            {CATS.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="field">
                                        <label>Tax Rate (%)</label>
                                        <input type="number" value={draft.taxRate} onChange={d('taxRate')} min={0} max={100} />
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer" style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="btn btn-primary btn-sm"><Check size={13} /> Save product</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}><X size={13} /> Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                <div className="card">
                    <div className="table-search-bar">
                        <div className="products-toolbar" style={{ flex: 1 }}>
                            <div className="input-with-icon search-wrap">
                                <Search size={14} className="icon" />
                                <input placeholder="Search products or barcodes…" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ padding: '6px 10px 6px 32px', fontSize: '0.8rem' }} />
                            </div>
                            <select className="input" style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '0.8rem' }}
                                value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                                <option value="">All categories</option>
                                {CATS.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Barcode</th><th>Name</th><th>Category</th>
                                    <th>Price</th><th>Stock</th><th>Tax</th>
                                    {isAdmin && <th style={{ width: 80 }}></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Loading…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7}>
                                        <div className="empty-state"><Package size={36} /><p>No products found</p></div>
                                    </td></tr>
                                ) : filtered.map((p) => (
                                    <tr key={p._id} className={p.stock === 0 ? 'row-warn' : ''}>
                                        {editId === p._id ? (
                                            <>
                                                <td><input value={draft.barcode} onChange={d('barcode')} style={{ width: 130 }} /></td>
                                                <td><input value={draft.name} onChange={d('name')} /></td>
                                                <td><select value={draft.category} onChange={d('category')} style={{ width: 110 }}>
                                                    {CATS.map(c => <option key={c}>{c}</option>)}</select></td>
                                                <td><input type="number" value={draft.price} onChange={d('price')} style={{ width: 80 }} /></td>
                                                <td><input type="number" value={draft.stock} onChange={d('stock')} style={{ width: 70 }} /></td>
                                                <td><input type="number" value={draft.taxRate} onChange={d('taxRate')} style={{ width: 55 }} /></td>
                                                <td style={{ display: 'flex', gap: 4, padding: '8px 14px' }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleSave(p._id)}><Check size={12} /></button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}><X size={12} /></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="col-mono">{p.barcode}</td>
                                                <td style={{ fontWeight: 500 }}>{p.name}</td>
                                                <td><span className="badge badge-gray">{p.category}</span></td>
                                                <td className="col-amount">{fmt(p.price)}</td>
                                                <td>
                                                    <span style={{ color: p.stock === 0 ? 'var(--red)' : p.stock < 10 ? 'var(--amber)' : 'var(--text-1)', fontWeight: p.stock < 10 ? 600 : 400 }}>
                                                        {p.stock} {p.stock === 0 && <span style={{ fontSize: '0.73rem' }}>(Out of stock)</span>}
                                                    </span>
                                                </td>
                                                <td className="col-muted">{p.taxRate}%</td>
                                                {isAdmin && (
                                                    <td>
                                                        <button id={`edit-${p._id}`} className="btn btn-secondary btn-sm"
                                                            onClick={() => { setEditId(p._id); setDraft({ barcode: p.barcode, name: p.name, price: p.price, stock: p.stock, category: p.category, unit: p.unit, taxRate: p.taxRate }); setShowForm(false); }}>
                                                            <Edit2 size={12} /> Edit
                                                        </button>
                                                    </td>
                                                )}
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
