# CamBill — Enterprise Supermarket Billing System

> Camera-powered, enterprise-grade MERN stack billing platform with real-time barcode scanning, atomic transactions, and thermal receipt printing.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm 9+

### 1. Configure environment
Edit `.env` in the root:
```
MONGO_URI=mongodb://localhost:27017/cambill
JWT_SECRET=cambill_super_secret_jwt_key_2024
PORT=5000
```

### 2. Seed the database
```bash
npm run seed
```
This creates 10 products + 2 users:
| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@cambill.com        | Admin@123    |
| Cashier | cashier@cambill.com      | Cashier@123  |

### 3. Start the backend
```bash
npm run dev          # or: npm start
```

### 4. Start the frontend (separate terminal)
```bash
cd client
npm run dev
```

Open: **http://localhost:5173**

---

## 📁 Project Structure

```
CamBill/
├── .env
├── package.json
├── src/
│   ├── server.js
│   ├── models/
│   │   ├── Product.js          # Lean schema w/ barcode index
│   │   ├── Sale.js             # Invoice + embedded line items
│   │   └── User.js             # Cashier/Admin w/ bcrypt
│   ├── controllers/
│   │   ├── authController.js   # JWT login/register
│   │   ├── productController.js
│   │   └── saleController.js   # MODULE B: atomic processSale
│   ├── middleware/
│   │   ├── authMiddleware.js   # protect + authorize()
│   │   └── errorMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── saleRoutes.js
│   └── scripts/
│       └── seedProducts.js     # MODULE D: 10 sample products
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # React Router setup
        ├── index.css           # Full design system + print CSS
        ├── main.jsx
        ├── lib/api.js          # Axios with JWT interceptor
        ├── store/store.js      # Zustand: auth + cart w/ debounce
        ├── components/
        │   ├── BarcodeScanner.jsx  # MODULE A: Scanner + overlay
        │   ├── Receipt.jsx         # MODULE C: Print + PDF
        │   ├── Navbar.jsx
        │   └── ProtectedLayout.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── BillingPage.jsx
            ├── DashboardPage.jsx
            └── ProductsPage.jsx
```

---

## 🏗️ Architecture Highlights

### Module A — BarcodeScanner
- `html5-qrcode` supporting EAN-13, UPC-A, QR Code
- Animated viewfinder with scan-line animation
- Handles `NotAllowedError` (camera denied) and `NotFoundError` (no camera)

### Module B — processSale (Atomic Transaction)
```
POST /api/sales
1. startSession() + startTransaction()
2. For each item:
   a. findOne({ barcode }).session(session)  ← document lock
   b. Validate stock
   c. updateOne($inc: { stock: -qty }).session()
3. Sale.create([...], { session })
4. commitTransaction() — or abortTransaction() on any error
```

### Module C — Thermal Receipt CSS
```css
@page { size: 80mm auto; margin: 0; }
@media print {
  /* Hides all UI except .thermal-receipt */
  /* 9pt font, Courier New, full-width receipt */
}
```

### Module D — Seed Data
10 branded products: Amul Milk, Britannia Bread, Coca-Cola, Lay's Chips, Maggi, Fortune Oil, Surf Excel, Colgate, Mother Dairy Paneer, Parle-G

---

## 🔑 API Reference

| Method | Endpoint                       | Auth     | Description            |
|--------|-------------------------------|----------|------------------------|
| POST   | /api/auth/register             | –        | Register user          |
| POST   | /api/auth/login               | –        | Login → JWT            |
| GET    | /api/auth/me                  | Bearer   | Current user           |
| GET    | /api/products                 | Bearer   | List products          |
| GET    | /api/products/barcode/:code   | Bearer   | Lookup by barcode      |
| POST   | /api/products                 | Admin    | Create product         |
| PUT    | /api/products/:id             | Admin    | Update product         |
| DELETE | /api/products/:id             | Admin    | Soft delete product    |
| POST   | /api/sales                   | Bearer   | Process sale (atomic)  |
| GET    | /api/sales                   | Bearer   | Sales history (paged)  |
| GET    | /api/sales/report/summary    | Admin    | Today's revenue KPIs   |
| GET    | /api/sales/:id               | Bearer   | Single invoice         |

---

## 🔒 Security
- JWT (8h expiry) stored in localStorage, injected via Axios interceptor
- Bcrypt (12 rounds) for password hashing
- Helmet.js for HTTP headers
- Role-based middleware: `authorize('admin')` / `authorize('cashier')`
- 401 auto-redirect on expired token

## ⚡ Performance
- MongoDB barcode index → sub-100ms product lookups
- Vite HMR for instant frontend changes
- Zustand optimistic UI (cart updates instantly, server sync happens async)
- Duplicate-debounce: blocks >5 scans/sec of same barcode, 1.5s cooldown
