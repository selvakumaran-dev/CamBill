import { useState, useCallback, useEffect } from 'react';
import { useCartStore } from '../store/store';
import BarcodeScanner from '../components/BarcodeScanner';
import Receipt from '../components/Receipt';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { syncProductsToIdb, getProductOffline, recordOfflineSale, syncOfflineSales } from '../lib/offlineSync';
import {
    Camera, CameraOff, Trash2, Plus, Minus,
    ShoppingCart, CreditCard, Banknote, Smartphone, CheckCircle2, Search, PauseCircle, PlayCircle, X, WifiOff
} from 'lucide-react';

export default function BillingPage() {
    const { items, addItem, removeItem, updateQty, clearCart, canAddBarcode, holdCart, resumeCart, heldCarts, deleteHeldCart } = useCartStore();
    const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const taxTotal = items.reduce((s, i) => s + i.product.price * i.quantity * (i.product.taxRate / 100), 0);
    const grandTotal = subtotal + taxTotal;

    const [scannerOn, setScannerOn] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [completedSale, setCompletedSale] = useState(null);
    const [paymentMode, setPaymentMode] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [manualBarcode, setManualBarcode] = useState('');

    // UI states for new features
    const [showHeldModal, setShowHeldModal] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        // Sync products to offline indexedDB
        syncProductsToIdb();

        // Listen to network status
        const handleOnline = async () => {
            setIsOffline(false);
            const count = await syncOfflineSales();
            if (count > 0) toast.success(`Synced ${count} offline sales to server!`);
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleScan = useCallback(async (barcode) => {
        if (!canAddBarcode(barcode)) {
            toast.error('Duplicate scan', { id: 'dup', duration: 1000 });
            return;
        }
        const t = toast.loading(`Looking up ${barcode}…`);
        try {
            const { data } = await api.get(`/products/barcode/${barcode}`);
            addItem(data.data);
            toast.success(`Added: ${data.data.name}`, { id: t });
        } catch (err) {
            // Attempt offline lookup if network failed or product missing
            if (err.message === 'Network Error' || isOffline) {
                try {
                    const localProduct = await getProductOffline(barcode);
                    addItem(localProduct);
                    toast.success(`[Offline] Added: ${localProduct.name}`, { id: t });
                    return;
                } catch (offlineErr) { }
            }
            toast.error(err.response?.data?.message || 'Product not found', { id: t });
        }
    }, [canAddBarcode, addItem, isOffline]);

    const handleManual = (e) => {
        e.preventDefault();
        if (manualBarcode.trim()) { handleScan(manualBarcode.trim()); setManualBarcode(''); }
    };

    const handleCheckout = async () => {
        if (!items.length) { toast.error('Cart is empty'); return; }
        setProcessing(true);
        const payload = {
            items: items.map(({ product, quantity }) => ({ barcode: product.barcode, quantity, name: product.name, price: product.price, lineTotal: product.price * quantity })),
            paymentMode,
            amountPaid: parseFloat(amountPaid) || grandTotal,
            discount: 0,
        };

        try {
            const { data } = await api.post('/sales', payload);
            setCompletedSale(data.data);
            clearCart(); setAmountPaid('');
            toast.success(`Sale ${data.data.invoiceNumber} completed`);
        } catch (err) {
            if (err.message === 'Network Error' || isOffline) {
                // Feature 7: Offline Sale
                const offlineSale = await recordOfflineSale(payload);
                setCompletedSale(offlineSale);
                clearCart(); setAmountPaid('');
                toast.success('Offline Sale Recorded. Will sync when online.');
            } else {
                toast.error(err.response?.data?.message || 'Checkout failed');
            }
        } finally { setProcessing(false); }
    };

    const change = paymentMode === 'cash' && amountPaid ? Math.max(0, parseFloat(amountPaid) - grandTotal) : 0;
    const fmt = (n) => `₹${Number(n).toFixed(2)}`;

    return (
        <div>
            <div className="page-header">
                <h1>Billing {isOffline && <span className="badge badge-red"><WifiOff size={12} style={{ marginRight: 4 }} />Offline Mode</span>}</h1>
                <div className="page-header-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowHeldModal(true)}>
                        <PauseCircle size={13} /> Held ({heldCarts.length})
                    </button>
                    {items.length > 0 && (
                        <>
                            <button className="btn btn-secondary btn-sm" onClick={() => { holdCart(); toast.success('Cart put on hold'); }}>
                                <PauseCircle size={13} /> Hold Bill
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={clearCart}>
                                <Trash2 size={13} /> Clear
                            </button>
                        </>
                    )}
                    <button id="toggle-scanner" className={`btn btn-sm ${scannerOn ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => setScannerOn(!scannerOn)}>
                        {scannerOn ? <><CameraOff size={13} /> Stop</> : <><Camera size={13} /> Scan</>}
                    </button>
                </div>
            </div>

            <div className="page-body">
                <div className="billing-layout">
                    {/* Left */}
                    <div className="billing-left">
                        {/* Scanner card */}
                        <div className="card scanner-card">
                            <div className="card-header">
                                <h2><Camera size={15} /> Barcode Scanner</h2>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>EAN-13 · UPC-A · QR Code</span>
                            </div>
                            <BarcodeScanner onScan={handleScan} isActive={scannerOn} />
                            <form className="manual-entry-bar" onSubmit={handleManual}>
                                <div className="input-with-icon" style={{ flex: 1 }}>
                                    <Search size={14} className="icon" />
                                    <input id="manual-barcode" type="text" placeholder="Enter barcode manually…"
                                        value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)}
                                        inputMode="numeric" />
                                </div>
                                <button type="submit" className="btn btn-secondary btn-sm">Add</button>
                            </form>
                        </div>

                        {/* Cart */}
                        <div className="card">
                            <div className="card-header">
                                <h2><ShoppingCart size={15} /> Cart
                                    {items.length > 0 && (
                                        <span style={{ marginLeft: 6, fontSize: '0.76rem', color: 'var(--text-3)', fontWeight: 400 }}>
                                            {items.reduce((s, i) => s + i.quantity, 0)} items
                                        </span>
                                    )}
                                </h2>
                            </div>

                            {items.length === 0 ? (
                                <div className="cart-empty">
                                    <ShoppingCart size={40} />
                                    <p>Scan or search for items to add them to the cart</p>
                                </div>
                            ) : (
                                <div className="cart-list">
                                    {items.map(({ product, quantity }) => (
                                        <div key={product._id} className="cart-item">
                                            <div className="cart-item-info">
                                                <div className="cart-item-name">{product.name}</div>
                                                <div className="cart-item-meta">{fmt(product.price)} each · {product.category}</div>
                                            </div>
                                            <div className="cart-qty-ctrl">
                                                <button id={`dec-${product._id}`} className="qty-btn"
                                                    onClick={() => updateQty(product._id, quantity - 1)}><Minus size={11} /></button>
                                                <span className="qty-value">{quantity}</span>
                                                <button id={`inc-${product._id}`} className="qty-btn"
                                                    onClick={() => updateQty(product._id, quantity + 1)}><Plus size={11} /></button>
                                            </div>
                                            <span className="cart-item-total">{fmt(product.price * quantity)}</span>
                                            <button id={`rm-${product._id}`} className="btn-icon-only"
                                                onClick={() => removeItem(product._id)}><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right — Order Summary */}
                    <div className="billing-right">
                        <div className="card">
                            <div className="card-header"><h2>Order Summary</h2></div>
                            <div className="card-body order-summary">
                                <div className="summary-row"><span>Subtotal</span><span className="mono">{fmt(subtotal)}</span></div>
                                <div className="summary-row"><span>Tax</span><span className="mono">{fmt(taxTotal)}</span></div>
                                <div className="summary-row summary-total">
                                    <span>Total</span>
                                    <span className="amount">{fmt(grandTotal)}</span>
                                </div>
                            </div>

                            <div className="card-body" style={{ paddingTop: 0 }}>
                                {/* Payment mode */}
                                <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Payment method</div>
                                <div className="pay-mode-group">
                                    {[{ id: 'cash', label: 'Cash', Icon: Banknote }, { id: 'card', label: 'Card', Icon: CreditCard }, { id: 'upi', label: 'UPI', Icon: Smartphone }].map(({ id, label, Icon }) => (
                                        <button key={id} id={`pay-${id}`}
                                            className={`pay-mode-btn ${paymentMode === id ? 'active' : ''}`}
                                            onClick={() => setPaymentMode(id)}>
                                            <Icon size={14} />{label}
                                        </button>
                                    ))}
                                </div>

                                {paymentMode === 'cash' && (
                                    <div className="field" style={{ marginBottom: var_s3 }}>
                                        <label htmlFor="amount-paid">Amount received (₹)</label>
                                        <input id="amount-paid" type="number" min={grandTotal} step="1"
                                            placeholder={grandTotal.toFixed(2)}
                                            value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                                    </div>
                                )}

                                {change > 0 && (
                                    <div className="change-display">
                                        <span>Change to return</span>
                                        <span className="mono" style={{ fontWeight: 700 }}>{fmt(change)}</span>
                                    </div>
                                )}

                                <button id="checkout-btn" className="btn btn-primary btn-full"
                                    onClick={handleCheckout} disabled={processing || !items.length}
                                    style={{ marginTop: 12 }}>
                                    {processing
                                        ? <><span className="spinner" /> Processing…</>
                                        : <><CheckCircle2 size={15} /> Complete sale</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Held Carts Modal */}
            {showHeldModal && (
                <div className="modal-backdrop" onClick={() => setShowHeldModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>Bills on Hold ({heldCarts.length})</h3>
                            <button className="btn-icon-only" onClick={() => setShowHeldModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            {heldCarts.length === 0 ? (
                                <div className="empty-state">
                                    <p>No bills currently on hold</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {heldCarts.map(cart => (
                                        <div key={cart.id} className="card" style={{ marginBottom: 0, padding: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-1)' }}>{cart.note}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                                                        {cart.items.reduce((s, i) => s + i.quantity, 0)} items · {new Date(cart.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => deleteHeldCart(cart.id)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                    <button className="btn btn-primary btn-sm" onClick={() => { resumeCart(cart.id); setShowHeldModal(false); }}>
                                                        <PlayCircle size={13} /> Resume
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {completedSale && (
                <Receipt sale={completedSale} onClose={() => setCompletedSale(null)} />
            )}
        </div>
    );
}

const var_s3 = '8px';
