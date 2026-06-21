import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Toggle } from '@/components/UI/Toggle';
import { useState } from 'react';

interface ProductFormProps {
  onClose: () => void;
}

export function ProductForm({ onClose }: ProductFormProps) {
  const [active, setActive] = useState(true);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Name" placeholder="Enter product name" />
        <Input label="SKU" placeholder="e.g. AP-001" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">Category</label>
          <select className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-4 py-2.5 text-sm">
            <option>Software</option>
            <option>Cloud</option>
            <option>Security</option>
            <option>Hardware</option>
          </select>
        </div>
        <Input label="Unit" placeholder="e.g. license, piece" defaultValue="license" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Price ($)" type="number" placeholder="0.00" />
        <Input label="Cost ($)" type="number" placeholder="0.00" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Stock Quantity" type="number" placeholder="0" />
        <Input label="Min Stock Level" type="number" placeholder="0" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">Description</label>
        <textarea className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-4 py-2.5 text-sm resize-none h-24" placeholder="Product description..." />
      </div>
      <Toggle label="Active" checked={active} onChange={setActive} />
      <div className="flex items-center gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="primary" className="flex-1">Save Product</Button>
      </div>
    </div>
  );
}
