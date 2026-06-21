import { Plus, MoreHorizontal, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/UI/DataTable';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Dropdown } from '@/components/UI/Dropdown';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';

const mockPOs = Array.from({ length: 25 }, (_, i) => ({
  id: `po-${i + 1}`,
  poNumber: `PO-2024-${String(i + 1).padStart(4, '0')}`,
  supplierName: ['TechSupply Co', 'Global Parts Inc', 'DigitalWare', 'CloudSource', 'HardwareHub'][i % 5],
  status: (['draft', 'pending', 'approved', 'shipped', 'received', 'cancelled'] as const)[i % 6],
  total: Math.round(1000 + Math.random() * 50000),
  expectedDate: new Date(Date.now() + Math.random() * 30 * 86400000).toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
}));

const statusColors: Record<string, string> = {
  draft: 'default',
  pending: 'info',
  approved: 'primary',
  shipped: 'warning',
  received: 'success',
  cancelled: 'danger',
};

export default function PurchaseOrderList() {
  const columns = [
    { key: 'poNumber', header: 'PO Number', sortable: true, render: (po: typeof mockPOs[0]) => (
      <span className="font-medium text-primary-600 dark:text-primary-400">{po.poNumber}</span>
    )},
    { key: 'supplierName', header: 'Supplier', sortable: true },
    { key: 'total', header: 'Total', sortable: true, render: (po: typeof mockPOs[0]) => (
      <span className="font-medium">${po.total.toLocaleString()}</span>
    )},
    { key: 'status', header: 'Status', render: (po: typeof mockPOs[0]) => (
      <Badge variant={statusColors[po.status] as 'default' | 'info' | 'primary' | 'warning' | 'success' | 'danger'} dot size="sm">{po.status}</Badge>
    )},
    { key: 'expectedDate', header: 'Expected', render: (po: typeof mockPOs[0]) => new Date(po.expectedDate).toLocaleDateString() },
    { key: 'actions', header: '', width: '60px', render: () => (
      <Dropdown trigger={<MoreHorizontal className="h-4 w-4 text-neutral-400" />}
        items={[
          { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => {} },
          { label: 'Edit', onClick: () => {} },
          { divider: true } as const,
          { label: 'Cancel', danger: true, onClick: () => {} },
        ]}
      />
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Purchase Orders</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" />
          New PO
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mockPOs as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as typeof mockPOs[0]).id}
        searchable
        searchKeys={['poNumber', 'supplierName']}
        exportable
        pageSize={10}
      />
    </motion.div>
  );
}
