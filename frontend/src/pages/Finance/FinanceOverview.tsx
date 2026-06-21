import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/UI/GlassCard';
import { StatCard } from '@/components/UI/StatCard';
import { Chart } from '@/components/UI/Chart';
import { Badge } from '@/components/UI/Badge';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { cn } from '@/lib/utils';

const monthlyData = Array.from({ length: 12 }, (_, i) => ({
  name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  Revenue: 40000 + Math.random() * 60000,
  Expenses: 25000 + Math.random() * 30000,
}));

const recentTransactions = [
  { id: '1', description: 'Invoice payment - Acme Corp', amount: 12500, type: 'income', date: '2 min ago', status: 'completed' },
  { id: '2', description: 'AWS Cloud Services', amount: 3840, type: 'expense', date: '1 hour ago', status: 'completed' },
  { id: '3', description: 'Stripe payout - Feb 2024', amount: 28400, type: 'income', date: '3 hours ago', status: 'pending' },
  { id: '4', description: 'Office rent - March', amount: 8500, type: 'expense', date: '1 day ago', status: 'completed' },
  { id: '5', description: 'Client project - TechStart', amount: 22000, type: 'income', date: '2 days ago', status: 'completed' },
];

const invoicesByStatus = [
  { name: 'Paid', value: 145, color: '#10b981' },
  { name: 'Pending', value: 38, color: '#f59e0b' },
  { name: 'Overdue', value: 12, color: '#ef4444' },
  { name: 'Draft', value: 25, color: '#6366f1' },
];

export default function FinanceOverview() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Finance Overview</h1>
        <Breadcrumb />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={1245000} format="currency" icon={<DollarSign className="h-5 w-5" />} trend={12.5} />
        <StatCard label="Total Expenses" value={685000} format="currency" icon={<CreditCard className="h-5 w-5" />} trend={-3.2} color="rose" />
        <StatCard label="Net Profit" value={560000} format="currency" icon={<TrendingUp className="h-5 w-5" />} trend={18.7} color="emerald" />
        <StatCard label="Pending Invoices" value={284500} format="currency" icon={<Receipt className="h-5 w-5" />} trend={-5.1} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Revenue vs Expenses</h3>
            <Chart data={monthlyData} type="area" yKeys={['Revenue', 'Expenses']} colors={['#6366f1', '#ef4444']} height={300} />
          </GlassCard>
        </div>
        <div>
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Invoice Status</h3>
            <Chart data={invoicesByStatus} type="donut" height={280} colors={['#10b981', '#f59e0b', '#ef4444', '#6366f1']} />
          </GlassCard>
        </div>
      </div>

      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((tx, i) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
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
                    <span>{tx.date}</span>
                    <Badge variant={tx.status === 'completed' ? 'success' : 'warning'} size="sm">{tx.status}</Badge>
                  </div>
                </div>
              </div>
              <span className={cn(
                'text-sm font-semibold',
                tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              )}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
