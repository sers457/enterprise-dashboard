import { useState } from 'react';
import { Plus, MoreHorizontal, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/UI/DataTable';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Dropdown } from '@/components/UI/Dropdown';
import { Modal } from '@/components/UI/Modal';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { InvoiceForm } from './InvoiceForm';
import type { Invoice } from '@/types';

const mockInvoices: Invoice[] = Array.from({ length: 30 }, (_, i) => ({
  id: `inv-${i + 1}`,
  invoiceNumber: `INV-2024-${String(i + 1).padStart(3, '0')}`,
  customerId: `cust-${i + 1}`,
  customerName: ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'DataFlow Ltd', 'CloudNine'][i % 5],
  items: [],
  subtotal: 1000 + Math.random() * 20000,
  tax: 100 + Math.random() * 2000,
  discount: 0,
  total: 1200 + Math.random() * 22000,
  status: (['draft', 'sent', 'paid', 'overdue', 'cancelled'] as Invoice['status'][])[i % 5],
  dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
}));

const statusColors: Record<string, string> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'warning',
};

export default function InvoiceList() {
  const [showForm, setShowForm] = useState(false);

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice', sortable: true, render: (inv: Invoice) => (
      <span className="font-medium text-primary-600 dark:text-primary-400">{inv.invoiceNumber}</span>
    )},
    { key: 'customerName', header: 'Customer', sortable: true },
    { key: 'total', header: 'Amount', sortable: true, render: (inv: Invoice) => (
      <span className="font-medium">${inv.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
    )},
    { key: 'status', header: 'Status', render: (inv: Invoice) => (
      <Badge variant={statusColors[inv.status] as 'default' | 'info' | 'success' | 'danger' | 'warning'} dot size="sm">{inv.status}</Badge>
    )},
    { key: 'dueDate', header: 'Due Date', sortable: true, render: (inv: Invoice) => new Date(inv.dueDate).toLocaleDateString() },
    { key: 'actions', header: '', width: '60px', render: () => (
      <Dropdown trigger={<MoreHorizontal className="h-4 w-4 text-neutral-400" />}
        items={[
          { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => {} },
          { label: 'Edit', onClick: () => {} },
          { divider: true } as const,
          { label: 'Delete', danger: true, onClick: () => {} },
        ]}
      />
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Invoices</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mockInvoices as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as Invoice).id}
        searchable
        searchKeys={['invoiceNumber', 'customerName']}
        exportable
        pageSize={10}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Invoice" size="xl">
        <InvoiceForm onClose={() => setShowForm(false)} />
      </Modal>
    </motion.div>
  );
}
