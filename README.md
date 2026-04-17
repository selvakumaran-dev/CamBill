# 🛒 CamBill — Enterprise POS & Billing Ecosystem

![CamBill Presentation](https://via.placeholder.com/1200x400/10b981/ffffff?text=CamBill+Enterprise+POS)

**CamBill** is a highly concurrent, Multi-Tenant Progressive Web Application (PWA) built on the MERN stack. Designed specifically for modern supermarkets and retail environments, CamBill provides lightning-fast barcode checkout capabilities, deep offline synchronization hooks, and comprehensive analytics charting—all housed within a premium, meticulously designed UI.

---

## ⚡ Core Features

- **🏢 Multi-Tenant Data Isolation:** Architected so Supermarket Owners (Admins) safely manage independent databases of products, cashiers, and sales ledgers without cross-contamination.
- **📈 Advanced Analytics:** Visual Dashboard powered by **Recharts**, graphing rolling 7-day revenue aggregates and item category allocations.
- **📡 Ultimate Offline PWA:** Integrates `IndexedDB` and `idb-keyval` to securely cache product catalogs allowing barcoding and checkout workflows during WiFi outages. Silently synchronizes cached sales to MongoDB automatically once reconnected!
- **🧾 Thermal Receipt Generation:** Dynamically populated 80mm-formatted digital receipts using `jsPDF` and `react-to-print`, supporting explicit tax mapping (SGST/CGST) and generated Libre Barcode signatures.
- **⏸️ Cart Queuing / Hold Bills:** Enables cashiers to suspend multiple active shopping carts into memory (saving them with timestamps) to prevent line bottlenecks.
- **📷 Device-Native Scanning:** Embedded `html5-qrcode` engine converts any physical laptop webcam or smartphone camera into an instant EAN-13/UPC-A barcode parser.

---

## 🛠 Tech Stack

**Front-End:**
- React + Vite.js (Lightning Fast HMR)
- Zustand (Complex Cart State Management)
- CSS3 Design System (Vanilla, Zero-dependencies, Tailwind-inspired Variables)
- Recharts (Data Visualization)
- Vite PWA Plugin (Service Workers & Offline Capabilities)

**Back-End:**
- Node.js & Express.js 4.x
- MongoDB + Mongoose (Atomic Transactions & Store-Level Aggregation Pipes)
- JSON Web Tokens (Secure Admin / Cashier RBAC Logic)
- Bcrypt.js (Credential Encryption)

---

## 🚀 Quick Start (Local Development)

### Prerequisites:
- `Node.js` (v18+)
- `MongoDB` (Running locally or via Atlas)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/cambill.git
cd cambill

# Install Backend Dependencies
npm install

# Install Frontend Dependencies
cd client
npm install --legacy-peer-deps
```

### 2. Environment Variables
Create a `.env` file in the root `cambill/` directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cambill
JWT_SECRET=super_secret_enterprise_key_2026
CORS_ORIGIN=http://localhost:5173
```

### 3. Run the Development Server
Split into two terminals, or use a tool like concurrently:
```bash
# Terminal 1: Backend Server (Monitors Port 5000)
npm run dev

# Terminal 2: Vite Frontend (Monitors Port 5173)
cd client
npm run dev
```

---

## ☁️ Deployment (Render.com)

CamBill is natively configured for decoupled deployment. 

**Backend (Render Web Service):**
1. Set Root Directory to empty.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Env Vars: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`

**Frontend (Render Static Site):**
1. Set Root Directory to `client`
2. Build Command: `npm install --legacy-peer-deps && npm run build`
3. Publish Directory: `dist`
4. Set Env Vars: `VITE_API_URL=https://your-backend.onrender.com/api`

*Don't forget to pass the created Frontend URL back into the Backend's `CORS_ORIGIN` variable!*

---

<br/>

> 💼 **Built for Performance. Engineered for the Enterprise.**
