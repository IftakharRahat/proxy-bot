import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/UsersPage';
import { ProxiesPage } from './pages/ProxiesPage';
import { InventorySettings } from './pages/InventorySettings';
import { PurchaseHistory } from './pages/PurchaseHistory';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="proxies" element={<ProxiesPage />} />
            <Route path="inventory" element={<InventorySettings />} />
            <Route path="purchases" element={<PurchaseHistory />} />
            <Route path="transactions" element={<div className="p-4">Transactions Page (Coming Soon)</div>} />
            <Route path="settings" element={<div className="p-4">Settings Page (Coming Soon)</div>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
