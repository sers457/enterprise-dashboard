import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter(Boolean);

  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    users: 'Users',
    roles: 'Roles',
    crm: 'CRM',
    leads: 'Leads Pipeline',
    customers: 'Customers',
    finance: 'Finance',
    invoices: 'Invoices',
    transactions: 'Transactions',
    inventory: 'Inventory',
    products: 'Products',
    'purchase-orders': 'Purchase Orders',
    ai: 'AI Command Center',
    settings: 'Settings',
  };

  return (
    <nav className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
      <Link to="/dashboard" className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {paths.map((path, idx) => {
        const href = '/' + paths.slice(0, idx + 1).join('/');
        const isLast = idx === paths.length - 1;
        return (
          <div key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="text-neutral-900 dark:text-white font-medium">
                {labels[path] || path.charAt(0).toUpperCase() + path.slice(1)}
              </span>
            ) : (
              <Link
                to={href}
                className="hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
              >
                {labels[path] || path.charAt(0).toUpperCase() + path.slice(1)}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
