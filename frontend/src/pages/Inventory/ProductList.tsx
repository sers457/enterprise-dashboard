import { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '@/components/UI/DataTable';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Dropdown } from '@/components/UI/Dropdown';
import { Modal } from '@/components/UI/Modal';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { ProductForm } from './ProductForm';
import type { Product } from '@/types';

const mockProducts: Product[] = Array.from({ length: 40 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: ['Analytics Pro', 'Cloud Suite', 'Security+', 'Data Hub', 'AI Engine', 'Mobile SDK', 'Dev Tools', 'API Gateway'][i % 8] + ` v${Math.floor(i / 8) + 1}`,
  sku: `${['AP', 'CS', 'SP', 'DH', 'AI', 'MS', 'DT', 'AG'][i % 8]}-${String(i + 1).padStart(3, '0')}`,
  category: ['Software', 'Cloud', 'Security', 'Data', 'AI', 'Mobile', 'Tools', 'API'][i % 8],
  price: 99 + Math.random() * 900,
  cost: 30 + Math.random() * 200,
  stock: Math.floor(Math.random() * 200),
  minStock: 20,
  unit: 'license',
  status: (['active', 'inactive', 'discontinued'] as Product['status'][])[i % 3],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

export default function ProductList() {
  const [showForm, setShowForm] = useState(false);

  const columns = [
    { key: 'name', header: 'Product', sortable: true, width: '220px', render: (p: Product) => (
      <div>
        <p className="font-medium text-neutral-900 dark:text-white">{p.name}</p>
        <p className="text-xs text-neutral-400">SKU: {p.sku}</p>
      </div>
    )},
    { key: 'category', header: 'Category', sortable: true },
    { key: 'price', header: 'Price', sortable: true, render: (p: Product) => (
      <span className="font-medium">${p.price.toFixed(2)}</span>
    )},
    { key: 'stock', header: 'Stock', sortable: true, render: (p: Product) => (
      <span className={p.stock < p.minStock ? 'text-red-600 dark:text-red-400 font-medium' : ''}>{p.stock}</span>
    )},
    { key: 'status', header: 'Status', render: (p: Product) => (
      <Badge variant={p.status === 'active' ? 'success' : p.status === 'inactive' ? 'default' : 'warning'} dot size="sm">{p.status}</Badge>
    )},
    { key: 'actions', header: '', width: '60px', render: () => (
      <Dropdown trigger={<MoreHorizontal className="h-4 w-4 text-neutral-400" />}
        items={[
          { label: 'Edit', onClick: () => {} },
          { label: 'Duplicate', onClick: () => {} },
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
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Products</h1>
          <Breadcrumb />
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={mockProducts as unknown as Record<string, unknown>[]}
        keyExtractor={(item) => (item as unknown as Product).id}
        searchable
        searchKeys={['name', 'sku', 'category']}
        exportable
        pageSize={10}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Product" size="lg">
        <ProductForm onClose={() => setShowForm(false)} />
      </Modal>
    </motion.div>
  );
}
