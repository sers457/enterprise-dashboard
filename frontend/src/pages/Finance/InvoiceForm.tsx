import { useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Trash2, Plus } from 'lucide-react';

interface InvoiceFormProps {
  onClose: () => void;
}

export function InvoiceForm({ onClose }: InvoiceFormProps) {
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">Customer</label>
          <select className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-4 py-2.5 text-sm">
            <option>Select customer...</option>
            <option>Acme Corp</option>
            <option>TechStart Inc</option>
            <option>Global Solutions</option>
          </select>
        </div>
        <Input label="Invoice Date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
      </div>
      <Input label="Due Date" type="date" defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Invoice Items</label>
          <Button variant="secondary" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3" /> Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-end gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
              <div className="flex-1">
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-3 py-2 text-sm"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-3 py-2 text-sm"
                />
              </div>
              <div className="w-28">
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-800 px-3 py-2 text-sm"
                />
              </div>
              <div className="w-24 text-right text-sm font-medium text-neutral-900 dark:text-white py-2">
                ${(item.quantity * item.unitPrice).toLocaleString()}
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="p-2 text-neutral-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="text-right">
          <p className="text-sm text-neutral-500">Subtotal</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">${total.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button variant="primary" className="flex-1">Create Invoice</Button>
      </div>
    </div>
  );
}
