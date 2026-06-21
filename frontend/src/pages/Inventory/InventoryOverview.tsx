import { Package, AlertTriangle, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/UI/GlassCard';
import { StatCard } from '@/components/UI/StatCard';
import { Badge } from '@/components/UI/Badge';
import { Progress } from '@/components/UI/Progress';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { cn } from '@/lib/utils';

const lowStockItems = [
  { product: 'Analytics Pro License', sku: 'AP-001', stock: 5, minStock: 20, status: 'critical' },
  { product: 'Cloud Storage 1TB', sku: 'CS-100', stock: 12, minStock: 30, status: 'low' },
  { product: 'Security Token', sku: 'ST-050', stock: 8, minStock: 15, status: 'low' },
  { product: 'API Gateway License', sku: 'AG-010', stock: 3, minStock: 25, status: 'critical' },
];

const categories = [
  { name: 'Software Licenses', count: 45, value: 280000, color: '#6366f1' },
  { name: 'Hardware', count: 28, value: 145000, color: '#8b5cf6' },
  { name: 'Cloud Services', count: 15, value: 95000, color: '#10b981' },
  { name: 'Security', count: 22, value: 72000, color: '#f59e0b' },
  { name: 'Accessories', count: 35, value: 35000, color: '#06b6d4' },
];

export default function InventoryOverview() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Inventory Overview</h1>
        <Breadcrumb />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={145} icon={<Package className="h-5 w-5" />} trend={5.2} />
        <StatCard label="Total Value" value={627000} format="currency" icon={<DollarSign className="h-5 w-5" />} trend={8.1} color="emerald" />
        <StatCard label="Low Stock Items" value={4} icon={<AlertTriangle className="h-5 w-5" />} trend={-12.5} color="amber" />
        <StatCard label="Orders This Month" value={28} icon={<RefreshCw className="h-5 w-5" />} trend={15.3} color="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Inventory Categories</h3>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{cat.name}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">{cat.count} items</span>
                  </div>
                  <Progress value={(cat.count / 45) * 100} variant="primary" size="sm" />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
        <div>
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Low Stock Alerts</h3>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.sku} className="p-3 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.product}</p>
                    <Badge variant={item.status === 'critical' ? 'danger' : 'warning'} size="sm">
                      {item.stock} left
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">SKU: {item.sku}</p>
                  <Progress
                    value={(item.stock / item.minStock) * 100}
                    variant={item.status === 'critical' ? 'danger' : 'warning'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
}
