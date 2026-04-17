import { get, set } from 'idb-keyval';
import api from './api';

// Sync products into indexedDB for offline lookup
export const syncProductsToIdb = async () => {
    try {
        const { data } = await api.get('/products');
        await set('cambill_products', data.data);
    } catch (err) {
        console.warn('Could not sync products to IDB', err);
    }
};

// Lookup product offline
export const getProductOffline = async (barcode) => {
    const products = await get('cambill_products') || [];
    const product = products.find(p => p.barcode === barcode || p.barcode === Number(barcode));
    if (!product) throw new Error('Offline: Product not found');
    return product;
};

// Record an offline sale
export const recordOfflineSale = async (salePayload) => {
    const queue = await get('cambill_pending_sales') || [];
    salePayload._offlineId = Date.now().toString();
    salePayload.createdAt = new Date().toISOString();

    // Simulate what the backend returns so UI can show a receipt
    const mockSaleResponse = {
        ...salePayload,
        invoiceNumber: `OFF-${salePayload._offlineId.slice(-6)}`,
        status: 'completed',
        subtotal: salePayload.amountPaid, // Approximate for receipt
        grandTotal: salePayload.amountPaid,
        taxTotal: 0
    };

    queue.push(mockSaleResponse);
    await set('cambill_pending_sales', queue);
    return mockSaleResponse;
};

// Sync offline sales to backend when internet returns
export const syncOfflineSales = async () => {
    let queue = await get('cambill_pending_sales') || [];
    if (queue.length === 0) return 0;

    let successCount = 0;
    const remainingQueue = [];

    for (const sale of queue) {
        try {
            // Re-map it to strictly what the backend needs
            const payload = {
                items: sale.items,
                paymentMode: sale.paymentMode,
                amountPaid: sale.amountPaid,
                discount: sale.discount,
                offlineId: sale._offlineId
            };
            await api.post('/sales', payload);
            successCount++;
        } catch (err) {
            console.error('Failed to sync sale', err);
            // Drop permanently failing backend validations (400-499) to prevent infinite loops
            if (err.response && err.response.status >= 400 && err.response.status < 500) {
                console.warn('Discarding offline sale due to permanent structural error (e.g. out of stock)', sale);
            } else {
                remainingQueue.push(sale);
            }
        }
    }

    await set('cambill_pending_sales', remainingQueue);
    return successCount;
};
