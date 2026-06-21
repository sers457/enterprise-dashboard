import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, ShoppingCart, Activity, Zap, BarChart3, Download } from 'lucide-react';
import { KPICard } from '@/components/UI/KPICard';
import { StatCard } from '@/components/UI/StatCard';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { RevenueChart } from '@/components/Charts/RevenueChart';
import { CustomerChart } from '@/components/Charts/CustomerChart';
import { SkeletonCard, SkeletonChart } from '@/components/UI/Skeleton';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { useDashboardStore } from '@/store/dashboardStore';

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(false);
  const { isEditing, toggleEditing } = useDashboardStore();

  const recentActivity = [
    { user: 'John Doe', action: 'created a new invoice', target: 'INV-2024-001', time: '2 min ago', type: 'success' },
    { user: 'Sarah Smith', action: 'updated user permissions for', target: 'Marketing Team', time: '15 min ago', type: 'info' },
    { user: 'Mike Johnson', action: 'added new product', target: 'Analytics Pro v3', time: '1 hour ago', type: 'warning' },
    { user: 'Emily Davis', action: 'closed deal with', target: 'Acme Corp', time: '2 hours ago', type: 'success' },
    { user: 'Alex Brown', action: 'flagged suspicious activity from', target: 'IP 192.168.1.1', time: '3 hours ago', type: 'error' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Executive Dashboard</h1>
          <Breadcrumb />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={toggleEditing}>
            {isEditing ? 'Done Editing' : 'Edit Widgets'}
          </Button>
          <Button variant="primary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard
              label="Total Revenue"
              value={2845000}
              previousValue={2200000}
              format="currency"
              icon={<DollarSign className="h-5 w-5" />}
              trend="up"
            />
            <KPICard
              label="Active Users"
              value={28450}
              previousValue={22400}
              format="number"
              icon={<Users className="h-5 w-5" />}
              trend="up"
            />
            <KPICard
              label="Growth Rate"
              value={23.5}
              previousValue={18.2}
              format="percent"
              icon={<TrendingUp className="h-5 w-5" />}
              trend="up"
            />
            <KPICard
              label="Total Orders"
              value={12840}
              previousValue={11200}
              format="number"
              icon={<ShoppingCart className="h-5 w-5" />}
              trend="up"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? <SkeletonChart /> : <RevenueChart />}
        </div>
        <div>
          {loading ? <SkeletonChart /> : <CustomerChart />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">AI Insights Summary</h3>
          <div className="space-y-4">
            {[
              { title: 'Revenue Trend', desc: 'Revenue is projected to increase by 15% next quarter based on current momentum.', type: 'positive' },
              { title: 'Customer Alert', desc: 'Customer churn rate decreased by 3% after implementing the new onboarding flow.', type: 'positive' },
              { title: 'Opportunity', desc: 'Enterprise segment shows 40% higher LTV - consider allocating more resources.', type: 'info' },
              { title: 'Risk Warning', desc: 'Inventory levels for Product A are below threshold. Restock recommended.', type: 'warning' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-dark-800/50">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  insight.type === 'positive' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
                  insight.type === 'info' && 'bg-sky-100 dark:bg-sky-900/30 text-sky-600',
                  insight.type === 'warning' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                )}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{insight.title}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Activity</h3>
            <Badge variant="primary" size="sm">Live</Badge>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                  item.type === 'success' && 'bg-emerald-500',
                  item.type === 'info' && 'bg-sky-500',
                  item.type === 'warning' && 'bg-amber-500',
                  item.type === 'error' && 'bg-red-500',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="font-medium text-neutral-900 dark:text-white">{item.user}</span>{' '}
                    {item.action}{' '}
                    <span className="font-medium text-primary-600 dark:text-primary-400">{item.target}</span>
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={2845000}
          format="currency"
          icon={<DollarSign className="h-5 w-5" />}
          trend={15.3}
          color="primary"
        />
        <StatCard
          label="Active Users"
          value={28450}
          icon={<Users className="h-5 w-5" />}
          trend={8.2}
          color="emerald"
        />
        <StatCard
          label="Avg Order Value"
          value={342}
          format="currency"
          icon={<ShoppingCart className="h-5 w-5" />}
          trend={-2.1}
          color="amber"
        />
        <StatCard
          label="Conversion Rate"
          value={3.42}
          format="percent"
          icon={<BarChart3 className="h-5 w-5" />}
          trend={12.5}
          color="sky"
        />
      </div>
    </motion.div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
