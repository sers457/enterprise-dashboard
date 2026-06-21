import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter, Save, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { GlassCard } from '@/components/UI/GlassCard';
import { Button } from '@/components/UI/Button';
import { Tabs } from '@/components/UI/Tabs';
import { Chart } from '@/components/UI/Chart';
import { StatCard } from '@/components/UI/StatCard';
import { Breadcrumb } from '@/components/Layout/Breadcrumb';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'users', label: 'Users' },
  { id: 'conversion', label: 'Conversion' },
];

const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
  name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  revenue: 30000 + Math.random() * 70000,
  expenses: 20000 + Math.random() * 30000,
  profit: 10000 + Math.random() * 40000,
}));

const userGrowth = Array.from({ length: 12 }, (_, i) => ({
  name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  'New Users': 500 + Math.random() * 2000,
  'Active Users': 3000 + Math.random() * 5000,
}));

export default function AnalyticsCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('1Y');

  const ranges = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics Center</h1>
          <Breadcrumb />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Calendar className="h-4 w-4" />
            {dateRange}
          </Button>
          <Button variant="secondary" size="sm">
            <Save className="h-4 w-4" />
            Save Report
          </Button>
          <Button variant="primary" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={2845000} format="currency" icon={<DollarSign className="h-5 w-5" />} trend={15.3} />
        <StatCard label="Users" value={28450} icon={<Users className="h-5 w-5" />} trend={8.2} color="emerald" />
        <StatCard label="Conversion" value={3.42} format="percent" icon={<TrendingUp className="h-5 w-5" />} trend={12.5} color="amber" />
        <StatCard label="Active Reports" value={24} icon={<BarChart3 className="h-5 w-5" />} trend={5.1} color="sky" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-neutral-500">Date Range:</span>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-dark-800 rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                dateRange === r
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Revenue vs Expenses</h3>
          <Chart
            data={monthlyRevenue}
            type="area"
            yKeys={['revenue', 'expenses', 'profit']}
            colors={['#6366f1', '#f59e0b', '#10b981']}
            height={280}
          />
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">User Growth</h3>
          <Chart
            data={userGrowth}
            type="line"
            yKeys={['New Users', 'Active Users']}
            colors={['#8b5cf6', '#06b6d4']}
            height={280}
          />
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">AI Insights</h3>
            <p className="text-sm text-neutral-500">Intelligent analysis powered by AI</p>
          </div>
          <Button variant="secondary" size="sm">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'Revenue Growth', desc: 'Revenue increased 23% compared to last quarter. Strong performance in Enterprise segment.', type: 'positive' },
            { title: 'User Retention', desc: 'User retention rate is 87% - above industry average. Onboarding improvements are working.', type: 'positive' },
            { title: 'Anomaly Detected', desc: 'Unusual spike in sign-ups detected from region APAC. Investigate potential bot activity.', type: 'warning' },
          ].map((insight, i) => (
            <div key={i} className={cn(
              'p-4 rounded-xl border',
              insight.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
            )}>
              <p className="font-medium text-sm text-neutral-900 dark:text-white mb-1">{insight.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{insight.desc}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
