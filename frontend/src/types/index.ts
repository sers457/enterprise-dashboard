export type ThemeMode = 'light' | 'dark' | 'system';

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';

export type UserPermission = 
  | 'users:read' | 'users:write' | 'users:delete'
  | 'analytics:read' | 'analytics:export'
  | 'crm:read' | 'crm:write' | 'crm:delete'
  | 'finance:read' | 'finance:write'
  | 'inventory:read' | 'inventory:write' | 'inventory:delete'
  | 'ai:read' | 'ai:write'
  | 'settings:read' | 'settings:write';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  permissions: UserPermission[];
  isActive: boolean;
  isMFAEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresMFA: boolean;
  mfaToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  mfaToken?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'lead' | 'churned';
  avatar?: string;
  totalSpent: number;
  ordersCount: number;
  lastOrder?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  probability: number;
  assignedTo?: string;
  notes?: string;
  lastContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  status: 'active' | 'inactive' | 'discontinued';
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  status: 'active' | 'inactive';
  products: string[];
  rating: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';
  total: number;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  category: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  date: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AnalyticsData {
  revenue: number;
  users: number;
  orders: number;
  conversionRate: number;
  revenueGrowth: number;
  usersGrowth: number;
  ordersGrowth: number;
  conversionGrowth: number;
  revenueHistory: ChartData[];
  userHistory: ChartData[];
  orderHistory: ChartData[];
}

export interface KPIData {
  label: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format?: 'currency' | 'number' | 'percent';
  icon?: string;
  color?: string;
}

export interface ChartData {
  name: string;
  value: number;
  secondary?: number;
  category?: string;
  color?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'inactive' | 'draft';
  lastRun?: string;
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'list' | 'ai' | 'custom';
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position: { x: number; y: number };
  config?: Record<string, unknown>;
  visible: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
  errors?: Record<string, string[]>;
}
