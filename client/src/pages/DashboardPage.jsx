import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import Receipt from '../components/Receipt';
import { TrendingUp, ShoppingBag, Receipt as ReceiptIcon, BarChart2, Eye, RefreshCw, Search } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export default function DashboardPage() {
    const [summary, setSummary] = useState(null);
    const [sales, setSales] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPag] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [search, setSearch] = useState('');
    const [chartData, setChartData] = useState({ revenueData: [], categoryData: [] });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [s, l, c] = await Promise.all([
                api.get('/sales/report/summary'),
                api.get(`/sales?page=${page}&limit=20`),
                api.get('/sales/report/chart')
            ]);
            setSummary(s.data.data);
            setSales(l.data.data);
            setPag(l.data.pagination);
            setChartData(c.data.data);
        } catch { toast.error('Failed to load dashboard'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [page]);

    const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
    const filtered = sales.filter(s =>
        s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.cashier?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const kpis = [
        { label: "Today's Revenue", value: fmt(summary?.totalRevenue), sub: 'All completed sales', color: 'stat-green', Icon: TrendingUp },
        { label: 'Transactions', value: summary?.totalSales ?? '—', sub: 'Today', color: 'stat-blue', Icon: ShoppingBag },
        { label: 'Tax Collected', value: fmt(summary?.totalTax), sub: 'Today', color: 'stat-amber', Icon: ReceiptIcon },
        { label: 'Avg. Basket', value: fmt(summary?.avgBasket), sub: 'Per transaction', color: 'stat-slate', Icon: BarChart2 },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={fetchData}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            <div className="page-body dashboard-layout">
                {/* KPI row */}
                <div className="stats-grid">
                    {kpis.map((k) => (
                        <div key={k.label} className={`stat-card ${k.color}`}>
                            <div className="stat-icon" style={{ float: 'right' }}><k.Icon size={18} /></div>
                            <div className="stat-label">{k.label}</div>
                            <div className="stat-value">{loading ? '…' : k.value}</div>
                            <div className="stat-sub">{k.sub}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="form-grid-2" style={{ marginBottom: 24, gap: 16 }}>
                    <div className="card" style={{ marginBottom: 0 }}>
                        <div className="card-header"><h2>Revenue (Last 7 Days)</h2></div>
                        <div className="card-body" style={{ height: 300, padding: '16px 16px 0 0' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData.revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={n => `₹${n}`} />
                                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: 0 }}>
                        <div className="card-header"><h2>Sales by Category</h2></div>
                        <div className="card-body" style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.categoryData}
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`₹${value}`, 'Sales']} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Sales table */}
                <div className="card">
                    <div className="card-header">
                        <h2>Recent Sales</h2>
                    </div>
                    <div className="table-search-bar">
                        <div className="input-with-icon" style={{ width: 260 }}>
                            <Search size={14} className="icon" />
                            <input id="search-sales" placeholder="Search invoice or cashier…"
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                style={{ padding: '6px 10px 6px 32px', fontSize: '0.8rem' }} />
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice</th><th>Date & Time</th><th>Cashier</th>
                                    <th>Items</th><th>Grand Total</th><th>Payment</th><th>Status</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="empty-state" style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={8}>
                                        <div className="empty-state"><ShoppingBag size={36} /><p>No sales found</p></div>
                                    </td></tr>
                                ) : filtered.map((sale) => (
                                    <tr key={sale._id}>
                                        <td className="col-mono">{sale.invoiceNumber}</td>
                                        <td className="col-muted" style={{ fontSize: '0.8rem' }}>{new Date(sale.createdAt).toLocaleString()}</td>
                                        <td>{sale.cashier?.name || '—'}</td>
                                        <td className="col-muted">{sale.items.length}</td>
                                        <td className="col-amount">{fmt(sale.grandTotal)}</td>
                                        <td><span className={`badge badge-${sale.paymentMode}`}>{sale.paymentMode}</span></td>
                                        <td><span className={`badge badge-${sale.status}`}>{sale.status}</span></td>
                                        <td>
                                            <button id={`view-sale-${sale._id}`} className="btn-icon-only"
                                                onClick={() => setSelectedSale(sale)} title="View receipt">
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <span>{pagination.total} total</span>
                            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
                            <span>Page {pagination.page} of {pagination.pages}</span>
                            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </div>
            </div>

            {selectedSale && <Receipt sale={selectedSale} onClose={() => setSelectedSale(null)} />}
        </div>
    );
}
