import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Input } from '@/components/UI/Input';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { cn } from '@/lib/utils';

const transactions = Array.from({ length: 50 }, (_, i) => ({
  id: `tx-${i}`,
  description: ['Invoice payment', 'Subscription fee', 'Refund', 'Service charge', 'Transfer'][i % 5] + ` #${i + 1}`,
  amount: Math.round(100 + Math.random() * 50000),
  type: (['income', 'expense'] as const)[i % 2],
  category: ['Revenue', 'Operations', 'Refunds', 'Services', 'Transfers'][i % 5],
  status: (['completed', 'pending', 'failed'] as const)[i % 3],
  date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
}));

export default function TransactionList() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const filtered = transactions.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Transactions</h1>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-dark-800 rounded-lg p-1">
          {['all', 'income', 'expense'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                filter === f ? 'bg-primary-500 text-white' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm"><Filter className="h-4 w-4" /></Button>
      </div>

      <GlassCard className="p-6">
        <div className="space-y-2">
          {filtered.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-dark-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  tx.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                )}>
                  {tx.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{tx.description}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-semibold', tx.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                  {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                </p>
                <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'} size="sm">
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
