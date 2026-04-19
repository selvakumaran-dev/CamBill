import { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import { Printer, Download, X } from 'lucide-react';
import { useAuthStore } from '../store/store';

export default function Receipt({ sale, onClose }) {
    const receiptRef = useRef(null);
    const store = useAuthStore((s) => s.user?.store);

    const handlePrint = useReactToPrint({
        content: () => receiptRef.current,
        documentTitle: `${store?.name || 'CamBill'}-${sale?.invoiceNumber}`,
        pageStyle: `@page { size: 80mm auto; margin: 0; }`,
    });

    useEffect(() => {
        if (sale && (sale.paymentMode === 'upi' || sale.paymentMode === 'card')) {
            // Slight delay ensures the DOM is fully painted before capturing the thermal receipt layout
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [sale, handlePrint]);

    const handlePDF = () => {
        const estHeight = 85 + (sale.items.length * 10) + 40; 
        const doc = new jsPDF({ unit: 'mm', format: [80, Math.max(150, estHeight)], orientation: 'portrait' });
        let y = 8; const lh = 4.5;
        const c = (t, fs = 10, bold = false) => {
            doc.setFontSize(fs); doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.text(t, 40, y, { align: 'center' }); y += lh;
        };
        const row = (l, r, fs = 9) => {
            doc.setFontSize(fs); doc.setFont('helvetica', 'normal');
            doc.text(l, 3, y); if (r) doc.text(r, 77, y, { align: 'right' }); y += lh;
        };
        const line = () => { doc.setDrawColor(180); doc.line(3, y, 77, y); y += 2; };

        // Header
        c((store?.name || 'SUPERMARKET').toUpperCase(), 13, true);
        if (store?.address) c(store.address, 8);
        if (store?.phone) c(`Ph: ${store.phone}`, 8);
        c('GSTIN: 22AAAAA0000A1Z5', 7); // Placeholder for enterprise realism

        y += 2; line();
        doc.setFontSize(8);
        row(`Invoice: ${sale.invoiceNumber}`);
        row(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
        row(`Cashier: ${sale.cashier?.name || 'Staff'}`);
        y += 1; line();

        // Items
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); row('Item', 'Total'); doc.setFont('helvetica', 'normal');
        line();
        sale.items.forEach(i => {
            row(i.name.substring(0, 30), `₹${i.lineTotal.toFixed(2)}`, 8);
            row(`  ${i.quantity} × ₹${i.price.toFixed(2)}`, '', 7.5);
        });
        line();

        // Totals
        row('Subtotal', `₹${sale.subtotal.toFixed(2)}`);
        if (sale.taxTotal > 0) row('SGST / CGST', `₹${sale.taxTotal.toFixed(2)}`);
        if (sale.discount > 0) row('Discount', `-₹${sale.discount.toFixed(2)}`);
        y += 1; line();
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        row('GRAND TOTAL', `₹${sale.grandTotal.toFixed(2)}`);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
        row(`Paid (${sale.paymentMode.toUpperCase()})`, `₹${(sale.amountPaid || 0).toFixed(2)}`);
        if (sale.change > 0) row('Change Tendered', `₹${sale.change.toFixed(2)}`);

        // Footer
        y += 4; line();
        c('Thank you, Visit Again!', 9, true);
        c('Items once sold cannot be returned', 7);
        doc.save(`Invoice-${sale.invoiceNumber}.pdf`);
    };

    if (!sale) return null;
    const fmt = (n) => `₹${Number(n).toFixed(2)}`;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Receipt — {sale.invoiceNumber}</h3>
                    <div className="modal-actions">
                        <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
                            <Printer size={13} /> Print
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handlePDF}>
                            <Download size={13} /> PDF
                        </button>
                        <button className="btn-icon-only" onClick={onClose}><X size={16} /></button>
                    </div>
                </div>

                <div className="modal-body">
                    {/* The 80mm generic thermal receipt rendering */}
                    <div ref={receiptRef} className="thermal-receipt">
                        <div className="r-header">
                            <div className="r-store">{store?.name || 'SUPERMARKET'}</div>
                            {store?.address && <div className="r-addr">{store.address}</div>}
                            {store?.phone && <div className="r-addr">Ph: {store.phone}</div>}
                            <div className="r-addr">GSTIN: 22AAAAA0000A1Z5</div>
                        </div>

                        <hr className="r-rule-s" style={{ marginTop: 6, marginBottom: 6 }} />

                        <div className="r-meta">
                            <p><span>Invoice:</span><span>{sale.invoiceNumber}</span></p>
                            <p><span>Date:</span><span>{new Date(sale.createdAt).toLocaleString()}</span></p>
                            <p><span>Cashier:</span><span>{sale.cashier?.name || 'Staff'}</span></p>
                        </div>

                        <hr className="r-rule-d" />

                        <table className="r-items">
                            <thead>
                                <tr><th>S.No</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, i) => (
                                    <tr key={i}>
                                        <td style={{ textAlign: 'left', width: '20px' }}>{i + 1}</td>
                                        <td>{item.name}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'center' }}>{fmt(item.price)}</td>
                                        <td style={{ textAlign: 'right' }}>{fmt(item.lineTotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <hr className="r-rule-d" />

                        <div className="r-totals">
                            <p><span>Subtotal</span><span>{fmt(sale.subtotal)}</span></p>
                            {sale.taxTotal > 0 && <p><span>SGST / CGST</span><span>{fmt(sale.taxTotal)}</span></p>}
                            {sale.discount > 0 && <p><span>Discount</span><span>-{fmt(sale.discount)}</span></p>}
                            <p className="r-grand" style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '4px 0', margin: '4px 0' }}>
                                <span>GRAND TOTAL</span><span>{fmt(sale.grandTotal)}</span>
                            </p>
                            <p><span>Paid ({sale.paymentMode.toUpperCase()})</span><span>{fmt(sale.amountPaid)}</span></p>
                            {sale.change > 0 && <p><span>Change Tendered</span><span>{fmt(sale.change)}</span></p>}
                        </div>

                        <hr className="r-rule-s" style={{ marginTop: 12, marginBottom: 12 }} />
                        <div className="r-footer" style={{ fontWeight: 600 }}>Thank you, Visit Again!</div>
                        <div className="r-footer" style={{ fontSize: '0.65rem' }}>Items once sold cannot be returned without original bill</div>

                        {/* CSS Barcode effect */}
                        <div className="r-barcode-wrap" style={{ textAlign: 'center', marginTop: 16 }}>
                            <div style={{ fontFamily: 'Libre Barcode 39, monospace', fontSize: '28px', color: '#000', letterSpacing: '-1px' }}>
                                *{sale.invoiceNumber}*
                            </div>
                            <div style={{ fontSize: '0.65rem', marginTop: 2, letterSpacing: '2px' }}>{sale.invoiceNumber}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
