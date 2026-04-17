import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BillingPage from './pages/BillingPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CashiersPage from './pages/CashiersPage';
import StoreSettingsPage from './pages/StoreSettingsPage';
import ProtectedLayout from './components/ProtectedLayout';
import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '0.855rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected — all authenticated users */}
        <Route element={<ProtectedLayout />}>
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/products" element={<ProductsPage />} />

          {/* Admin-only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cashiers" element={<CashiersPage />} />
            <Route path="/settings" element={<StoreSettingsPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/billing" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
