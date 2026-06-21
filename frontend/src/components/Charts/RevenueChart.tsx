import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LinearGradient } from 'recharts';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

const data = [
  { month: 'Jan', revenue: 45000, previous: 38000 },
  { month: 'Feb', revenue: 52000, previous: 42000 },
  { month: 'Mar', revenue: 48000, previous: 40000 },
  { month: 'Apr', revenue: 61000, previous: 45000 },
  { month: 'May', revenue: 58000, previous: 48000 },
  { month: 'Jun', revenue: 72000, previous: 52000 },
  { month: 'Jul', revenue: 68000, previous: 55000 },
  { month: 'Aug', revenue: 75000, previous: 58000 },
  { month: 'Sep', revenue: 82000, previous: 62000 },
  { month: 'Oct', revenue: 78000, previous: 60000 },
  { month: 'Nov', revenue: 85000, previous: 65000 },
  { month: 'Dec', revenue: 95000, previous: 72000 },
];

const ranges = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

export function RevenueChart() {
  const [range, setRange] = useState('1Y');
  const isDark = useThemeStore((s) => s.resolvedTheme === 'dark');

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Revenue Overview</h3>
          <p className="text-sm text-neutral-500">Monthly revenue performance</p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-dark-800 rounded-lg p-1">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                range === r
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2a2a35' : '#e5e7eb'} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                return (
                  <div className="bg-white dark:bg-dark-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-3">
                    <p className="text-xs font-medium text-neutral-500 mb-2">{label}</p>
                    {payload.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-neutral-700 dark:text-neutral-300">{entry.name}:</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          ${(entry.value as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="previous" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" fill="url(#previousGradient)" name="Previous" dot={false} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGradient)" name="Revenue" dot={{ r: 3, strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
