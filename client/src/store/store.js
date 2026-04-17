import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import api from '../lib/api';

const getStoredUser = () => {
    try {
        const val = localStorage.getItem('cambill_user');
        return val && val !== 'undefined' ? JSON.parse(val) : null;
    } catch {
        return null;
    }
};

/* ─── Auth Store ─────────────────────────────────────────────── */
export const useAuthStore = create((set) => ({
    user: getStoredUser(),
    token: localStorage.getItem('cambill_token') || null,

    login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('cambill_token', data.token);
        localStorage.setItem('cambill_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token });
        return data.user;
    },

    register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        localStorage.setItem('cambill_token', data.token);
        localStorage.setItem('cambill_user', JSON.stringify(data.user));
        set({ user: data.user, token: data.token });
        return data.user;
    },

    logout: () => {
        localStorage.removeItem('cambill_token');
        localStorage.removeItem('cambill_user');
        set({ user: null, token: null });
    },
}));

/* ─── Cart Store ─────────────────────────────────────────────── */
export const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
    lastScannedBarcode: null,
    scanTimestamps: {},
    heldCarts: [],

    canAddBarcode: (barcode) => {
        const now = Date.now();
        const { scanTimestamps } = get();
        const timestamps = (scanTimestamps[barcode] || []).filter((t) => now - t < 1500);
        if (timestamps.length >= 5) return false;
        set({ scanTimestamps: { ...scanTimestamps, [barcode]: [...timestamps, now] } });
        return true;
    },

    addItem: (product) => {
        set((state) => {
            const existing = state.items.find((i) => i.product._id === product._id);
            if (existing) {
                if (existing.quantity + 1 > product.stock) {
                    toast.error(`Stock limited to ${product.stock} for ${product.name}`);
                    return state;
                }
                return {
                    items: state.items.map((i) =>
                        i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
                    ),
                    lastScannedBarcode: product.barcode,
                };
            }
            if (product.stock < 1) {
                 toast.error(`${product.name} is out of stock`);
                 return state;
            }
            return {
                items: [...state.items, { product, quantity: 1 }],
                lastScannedBarcode: product.barcode,
            };
        });
    },

    removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product._id !== productId) })),

    updateQty: (productId, qty) =>
        set((state) => {
            const existing = state.items.find((i) => i.product._id === productId);
            if (!existing) return state;
            const newQty = Math.min(qty, existing.product.stock);
            if (qty > existing.product.stock) toast.error(`Stock limited to ${existing.product.stock}`);

            return {
                items: newQty < 1
                    ? state.items.filter((i) => i.product._id !== productId)
                    : state.items.map((i) => i.product._id === productId ? { ...i, quantity: newQty } : i),
            };
        }),

    clearCart: () => set({ items: [], lastScannedBarcode: null, scanTimestamps: {} }),

    holdCart: (note) => {
        const state = get();
        if (state.items.length === 0) return;
        const newCart = {
            id: Date.now().toString(),
            note: note || `Cart ${state.heldCarts.length + 1}`,
            items: [...state.items],
            timestamp: new Date().toISOString()
        };
        set({ heldCarts: [...state.heldCarts, newCart], items: [] });
    },

    resumeCart: (id) => {
        const state = get();
        const cart = state.heldCarts.find((c) => c.id === id);
        if (!cart) return;
        set({
            items: cart.items,
            heldCarts: state.heldCarts.filter((c) => c.id !== id)
        });
    },

    deleteHeldCart: (id) => {
        set((state) => ({ heldCarts: state.heldCarts.filter((c) => c.id !== id) }));
    },

    get subtotal() { return get().items.reduce((s, i) => s + i.product.price * i.quantity, 0); },
    get taxTotal() { return get().items.reduce((s, i) => s + i.product.price * i.quantity * ((i.product.taxRate || 0) / 100), 0); },
    get grandTotal() { return get().subtotal + get().taxTotal; },
    get itemCount() { return get().items.reduce((s, i) => s + i.quantity, 0); },
        }),
        {
            name: 'cambill_cart_state',
            partialize: (state) => ({ items: state.items, heldCarts: state.heldCarts })
        }
    )
);
