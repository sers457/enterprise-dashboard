import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';
import { DashboardLayout } from '@/components/Layout/DashboardLayout';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';

const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ExecutiveDashboard = lazy(() => import('@/pages/Dashboard/ExecutiveDashboard'));
const Dashboard3D = lazy(() => import('@/pages/Dashboard/Dashboard3D'));
const UserList = lazy(() => import('@/pages/Users/UserList'));
const UserDetail = lazy(() => import('@/pages/Users/UserDetail'));
const AnalyticsCenter = lazy(() => import('@/pages/Analytics/AnalyticsCenter'));
const CustomerList = lazy(() => import('@/pages/CRM/CustomerList'));
const CustomerDetail = lazy(() => import('@/pages/CRM/CustomerDetail'));
const LeadPipeline = lazy(() => import('@/pages/CRM/LeadPipeline'));
const FinanceOverview = lazy(() => import('@/pages/Finance/FinanceOverview'));
const InvoiceList = lazy(() => import('@/pages/Finance/InvoiceList'));
const TransactionList = lazy(() => import('@/pages/Finance/TransactionList'));
const InventoryOverview = lazy(() => import('@/pages/Inventory/InventoryOverview'));
const ProductList = lazy(() => import('@/pages/Inventory/ProductList'));
const PurchaseOrderList = lazy(() => import('@/pages/Inventory/PurchaseOrderList'));
const AIAssistantPage = lazy(() => import('@/pages/AI/AIAssistantPage'));
const PromptLibrary = lazy(() => import('@/pages/AI/PromptLibrary'));
const WorkflowList = lazy(() => import('@/pages/AI/WorkflowList'));
const SettingsPage = lazy(() => import('@/pages/Settings/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const { mode, setMode } = useThemeStore();

  useEffect(() => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [mode]);

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ExecutiveDashboard />} />
            <Route path="dashboard" element={<ExecutiveDashboard />} />
            <Route path="dashboard/3d" element={<Dashboard3D />} />
            <Route path="analytics" element={<AnalyticsCenter />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="crm" element={<CustomerList />} />
            <Route path="crm/:id" element={<CustomerDetail />} />
            <Route path="crm/leads" element={<LeadPipeline />} />
            <Route path="finance" element={<FinanceOverview />} />
            <Route path="finance/invoices" element={<InvoiceList />} />
            <Route path="finance/transactions" element={<TransactionList />} />
            <Route path="inventory" element={<InventoryOverview />} />
            <Route path="inventory/products" element={<ProductList />} />
            <Route path="inventory/purchase-orders" element={<PurchaseOrderList />} />
            <Route path="ai" element={<AIAssistantPage />} />
            <Route path="ai/prompts" element={<PromptLibrary />} />
            <Route path="ai/workflows" element={<WorkflowList />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
