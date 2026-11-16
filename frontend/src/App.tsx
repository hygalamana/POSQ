import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import PosPage from './pages/Pos';
import LoginPage from './pages/Login';

// Lazy-loaded pages to keep the initial POS bundle super lightweight
const TransactionsPage = lazy(() => import('./pages/Transactions'));
const ProductsManagementPage = lazy(() => import('./pages/Products'));
const ReportsPage = lazy(() => import('./pages/Reports'));
const ReceiptPage = lazy(() => import('./pages/Receipt'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const AccountsPage = lazy(() => import('./pages/SettingsAccounts'));
const BackupRestorePage = lazy(() => import('./pages/SettingsBackup'));
const CashflowPage = lazy(() => import('./pages/SettingsCashflow'));
const MembersPage = lazy(() => import('./pages/SettingsMembers'));

const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<PosPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/products" element={<ProductsManagementPage />} />
            <Route path="/receipt/:id" element={<ReceiptPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/accounts" element={<AccountsPage />} />
            <Route path="/settings/backup" element={<BackupRestorePage />} />
            <Route path="/settings/cashflow" element={<CashflowPage />} />
            <Route path="/settings/members" element={<MembersPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
