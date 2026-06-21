import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BarChart3, TrendingUp, Database, Brain,
  Settings, ChevronLeft, ChevronDown, UserCheck, Package, Receipt,
  ShoppingCart, Activity, FileText, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/dashboard' },
  { label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, path: '/analytics' },
  {
    label: 'Users',
    icon: <Users className="h-5 w-5" />,
    children: [
      { label: 'All Users', path: '/users' },
      { label: 'Roles', path: '/users/roles' },
    ],
  },
  {
    label: 'CRM',
    icon: <UserCheck className="h-5 w-5" />,
    children: [
      { label: 'Customers', path: '/crm' },
      { label: 'Leads Pipeline', path: '/crm/leads' },
    ],
  },
  {
    label: 'Finance',
    icon: <TrendingUp className="h-5 w-5" />,
    children: [
      { label: 'Overview', path: '/finance' },
      { label: 'Invoices', path: '/finance/invoices' },
      { label: 'Transactions', path: '/finance/transactions' },
    ],
  },
  {
    label: 'Inventory',
    icon: <Package className="h-5 w-5" />,
    children: [
      { label: 'Overview', path: '/inventory' },
      { label: 'Products', path: '/inventory/products' },
      { label: 'Purchase Orders', path: '/inventory/purchase-orders' },
    ],
  },
  { label: 'AI Command Center', icon: <Brain className="h-5 w-5" />, path: '/ai' },
  { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Users', 'CRM', 'Finance', 'Inventory']);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isActive = (path?: string) => path && location.pathname.startsWith(path);
  const isChildActive = (children: { path: string }[]) => children.some((c) => location.pathname === c.path);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col',
        'bg-white/80 dark:bg-dark-950/90 backdrop-blur-xl',
        'border-r border-neutral-200/50 dark:border-neutral-800/50',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-neutral-200/50 dark:border-neutral-800/50',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-neutral-900 dark:text-white">Enterprise</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center">
            <Activity className="h-4 w-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-800 transition-colors">
            <ChevronLeft className="h-4 w-4 text-neutral-400" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {navItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus.includes(item.label);
          const active = item.path ? isActive(item.path) : isChildActive(item.children || []);

          return (
            <div key={item.label} className="mb-1">
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                    )}
                  >
                    <span className={cn(active && 'text-primary-600 dark:text-primary-400')}>{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                      </>
                    )}
                  </button>
                  {!collapsed && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-9 mt-1 space-y-0.5">
                            {item.children!.map((child) => (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive: active }) => cn(
                                  'block px-3 py-2 rounded-lg text-sm transition-all duration-200',
                                  active
                                    ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 font-medium'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-dark-800'
                                )}
                              >
                                {child.label}
                              </NavLink>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path!}
                  className={({ isActive: active }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-800 hover:text-neutral-900 dark:hover:text-neutral-200'
                  )}
                >
                  <span className={cn(isActive(item.path) && 'text-primary-600 dark:text-primary-400')}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-500/5 dark:to-secondary-500/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">John Doe</p>
              <p className="text-[10px] text-neutral-400 truncate">Super Admin</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
