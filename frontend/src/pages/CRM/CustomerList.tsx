import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal, Building2, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/UI/DataTable';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Dropdown } from '@/components/UI/Dropdown';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import type { Customer } from '@/types';
import { cn } from '@/lib/utils';

const mockCustomers: Customer[] = Array.from({ length: 50 }, (_, i) => ({
  id: `cust-${i + 1}`,
  name: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'DataFlow Ltd', 'CloudNine', 'InnovateTech', 'Prime Systems', 'NexGen Inc'][i % 8],
  email: `contact@company${i + 1}.com`,
  phone: `+1 (555) ${String(100 + i).slice(1)}-${String(1000 + i).slice(1)}`,
  company: ['Acme Corp', 'TechStart Inc', 'Global Solutions'][i % 3],
  status: (['active', 'inactive', 'lead', 'churned'] as Customer['status'][])[i % 4],
  totalSpent: Math.random() * 50000,
  ordersCount: Math.floor(Math.random() * 50),
  lastOrder: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  tags: ['enterprise', 'tech', 'saas'].slice(0, (i % 3) + 1),
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'default',
  lead: 'info',
  churned: 'danger',
};

export default function CustomerList() {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      width: '220px',
      render: (customer: Customer) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-white">{customer.name}</p>
          <p className="text-xs text-neutral-400">{customer.company}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact',
      render: (customer: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Mail className="h-3 w-3" /> {customer.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Phone className="h-3 w-3" /> {customer.phone}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (customer: Customer) => (
        <Badge variant={statusColors[customer.status] as 'success' | 'default' | 'info' | 'danger'} dot size="sm">
          {customer.status}
        </Badge>
      ),
    },
    {
      key: 'totalSpent',
      header: 'Total Spent',
      sortable: true,
      render: (customer: Customer) => (
        <span className="font-medium text-neutral-900 dark:text-white">
          ${customer.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      key: 'ordersCount',
      header: 'Orders',
      sortable: true,
      render: (customer: Customer) => (
        <span className="text-sm text-neutral-500">{customer.ordersCount}</span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (customer: Customer) => (
        <div className="flex gap-1 flex-wrap">
          {customer.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (customer: Customer) => (
        <Dropdown
          trigger={<MoreHorizontal className="h-4 w-4 text-neutral-400" />}
          items={[
            { label: 'View Details', onClick: () => navigate(`/crm/${customer.id}`) },
            { label: 'Edit', onClick: () => {} },
            { divider: true } as const,
            { label: 'Delete', danger: true, onClick: () => {} },
          ]}
        />
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Customers</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mockCustomers as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as Customer).id}
        searchable
        searchKeys={['name', 'email', 'company']}
        selectable
        exportable
        pageSize={10}
        onRowClick={(item) => navigate(`/crm/${(item as unknown as Customer).id}`)}
      />
    </motion.div>
  );
}
